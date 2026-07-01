/**
 * Resume Service - API calls for resume operations.
 */

import api from "./api";
import type { Resume } from "@/types";

export const resumeService = {
  async upload(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/resume/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async list(): Promise<{ resumes: Resume[] }> {
    const response = await api.get("/api/resume/list");
    return response.data;
  },

  async get(resumeId: string): Promise<Resume> {
    const response = await api.get(`/api/resume/${resumeId}`);
    return response.data;
  },

  async delete(resumeId: string): Promise<void> {
    await api.delete(`/api/resume/${resumeId}`);
  },
};
