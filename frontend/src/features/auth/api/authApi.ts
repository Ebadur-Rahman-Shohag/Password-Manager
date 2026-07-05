// Auth API calls — register, login, session bootstrap, logout.

import type { LoginRequest, RegisterRequest, SessionResponse } from "@password-manager/shared";
import { API_ROUTES } from "../../../constants/api";
import { apiClient } from "../../../api/client";

export async function register(data: RegisterRequest): Promise<SessionResponse> {
  return apiClient<SessionResponse>(API_ROUTES.AUTH.REGISTER, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<SessionResponse> {
  return apiClient<SessionResponse>(API_ROUTES.AUTH.LOGIN, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSession(): Promise<SessionResponse> {
  return apiClient<SessionResponse>(API_ROUTES.AUTH.ME);
}

export async function logout(): Promise<void> {
  await apiClient<void>(API_ROUTES.AUTH.LOGOUT, {
    method: "POST",
  });
}
