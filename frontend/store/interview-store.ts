/**
 * Interview Store - manages interview session state.
 */

import { create } from "zustand";
import type { ChatMessage, Question, InterviewSession, AnswerFeedback } from "@/types";

interface InterviewState {
  session: InterviewSession | null;
  messages: ChatMessage[];
  currentQuestion: Question | null;
  isWaitingForAI: boolean;
  elapsedSeconds: number;
  confidenceScore: number;

  // Actions
  setSession: (session: InterviewSession) => void;
  addMessage: (message: ChatMessage) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setWaitingForAI: (waiting: boolean) => void;
  setElapsedSeconds: (seconds: number) => void;
  updateConfidence: (score: number) => void;
  resetInterview: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  session: null,
  messages: [],
  currentQuestion: null,
  isWaitingForAI: false,
  elapsedSeconds: 0,
  confidenceScore: 0,

  setSession: (session) => set({ session }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),

  setWaitingForAI: (waiting) => set({ isWaitingForAI: waiting }),

  setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),

  updateConfidence: (score) => set({ confidenceScore: score }),

  resetInterview: () =>
    set({
      session: null,
      messages: [],
      currentQuestion: null,
      isWaitingForAI: false,
      elapsedSeconds: 0,
      confidenceScore: 0,
    }),
}));
