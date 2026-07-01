/**
 * Analytics Store - manages analytics dashboard data.
 */

import { create } from "zustand";
import type { AnalyticsDashboard } from "@/types";

interface AnalyticsState {
  data: AnalyticsDashboard | null;
  isLoading: boolean;
  error: string | null;

  setData: (data: AnalyticsDashboard) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  setData: (data) => set({ data, isLoading: false, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
}));
