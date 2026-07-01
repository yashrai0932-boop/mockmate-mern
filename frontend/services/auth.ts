/**
 * Auth Service - API calls for authentication.
 */

import api from "./api";
import type { AuthResponse, LoginRequest, SignupRequest, User } from "@/types";

export const authService = {
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/signup", data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/login", data);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>("/api/auth/me");
    return response.data;
  },
};
