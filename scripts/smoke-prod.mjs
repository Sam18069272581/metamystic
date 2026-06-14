const DEFAULT_FRONTEND_URL = "https://metamystic.vercel.app";
const DEFAULT_API_BASE_URL = "https://backend-production-3d9d.up.railway.app/api/v1";
const DEFAULT_EMAIL_DOMAIN = "metamystic.local";
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "120000", 10);

const config = {
  frontendUrl: trimTrailingSlashes(process.env.SMOKE_FRONTEND_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_FRONTEND_URL),
  apiBaseUrl: trimTrailingSlashes(process.env.SMOKE_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL),
  emailDomain: process.env.SMOKE_EMAIL_DOMAIN ?? DEFAULT_EMAIL_DOMAIN,
  skipAi: process.env.SMOKE_SKIP_AI === "1" || process.env.SMOKE_SKIP_AI === "true"
};

const summary = [];

async function main() {
  await step("frontend", "Frontend returns a Next.js page", smokeFrontend);
  await step("health", "Backend health endpoint is ok", smokeHealth);
  await step("anonymous-bazi", "Anonymous profile can create a Bazi chart", smokeAnonymousBazi);
  await step("auth-daily-fortune", "Email auth can create profile, Bazi chart, and daily fortune", smokeAuthDailyFortune);
  await step("auth-chart-archive", "Authenticated users can create and retrieve Bazi, Ziwei, and Astrology charts", smokeAuthChartArchive);
  await step("anonymous-history-privacy", "Anonymous consultations require the browser anonymous user id", smokeAnonymousHistoryPrivacy);
  await step("auth-history-privacy", "Authenticated consultations are hidden from public history lookup", smokeAuthHistoryPrivacy);
  if (config.skipAi) {
    summary.push({ name: "anonymous-ai-consultation", status: "skipped", detail: "SMOKE_SKIP_AI is enabled" });
    summary.push({ name: "auth-ai-consultation", status: "skipped", detail: "SMOKE_SKIP_AI is enabled" });
  } else {
    await step("anonymous-ai-consultation", "Anonymous AI consultation streams and persists history", smokeAnonymousAiConsultation);
    await step("auth-ai-consultation", "Authenticated saved-chart AI consultation streams and persists user history", smokeAuthAiConsultation);
  }

  console.log("\nSmoke test completed.");
  console.table(summary);
}

async function step(name, detail, fn) {
  const startedAt = Date.now();
  try {
    const result = await fn();
    summary.push({
      name,
      status: "passed",
      durationMs: Date.now() - startedAt,
      detail: result ?? detail
    });
  } catch (error) {
    summary.push({
      name,
      status: "failed",
      durationMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : String(error)
    });
    console.table(summary);
    throw error;
  }
}

async function smokeFrontend() {
  const response = await fetchWithTimeout(config.frontendUrl);
  assert(response.ok, `Frontend returned HTTP ${response.status}`);
  const html = await response.text();
  assert(html.includes("__next") || html.includes("MetaMystic"), "Frontend response does not look like the app shell");
  return `${config.frontendUrl} returned ${response.status}`;
}

async function smokeHealth() {
  const payload = await requestJson("/health");
  assert(payload?.service === "metamystic-backend", "Unexpected health service name");
  assert(payload?.ok === true, "Backend health ok flag is not true");
  return "Backend health ok";
}

async function smokeAnonymousBazi() {
  const profile = await createAnonymousProfile("smoke-anon");
  const chart = await requestJson("/charts/bazi", {
    method: "POST",
    body: JSON.stringify({ profileId: profile.id })
  });
  assert(chart.profileId === profile.id, "Bazi chart is not linked to the smoke profile");
  assert(Boolean(chart.pillars?.year?.stem), "Bazi chart did not include year pillar");
  assert(hasAnyShensha(chart), "Bazi chart did not include shensha labels");
  return `profile=${profile.id}, chart=${chart.id}`;
}

async function smokeAuthDailyFortune() {
  const session = await registerSmokeUser();
  const headers = authHeaders(session.accessToken);
  const me = await requestJson("/auth/me", { headers });
  assert(me.email === session.user.email, "Authenticated /me email did not match registered user");

  const profile = await requestJson("/users/me/profile", {
    method: "POST",
    headers,
    body: JSON.stringify(profileInput("Smoke User"))
  });
  const chart = await requestJson("/users/me/charts/bazi", {
    method: "POST",
    headers,
    body: JSON.stringify({ profileId: profile.id })
  });
  const fortune = await requestJson("/users/me/daily-fortune/today", { headers });

  assert(chart.profileId === profile.id, "Authenticated Bazi chart is not linked to the user profile");
  assert(fortune.status === "ready", `Expected daily fortune status ready, received ${fortune.status}`);
  assert(typeof fortune.score === "number", "Daily fortune score was not numeric");
  assert(Array.isArray(fortune.advice) && fortune.advice.length > 0, "Daily fortune advice was empty");
  return `user=${session.user.id}, profile=${profile.id}, chart=${chart.id}, score=${fortune.score}`;
}

async function smokeAuthChartArchive() {
  const session = await registerSmokeUser();
  const headers = authHeaders(session.accessToken);
  const profile = await requestJson("/users/me/profile", {
    method: "POST",
    headers,
    body: JSON.stringify(profileInput("Smoke Chart User"))
  });

  const [bazi, ziwei, astrology] = await Promise.all([
    requestJson("/users/me/charts/bazi", {
      method: "POST",
      headers,
      body: JSON.stringify({ profileId: profile.id })
    }),
    requestJson("/users/me/charts/ziwei", {
      method: "POST",
      headers,
      body: JSON.stringify({ profileId: profile.id })
    }),
    requestJson("/users/me/charts/astrology", {
      method: "POST",
      headers,
      body: JSON.stringify({ profileId: profile.id })
    })
  ]);

  const archive = await requestJson("/users/me/charts", { headers });
  assert(archive.profile?.id === profile.id, "Chart archive did not use the default profile");
  assert(archive.baziCharts.some((chart) => chart.id === bazi.id), "Bazi chart was missing from archive");
  assert(archive.ziweiCharts.some((chart) => chart.id === ziwei.id), "Ziwei chart was missing from archive");
  assert(archive.astrologyCharts.some((chart) => chart.id === astrology.id), "Astrology chart was missing from archive");

  const [baziDetail, ziweiDetail, astrologyDetail] = await Promise.all([
    requestJson(`/users/me/charts/bazi/${bazi.id}`, { headers }),
    requestJson(`/users/me/charts/ziwei/${ziwei.id}`, { headers }),
    requestJson(`/users/me/charts/astrology/${astrology.id}`, { headers })
  ]);

  assert(baziDetail.kind === "bazi" && baziDetail.chart.id === bazi.id, "Bazi detail lookup returned the wrong chart");
  assert(ziweiDetail.kind === "ziwei" && ziweiDetail.chart.id === ziwei.id, "Ziwei detail lookup returned the wrong chart");
  assert(astrologyDetail.kind === "astrology" && astrologyDetail.chart.id === astrology.id, "Astrology detail lookup returned the wrong chart");
  assert(Array.isArray(ziweiDetail.chart.palaces) && ziweiDetail.chart.palaces.length > 0, "Ziwei chart did not include palaces");
  assert(Array.isArray(astrologyDetail.chart.placements) && astrologyDetail.chart.placements.length > 0, "Astrology chart did not include placements");

  return `profile=${profile.id}, bazi=${bazi.id}, ziwei=${ziwei.id}, astrology=${astrology.id}`;
}

async function smokeAuthHistoryPrivacy() {
  const session = await registerSmokeUser();
  const headers = authHeaders(session.accessToken);
  const profile = await requestJson("/users/me/profile", {
    method: "POST",
    headers,
    body: JSON.stringify(profileInput("Smoke Privacy User"))
  });
  const chart = await requestJson("/users/me/charts/bazi", {
    method: "POST",
    headers,
    body: JSON.stringify({ profileId: profile.id })
  });
  const consultation = await requestJson("/users/me/consultations", {
    method: "POST",
    headers,
    body: JSON.stringify({
      profileId: profile.id,
      chartId: chart.id,
      question: "请判断近期是否适合推进职业规划？",
      tone: "strategic"
    })
  });

  await requestJsonExpectError(`/consultations/${consultation.id}`, 404);
  const publicList = await requestJson(`/consultations?profileId=${encodeURIComponent(profile.id)}`);
  assert(
    !publicList.consultations.some((item) => item.id === consultation.id),
    "Authenticated consultation was visible in the public profile consultation list"
  );
  const userList = await requestJson(`/users/me/consultations?profileId=${encodeURIComponent(profile.id)}`, { headers });
  assert(
    userList.consultations.some((item) => item.id === consultation.id),
    "Authenticated consultation was missing from the user profile consultation list"
  );
  const userHistory = await requestJson(`/users/me/consultations/${consultation.id}`, { headers });
  assert(userHistory.consultation.id === consultation.id, "Authenticated history lookup returned the wrong consultation");
  assert(userHistory.consultation.chartId === chart.id, "Authenticated history lookup returned the wrong chart");
  const publicStreamBody = await consumeConsultationStream(consultation.id);
  assert(
    publicStreamBody.includes("Consultation not found") && !publicStreamBody.includes('"type":"done"'),
    "Authenticated consultation was streamable through the public endpoint"
  );
  return `consultation=${consultation.id}`;
}

async function smokeAnonymousHistoryPrivacy() {
  const profile = await createAnonymousProfile("smoke-anon-history");
  const chart = await requestJson("/charts/bazi", {
    method: "POST",
    body: JSON.stringify({ profileId: profile.id })
  });
  const consultation = await requestJson("/consultations", {
    method: "POST",
    body: JSON.stringify({
      profileId: profile.id,
      chartId: chart.id,
      question: "请判断近期是否适合推进职业规划？",
      tone: "strategic"
    })
  });

  await requestJsonExpectError(`/consultations/${consultation.id}`, 404);
  await requestJsonExpectError(`/consultations/${consultation.id}?anonymousUserId=wrong-anon`, 404);
  const history = await requestJson(
    `/consultations/${consultation.id}?anonymousUserId=${encodeURIComponent(profile.anonymousUserId)}`
  );
  assert(history.consultation.id === consultation.id, "Anonymous history lookup returned the wrong consultation");

  const publicStreamBody = await consumeConsultationStream(consultation.id);
  assert(
    publicStreamBody.includes("Consultation not found") && !publicStreamBody.includes('"type":"done"'),
    "Anonymous consultation was streamable without the anonymous user id"
  );
  return `consultation=${consultation.id}`;
}

async function smokeAnonymousAiConsultation() {
  const profile = await createAnonymousProfile("smoke-ai");
  const chart = await requestJson("/charts/bazi", {
    method: "POST",
    body: JSON.stringify({ profileId: profile.id })
  });
  const consultation = await requestJson("/consultations", {
    method: "POST",
    body: JSON.stringify({
      profileId: profile.id,
      chartId: chart.id,
      question: "近期适合推进职业规划吗？",
      tone: "strategic"
    })
  });

  const streamBody = await consumeConsultationStream(consultation.id, {
    anonymousUserId: profile.anonymousUserId
  });
  assertStreamCompleted(streamBody);

  await requestJsonExpectError(`/consultations/${consultation.id}`, 404);
  const history = await requestJson(
    `/consultations/${consultation.id}?anonymousUserId=${encodeURIComponent(profile.anonymousUserId)}`
  );
  assert(history.consultation.status === "completed", `Consultation ended with status ${history.consultation.status}`);
  assert(Array.isArray(history.messages) && history.messages.length >= 2, "Consultation history did not persist user and assistant messages");
  return `consultation=${consultation.id}, messages=${history.messages.length}`;
}

async function smokeAuthAiConsultation() {
  const session = await registerSmokeUser();
  const headers = authHeaders(session.accessToken);
  const profile = await requestJson("/users/me/profile", {
    method: "POST",
    headers,
    body: JSON.stringify(profileInput("Smoke AI User"))
  });
  const chart = await requestJson("/users/me/charts/bazi", {
    method: "POST",
    headers,
    body: JSON.stringify({ profileId: profile.id })
  });
  const consultation = await requestJson("/users/me/consultations", {
    method: "POST",
    headers,
    body: JSON.stringify({
      profileId: profile.id,
      chartId: chart.id,
      question: "请结合这张已保存命盘，判断近期是否适合推进职业规划？",
      tone: "strategic"
    })
  });

  const streamBody = await consumeConsultationStream(consultation.id, {
    path: `/users/me/consultations/${consultation.id}/stream`,
    headers
  });
  assertStreamCompleted(streamBody);

  const history = await requestJson(`/users/me/consultations/${consultation.id}`, { headers });
  assert(history.consultation.status === "completed", `User consultation ended with status ${history.consultation.status}`);
  assert(history.consultation.profileId === profile.id, "User consultation is not linked to the authenticated profile");
  assert(history.consultation.chartId === chart.id, "User consultation is not linked to the saved Bazi chart");
  assert(Array.isArray(history.messages) && history.messages.length >= 2, "User consultation history did not persist messages");

  return `user=${session.user.id}, profile=${profile.id}, chart=${chart.id}, consultation=${consultation.id}`;
}

async function registerSmokeUser() {
  const email = `smoke+${crypto.randomUUID().replaceAll("-", "")}@${config.emailDomain}`;
  return requestJson("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: `Smoke-${crypto.randomUUID()}-A1!`,
      displayName: "Smoke User"
    })
  });
}

async function consumeConsultationStream(consultationId, options = {}) {
  const anonymousQuery = options.anonymousUserId ? `?anonymousUserId=${encodeURIComponent(options.anonymousUserId)}` : "";
  const path = options.path ?? `/consultations/${consultationId}/stream${anonymousQuery}`;
  const streamResponse = await fetchWithTimeout(joinUrl(config.apiBaseUrl, path), {
    headers: {
      Accept: "text/event-stream",
      ...(options.headers ?? {})
    }
  });
  assert(streamResponse.ok, `AI stream returned HTTP ${streamResponse.status}`);
  return streamResponse.text();
}

function assertStreamCompleted(streamBody) {
  assert(streamBody.includes('"type":"provider"') || /type.+provider/s.test(streamBody), "AI stream did not include a provider status event");
  assert(streamBody.includes('"section":"factors"') || /section.+factors/s.test(streamBody), "AI stream did not include a chart factors section");
  assert(streamBody.includes('"type":"done"') || /type.+done/s.test(streamBody), "AI stream did not include a done event");
}

async function createAnonymousProfile(prefix) {
  return requestJson("/profiles", {
    method: "POST",
    body: JSON.stringify({
      anonymousUserId: `${prefix}-${crypto.randomUUID().replaceAll("-", "")}`,
      ...profileInput("Smoke Test")
    })
  });
}

function profileInput(displayName) {
  return {
    displayName,
    birthTime: "1995-05-20T10:30:00+08:00",
    birthTimezone: "Asia/Shanghai",
    gender: "female",
    birthPlace: "Beijing",
    latitude: 39.9042,
    longitude: 116.4074
  };
}

async function requestJson(path, init = {}) {
  const response = await fetchWithTimeout(joinUrl(config.apiBaseUrl, path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  const text = await response.text();
  const payload = parseJson(text, path);

  if (!response.ok) {
    throw new Error(`Request ${path} returned HTTP ${response.status}: ${safeStringify(payload)}`);
  }
  if (payload.status === "error") {
    throw new Error(`Request ${path} failed: ${payload.error?.message ?? "unknown API error"}`);
  }
  assert(payload.status === "success", `Request ${path} returned an unexpected API envelope`);
  return payload.data;
}

async function requestJsonExpectError(path, expectedStatus, init = {}) {
  const response = await fetchWithTimeout(joinUrl(config.apiBaseUrl, path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  const text = await response.text();
  const payload = parseJson(text, path);
  assert(response.status === expectedStatus, `Expected ${path} to return HTTP ${expectedStatus}, received HTTP ${response.status}`);
  assert(payload.status === "error", `Expected ${path} to return an error envelope`);
  return payload.error;
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`)), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function authHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

function hasAnyShensha(chart) {
  return ["year", "month", "day", "hour"].some((name) => Array.isArray(chart.pillars?.[name]?.shensha) && chart.pillars[name].shensha.length > 0);
}

function parseJson(text, path) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Request ${path} did not return JSON. Body: ${text.slice(0, 200)}`);
  }
}

function joinUrl(baseUrl, path) {
  return `${trimTrailingSlashes(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "");
}

function safeStringify(value) {
  return JSON.stringify(value, (_key, currentValue) => {
    if (typeof currentValue === "string" && currentValue.length > 160) {
      return `${currentValue.slice(0, 160)}...`;
    }
    return currentValue;
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error("\nSmoke test failed.");
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
