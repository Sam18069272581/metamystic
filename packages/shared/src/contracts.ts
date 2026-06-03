export type Gender = "female" | "male" | "non_binary" | "unknown";

export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";

export type AiSectionType = "verdict" | "logic" | "advice" | "citation" | "disclaimer";

export type ConsultationTone = "strategic" | "gentle";

export type UserRole = "USER" | "ADMIN";

export interface ApiSuccess<T> {
  status: "success";
  data: T;
}

export interface ApiFailure {
  status: "error";
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | undefined;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface UpsertProfileRequest {
  anonymousUserId: string;
  displayName?: string | undefined;
  birthTime: string;
  birthTimezone: string;
  gender: Gender;
  birthPlace?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
}

export interface UpsertUserProfileRequest extends Omit<UpsertProfileRequest, "anonymousUserId"> {}

export interface ProfileDto extends UpsertProfileRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileMemorySignalsDto {
  decisionTopics: string[];
  riskStyle: string;
  preferredTone: string;
  sources: string[];
  updatedAt?: string | undefined;
}

export interface AuthUserDto {
  id: string;
  email?: string | undefined;
  displayName?: string | undefined;
  avatarUrl?: string | undefined;
  role: UserRole;
  emailVerifiedAt?: string | undefined;
  createdAt?: string | undefined;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string | undefined;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSessionDto {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface BaziPillarDto {
  stem: string;
  branch: string;
  tenGod: string;
  hiddenStems: string[];
  hiddenStemDetails?: Array<{
    stem: string;
    tenGod: string;
    element: FiveElement;
  }> | undefined;
  nayin: string;
}

export interface BaziChartDto {
  id: string;
  profileId: string;
  dayMaster: string;
  dayMasterStatus: "strong" | "balanced" | "weak";
  mainPattern: string;
  pillars: {
    year: BaziPillarDto;
    month: BaziPillarDto;
    day: BaziPillarDto;
    hour: BaziPillarDto;
  };
  elements: Record<FiveElement, number>;
  usefulGods?: FiveElement[] | undefined;
  unfavorableGods?: FiveElement[] | undefined;
  analysis?: {
    strengthScore: number;
    strengthLabel: string;
    strengthReasons: string[];
    favorableStrategy: string;
    personality: string;
    career: string;
    wealth: string;
    relationship: string;
    health: string;
  } | undefined;
  metadata?: Record<string, unknown> | undefined;
  createdAt: string;
}

export interface CreateBaziChartRequest {
  profileId: string;
}

export type ZiweiPalaceName =
  | "life"
  | "siblings"
  | "spouse"
  | "children"
  | "wealth"
  | "health"
  | "travel"
  | "friends"
  | "career"
  | "property"
  | "fortune"
  | "parents";

export interface ZiweiPalaceDto {
  name: ZiweiPalaceName;
  label: string;
  earthlyBranch: string;
  majorStars: string[];
  minorStars: string[];
  ageRange: string;
}

export interface ZiweiChartDto {
  id: string;
  profileId: string;
  lifePalace: ZiweiPalaceName;
  bodyPalace: ZiweiPalaceName;
  palaces: ZiweiPalaceDto[];
  analysis?: {
    lifeTheme: string;
    bodyTheme: string;
    career: string;
    wealth: string;
    relationship: string;
    advice: string;
  } | undefined;
  summary: string;
  createdAt: string;
}

export interface CreateZiweiChartRequest {
  profileId: string;
}

export type AstrologyBody = "Sun" | "Moon" | "Ascendant";

export interface AstrologyPlacementDto {
  body: AstrologyBody;
  label: string;
  sign: string;
  degree: number;
  house: number;
  element: FiveElement;
  modality: "cardinal" | "fixed" | "mutable";
}

export interface AstrologyHouseDto {
  house: number;
  sign: string;
  cuspDegree: number;
}

export interface AstrologyChartDto {
  id: string;
  profileId: string;
  placements: AstrologyPlacementDto[];
  houses: AstrologyHouseDto[];
  dominantElements: Record<FiveElement, number>;
  analysis?: {
    coreIdentity: string;
    emotionalPattern: string;
    socialMask: string;
    dominantElement: string;
    career: string;
    relationship: string;
    advice: string;
  } | undefined;
  summary: string;
  createdAt: string;
}

export interface CreateAstrologyChartRequest {
  profileId: string;
}

export interface UserChartArchiveDto {
  profile?: ProfileDto | undefined;
  baziCharts: BaziChartDto[];
  ziweiCharts: ZiweiChartDto[];
  astrologyCharts: AstrologyChartDto[];
}

export type UserChartKind = "bazi" | "ziwei" | "astrology";

export interface UserChartDetailDto {
  kind: UserChartKind;
  chart: BaziChartDto | ZiweiChartDto | AstrologyChartDto;
}

export interface CreateConsultationRequest {
  profileId: string;
  chartId: string;
  question: string;
  tone: ConsultationTone;
}

export interface ConsultationDto {
  id: string;
  profileId: string;
  chartId: string;
  question: string;
  tone: ConsultationTone;
  status: "pending" | "streaming" | "completed" | "failed";
  summary?: string | undefined;
  createdAt: string;
}

export interface ConsultationMessageDto {
  id: string;
  consultationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ConsultationChunkEvent {
  type: "chunk";
  consultationId: string;
  section: AiSectionType;
  content: string;
}

export interface ConsultationDoneEvent {
  type: "done";
  consultationId: string;
}

export interface ConsultationErrorEvent {
  type: "error";
  consultationId: string;
  message: string;
}

export type ConsultationStreamEvent =
  | ConsultationChunkEvent
  | ConsultationDoneEvent
  | ConsultationErrorEvent;

export interface ConsultationHistoryDto {
  consultation: ConsultationDto;
  messages: ConsultationMessageDto[];
}

export interface ConsultationListResponse {
  profileId: string;
  consultations: ConsultationDto[];
}

export interface KnowledgeChunkDto {
  id: string;
  sourceTitle: string;
  anchorId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface KnowledgeSearchResponse {
  query: string;
  chunks: KnowledgeChunkDto[];
}
