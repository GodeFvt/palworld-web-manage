import { ref } from "vue";
import { fetchApi } from "./api";

const isAuthenticated = ref(false);
const currentUser = ref<string | null>(null);
const authChecked = ref(false);

export function useAuth() {
  async function checkAuth(): Promise<boolean> {
    try {
      const res = await fetchApi<{ success: boolean; user?: string }>(
        "/auth/me",
      );
      if (res.success) {
        isAuthenticated.value = true;
        currentUser.value = res.user ?? null;
      } else {
        isAuthenticated.value = false;
        currentUser.value = null;
      }
    } catch {
      isAuthenticated.value = false;
      currentUser.value = null;
    }
    authChecked.value = true;
    return isAuthenticated.value;
  }

  async function login(
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetchApi<{
        success: boolean;
        error?: string;
        user?: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (res.success) {
        isAuthenticated.value = true;
        currentUser.value = res.user ?? username;
      }

      return res;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async function logout(): Promise<void> {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    isAuthenticated.value = false;
    currentUser.value = null;
  }

  return {
    isAuthenticated,
    currentUser,
    authChecked,
    checkAuth,
    login,
    logout,
  };
}
