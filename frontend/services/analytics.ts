/**
 * Analytics Service - API calls for analytics data.
 */

import api from "./api";
import type { AnalyticsDashboard, Report } from "@/types";

export const analyticsService = {
  async getDashboard(): Promise<AnalyticsDashboard> {
    const response = await api.get("/api/analytics/dashboard");
    return response.data;
  },

  async getReport(sessionId: string): Promise<Report> {
    const response = await api.get(`/api/report/${sessionId}`);
    return response.data;
  },
};
