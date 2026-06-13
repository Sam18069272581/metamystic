"use client";

import { create } from "zustand";
import type {
  AiSectionType,
  BaziChartDto,
  ConsultationDto,
  ConsultationHistoryDto,
  ConsultationProviderEvent,
  ProfileMemorySignalsDto,
  ProfileDto
} from "@metamystic/shared";

export type StreamSections = Record<AiSectionType, string>;

interface AppState {
  profile: ProfileDto | undefined;
  chart: BaziChartDto | undefined;
  consultation: ConsultationDto | undefined;
  consultations: ConsultationDto[];
  history: ConsultationHistoryDto | undefined;
  memory: ProfileMemorySignalsDto | undefined;
  providerStatus: ConsultationProviderEvent | undefined;
  streamSections: StreamSections;
  loading: boolean;
  error: string | undefined;
  setProfile: (profile: ProfileDto) => void;
  setChart: (chart: BaziChartDto) => void;
  setConsultation: (consultation: ConsultationDto) => void;
  setConsultations: (consultations: ConsultationDto[]) => void;
  setHistory: (history?: ConsultationHistoryDto) => void;
  setMemory: (memory?: ProfileMemorySignalsDto) => void;
  setProviderStatus: (providerStatus?: ConsultationProviderEvent) => void;
  appendStreamSection: (section: AiSectionType, content: string) => void;
  resetStream: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
}

const emptySections: StreamSections = {
  verdict: "",
  logic: "",
  factors: "",
  advice: "",
  citation: "",
  disclaimer: ""
};

export const useAppStore = create<AppState>((set) => ({
  profile: undefined,
  chart: undefined,
  consultation: undefined,
  consultations: [],
  history: undefined,
  memory: undefined,
  providerStatus: undefined,
  streamSections: emptySections,
  loading: false,
  error: undefined,
  setProfile: (profile) => set({ profile }),
  setChart: (chart) => set({ chart }),
  setConsultation: (consultation) => set({ consultation }),
  setConsultations: (consultations) => set({ consultations }),
  setHistory: (history) => set({ history }),
  setMemory: (memory) => set({ memory }),
  setProviderStatus: (providerStatus) => set({ providerStatus }),
  appendStreamSection: (section, content) =>
    set((state) => ({
      streamSections: {
        ...state.streamSections,
        [section]: state.streamSections[section]
          ? `${state.streamSections[section]}\n${content}`
          : content
      }
    })),
  resetStream: () => set({ streamSections: { ...emptySections }, providerStatus: undefined, error: undefined, history: undefined }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));
