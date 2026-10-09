import type { AuthProvider } from "@refinedev/core";
import { crmApiUrl } from "./api";

export interface LoginValues {
  login: string;
  password: string;
}

export interface AdminIdentity {
  id: string;
  name: string;
}

const authUrl = `${crmApiUrl}/auth`;

async function authRequest(
  path: string,
  method: "GET" | "POST",
  body?: LoginValues,
): Promise<Response> {
  return fetch(`${authUrl}${path}`, {
    method,
    credentials: "include",
    cache: "no-store",
    headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });
}

function authError(message: string) {
  return { name: "Authentication error", message };
}

export const authProvider: AuthProvider = {
  login: async ({ login, password }: LoginValues) => {
    if (!login?.trim() || !password) {
      return { success: false, error: authError("Enter your login and password.") };
    }

    try {
      const response = await authRequest("/login", "POST", {
        login: login.trim(),
        password,
      });

      if (response.ok) {
        return { success: true, redirectTo: "/dashboard" };
      }

      const messages: Record<number, string> = {
        400: "Check your login and password.",
        401: "Invalid login or password.",
        403: "This CRM origin is not allowed by the server.",
        429: "Too many login attempts. Please try again later.",
        503: "CRM authentication is not configured on the server.",
      };
      return {
        success: false,
        error: authError(
          messages[response.status] ?? "Unable to sign in. Please try again.",
        ),
      };
    } catch {
      return {
        success: false,
        error: authError("Unable to reach the server. Please try again."),
      };
    }
  },
  logout: async () => {
    try {
      const response = await authRequest("/logout", "POST");
      if (!response.ok) {
        return {
          success: false,
          error: authError("Unable to sign out. Please try again."),
        };
      }
      return { success: true, redirectTo: "/login" };
    } catch {
      return {
        success: false,
        error: authError("Unable to reach the server. Please try again."),
      };
    }
  },
  check: async () => {
    try {
      const response = await authRequest("/me", "GET");
      return response.ok
        ? { authenticated: true }
        : { authenticated: false, redirectTo: "/login" };
    } catch {
      return { authenticated: false, redirectTo: "/login" };
    }
  },
  // The backend exposes no profile data; the protected layout calls check() first.
  getIdentity: async (): Promise<AdminIdentity> => ({
    id: "crm-admin",
    name: "Administrator",
  }),
  onError: async (error: { statusCode?: number }) =>
    error?.statusCode === 401 ? { redirectTo: "/login" } : {},
};
