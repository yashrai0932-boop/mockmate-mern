/**
 * Voice Store - manages voice recording and transcription state.
 */

import { create } from "zustand";
import type { VoiceAnalysis } from "@/types";

interface VoiceState {
  isRecording: boolean;
  liveTranscript: string;
  finalTranscript: string;
  voiceAnalysis: VoiceAnalysis | null;
  recordingDuration: number;
  isSupported: boolean;

  // Actions
  setRecording: (recording: boolean) => void;
  setLiveTranscript: (transcript: string) => void;
  setFinalTranscript: (transcript: string) => void;
  setVoiceAnalysis: (analysis: VoiceAnalysis | null) => void;
  setRecordingDuration: (duration: number) => void;
  setSupported: (supported: boolean) => void;
  resetVoice: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isRecording: false,
  liveTranscript: "",
  finalTranscript: "",
  voiceAnalysis: null,
  recordingDuration: 0,
  isSupported: false,

  setRecording: (recording) => set({ isRecording: recording }),
  setLiveTranscript: (transcript) => set({ liveTranscript: transcript }),
  setFinalTranscript: (transcript) => set({ finalTranscript: transcript }),
  setVoiceAnalysis: (analysis) => set({ voiceAnalysis: analysis }),
  setRecordingDuration: (duration) => set({ recordingDuration: duration }),
  setSupported: (supported) => set({ isSupported: supported }),

  resetVoice: () =>
    set({
      isRecording: false,
      liveTranscript: "",
      finalTranscript: "",
      voiceAnalysis: null,
      recordingDuration: 0,
    }),
}));
