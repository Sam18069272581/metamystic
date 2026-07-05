export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";

export const dictionaries = {
  zh: {
    metadata: {
      description: "AI 命理决策辅助平台"
    },
    shell: {
      statusLabel: "夜间模式",
      nav: {
        home: "首页",
        consult: "AI",
        bazi: "命盘",
        me: "我的"
      }
    },
    home: {
      title: "今日运势",
      dailyFortune: "今日签语",
      scoreUnit: "分",
      elementSuffix: "气",
      loadingTitle: "正在读取今日签语",
      loadingSummary: "正在结合你的命盘结构生成今日建议。",
      loadError: "今日签语读取失败",
      shareTitle: "MetaMystic 今日签语",
      shareLabels: {
        idle: "分享",
        copied: "已复制",
        shared: "已分享",
        unsupported: "无法分享"
      },
      languageSwitch: "EN",
      primaryActions: {
        needsProfile: "完善我的档案",
        needsBaziChart: "完成八字排盘",
        ready: "开始 AI 命理分析"
      },
      entries: {
        consult: "AI 命理对话",
        bazi: "八字排盘",
        knowledge: "知识库",
        decision: "圣杯决策"
      },
      recommendationsTitle: "为你推荐",
      recommendationsHint: "下一步接入每日推送",
      yearlyTrendTitle: "2026 流年趋势",
      yearlyTrendSummary: "结合命盘结构生成年度行动建议。",
      relationshipTitle: "关系问题入口",
      relationshipSummary: "用温和陪伴模式处理情绪型问题。",
      fallbackTitle: "先建立你的命盘档案",
      fallbackSummary: "登录并填写出生信息后，MetaMystic 会根据你的命盘生成每日签语。",
      fallbackAdvice: ["先完成基础档案", "再查看今日适合推进的事项"],
      fallbackCaution: "未建立命盘前只显示通用提醒。",
      fallbackLuckyAction: "适合学习、研究和深谈",
      elements: {
        wood: "木",
        fire: "火",
        earth: "土",
        metal: "金",
        water: "水"
      }
    },
    pages: {
      consult: "AI 命理对话",
      bazi: "命盘中心",
      me: "个人档案",
      login: "登录",
      register: "注册"
    }
  },
  en: {
    metadata: {
      description: "AI metaphysics decision assistant"
    },
    shell: {
      statusLabel: "Night mode",
      nav: {
        home: "Home",
        consult: "AI",
        bazi: "Chart",
        me: "Me"
      }
    },
    home: {
      title: "Today",
      dailyFortune: "Daily reading",
      scoreUnit: "pts",
      elementSuffix: "phase",
      loadingTitle: "Loading today's reading",
      loadingSummary: "Generating today's guidance from your chart structure.",
      loadError: "Failed to load today's reading",
      shareTitle: "MetaMystic daily reading",
      shareLabels: {
        idle: "Share",
        copied: "Copied",
        shared: "Shared",
        unsupported: "Unavailable"
      },
      languageSwitch: "中文",
      primaryActions: {
        needsProfile: "Complete my profile",
        needsBaziChart: "Create BaZi chart",
        ready: "Start AI reading"
      },
      entries: {
        consult: "AI consultation",
        bazi: "BaZi chart",
        knowledge: "Knowledge base",
        decision: "Grail decision"
      },
      recommendationsTitle: "Recommended",
      recommendationsHint: "Daily push is next",
      yearlyTrendTitle: "2026 yearly trend",
      yearlyTrendSummary: "Generate yearly action guidance from your chart.",
      relationshipTitle: "Relationship entry",
      relationshipSummary: "Use a gentle companion mode for emotional questions.",
      fallbackTitle: "Create your destiny profile first",
      fallbackSummary: "After signing in and adding birth details, MetaMystic will generate a daily reading from your chart.",
      fallbackAdvice: ["Complete your basic profile", "Then review what to move forward today"],
      fallbackCaution: "Generic guidance is shown until a chart exists.",
      fallbackLuckyAction: "Good for learning, research, and deep conversation",
      elements: {
        wood: "Wood",
        fire: "Fire",
        earth: "Earth",
        metal: "Metal",
        water: "Water"
      }
    },
    pages: {
      consult: "AI Consultation",
      bazi: "Chart Center",
      me: "Profile",
      login: "Sign in",
      register: "Create account"
    }
  }
} as const;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function withLocale(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  const segments = normalized.split("/");
  if (isLocale(segments[1] ?? "")) {
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

export function switchLocalePath(pathname: string, targetLocale: Locale): string {
  const [path, query] = pathname.split("?");
  const localized = withLocale(path || "/", targetLocale);
  return query ? `${localized}?${query}` : localized;
}

export function oppositeLocale(locale: Locale): Locale {
  return locale === "zh" ? "en" : "zh";
}

export function getLocaleFromPathname(pathname: string | null | undefined): Locale {
  const segment = pathname?.split("/").filter(Boolean)[0];
  return segment && isLocale(segment) ? segment : defaultLocale;
}
