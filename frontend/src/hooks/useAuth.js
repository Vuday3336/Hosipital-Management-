import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore.js";
import { loginRequest, logoutRequest, refreshRequest, meRequest, registerRequest } from "../api/auth.api.js";

// On a hard refresh only `user` survives (in localStorage); the access token lives in
// memory only, so we silently trade the httpOnly refresh cookie for a new one on boot.
export const useAuthBootstrap = () => {
  const { user, setSession, clear } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setReady(true);
        return;
      }
      try {
        const refreshed = await refreshRequest();
        const me = await meRequest();
        if (!cancelled) setSession(me.data.user, refreshed.data.accessToken);
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ready;
};

export const useAuthActions = () => {
  const { setSession, clear } = useAuthStore();

  const login = useCallback(
    async (payload) => {
      const res = await loginRequest(payload);
      setSession(res.data.user, res.data.accessToken);
      return res.data.user;
    },
    [setSession]
  );

  const register = useCallback(
    async (payload) => {
      const res = await registerRequest(payload);
      setSession(res.data.user, res.data.accessToken);
      return res.data.user;
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clear();
    }
  }, [clear]);

  return { login, register, logout };
};
