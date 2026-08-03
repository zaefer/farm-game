"use client";

import { useCallback, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

type AuthStatusResponse = {
  authenticated: boolean;

  banned: boolean;

  ban?: {
    reason: string;
    duration: string;
    expiresAt: string | null;
  } | null;
};

export default function BanGuard() {
  const checkBan = useCallback(async () => {
    try {
      const response = await fetch("/api/auth-status", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data: AuthStatusResponse =
        await response.json();

      if (!data.banned) {
        return;
      }

      const supabase = createClient();

      await supabase.auth.signOut({
        scope: "local",
      });

      const reason =
        data.ban?.reason ??
        "Your account has been banned.";

      window.location.href =
        `/login?error=${encodeURIComponent(
          `Account banned: ${reason}`
        )}`;
    } catch (error) {
      console.error(
        "Ban check failed:",
        error
      );
    }
  }, []);

  useEffect(() => {
    checkBan();

    const interval =
      window.setInterval(
        checkBan,
        10_000
      );

    const handleVisibility = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        checkBan();
      }
    };

    const handleFocus = () => {
      checkBan();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.clearInterval(
        interval
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [checkBan]);

  return null;
}