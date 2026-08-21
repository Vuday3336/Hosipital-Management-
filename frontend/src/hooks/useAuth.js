import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore.js";
import { loginRequest, logoutRequest, refreshRequest, meRequest, registerRequest } from "../api/auth.api.js";

// Shared across duplicate effect invocations (React StrictMode intentionally double-fires
// mount effects in dev) so they hit the network once instead of racing two refresh calls
// against the same one-time-use refresh token.
let bootstrapPromise = null;

// On a hard refresh only `user` survives (in localStorage); the access token lives in
// memory only, so we silently trade the httpOnly refresh cookie for a new one on boot.
export const useAuthBootstrap = () => {
  const { user, setSession, setAccessToken, clear } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setReady(true);
        return;
      }
      try {
        bootstrapPromise ??= (async () => {
          const refreshed = await refreshRequest();
          // Store the token *before* calling /me — the axios interceptor reads it
          // from the store to set the Authorization header, so /me would otherwise
          // go out with no (or a stale) token, 401, and trigger a second, redundant
          // refresh via the interceptor's own retry logic.
          setAccessToken(refreshed.data.accessToken);
          const me = await meRequest();
          return { user: me.data.user, accessToken: refreshed.data.accessToken };
        })().finally(() => {
          bootstrapPromise = null;
        });
        const session = await bootstrapPromise;
        if (!cancelled) setSession(session.user, session.accessToken);
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
