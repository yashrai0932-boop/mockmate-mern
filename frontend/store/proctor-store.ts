/**
 * Proctor Store - manages proctoring state with Zustand.
 */

import { create } from "zustand";

export interface ProctorEventLog {
  id: string;
  event_type: string;
  severity: "low" | "medium" | "high";
  message: string;
  score_penalty: number;
  timestamp: Date;
}

export interface ProctorWarning {
  id: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: Date;
}

interface ProctorState {
  // Status
  enabled: boolean;
  integrityScore: number;
  warningCount: number;
  isFocused: boolean;
  isFullscreen: boolean;
  cameraActive: boolean;
  micActive: boolean;
  faceCount: number;
  isLowLight: boolean;
  gazeAway: boolean;
  audioNoisy: boolean;
  confidenceTrend: number[];

  // Events & warnings
  events: ProctorEventLog[];
  activeWarnings: ProctorWarning[];

  // Actions
  setEnabled: (v: boolean) => void;
  setIntegrityScore: (v: number) => void;
  decrementScore: (penalty: number) => void;
  incrementWarnings: () => void;
  setFocused: (v: boolean) => void;
  setFullscreen: (v: boolean) => void;
  setCameraActive: (v: boolean) => void;
  setMicActive: (v: boolean) => void;
  setFaceCount: (v: number) => void;
  setLowLight: (v: boolean) => void;
  setGazeAway: (v: boolean) => void;
  setAudioNoisy: (v: boolean) => void;
  addConfidencePoint: (v: number) => void;
  addEvent: (evt: ProctorEventLog) => void;
  addWarning: (w: ProctorWarning) => void;
  removeWarning: (id: string) => void;
  clearEvents: () => void;
  reset: () => void;
}

export const useProctorStore = create<ProctorState>((set) => ({
  enabled: true,
  integrityScore: 100,
  warningCount: 0,
  isFocused: true,
  isFullscreen: false,
  cameraActive: false,
  micActive: false,
  faceCount: 0,
  isLowLight: false,
  gazeAway: false,
  audioNoisy: false,
  confidenceTrend: [],
  events: [],
  activeWarnings: [],

  setEnabled: (v) => set({ enabled: v }),
  setIntegrityScore: (v) => set({ integrityScore: Math.max(0, Math.min(100, v)) }),
  decrementScore: (penalty) =>
    set((s) => ({ integrityScore: Math.max(0, s.integrityScore - penalty) })),
  incrementWarnings: () => set((s) => ({ warningCount: s.warningCount + 1 })),
  setFocused: (v) => set({ isFocused: v }),
  setFullscreen: (v) => set({ isFullscreen: v }),
  setCameraActive: (v) => set({ cameraActive: v }),
  setMicActive: (v) => set({ micActive: v }),
  setFaceCount: (v) => set({ faceCount: v }),
  setLowLight: (v) => set({ isLowLight: v }),
  setGazeAway: (v) => set({ gazeAway: v }),
  setAudioNoisy: (v) => set({ audioNoisy: v }),
  addConfidencePoint: (v) =>
    set((s) => ({ confidenceTrend: [...s.confidenceTrend, v] })),
  addEvent: (evt) => set((s) => ({ events: [...s.events, evt] })),
  addWarning: (w) => set((s) => ({ activeWarnings: [...s.activeWarnings, w] })),
  removeWarning: (id) =>
    set((s) => ({ activeWarnings: s.activeWarnings.filter((w) => w.id !== id) })),
  clearEvents: () => set({ events: [] }),
  reset: () =>
    set({
      integrityScore: 100,
      warningCount: 0,
      isFocused: true,
      isFullscreen: false,
      cameraActive: false,
      micActive: false,
      faceCount: 0,
      isLowLight: false,
      gazeAway: false,
      audioNoisy: false,
      confidenceTrend: [],
      events: [],
      activeWarnings: [],
    }),
}));
