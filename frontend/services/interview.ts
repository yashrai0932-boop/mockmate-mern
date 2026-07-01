/**
 * Interview Service - API calls for interview operations.
 */

import api from "./api";
import type {
  InterviewStartRequest,
  AnswerSubmitRequest,
  InterviewPersonality,
} from "@/types";

export const interviewService = {
  async getPersonalities(): Promise<{ personalities: InterviewPersonality[] }> {
    const response = await api.get("/api/interview/personalities");
    return response.data;
  },

  async startInterview(data: InterviewStartRequest) {
    const response = await api.post("/api/interview/start", data);
    return response.data;
  },

  async submitAnswer(sessionId: string, data: AnswerSubmitRequest) {
    const response = await api.post(`/api/interview/${sessionId}/answer`, data);
    return response.data;
  },

  async completeInterview(sessionId: string) {
    const response = await api.post(`/api/interview/${sessionId}/complete`);
    return response.data;
  },

  async getHistory() {
    const response = await api.get("/api/interview/history");
    return response.data;
  },

  async getSession(sessionId: string) {
    const response = await api.get(`/api/interview/${sessionId}`);
    return response.data;
  },

  async reportTabSwitch(sessionId: string, tabSwitches: number) {
    await api.post(`/api/interview/${sessionId}/tab-switch`, {
      tab_switches: tabSwitches,
    });
  },
};
