"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";


// =========================================================
// PAGE LABEL
// =========================================================

function getPageLabel(pathname: string) {
  if (pathname === "/") {
    return "My Farm";
  }

  if (pathname.startsWith("/storage")) {
    return "Storage";
  }

  if (pathname.startsWith("/market")) {
    return "Market";
  }

  if (pathname.startsWith("/admin")) {
    return "Admin Panel";
  }

  if (pathname.startsWith("/login")) {
    return "Login";
  }

  return "Unknown Page";
}


// =========================================================
// PRESENCE TRACKER
// =========================================================

export default function PresenceTracker() {
  const pathname = usePathname();

  const supabase = useMemo(
    () => createClient(),
    []
  );


  useEffect(() => {
  // Online Players sayfası kendi Presence kanalını yönetiyor.
  // Aynı kanala ikinci kez subscribe olmayı engelliyoruz.
  if (pathname.startsWith("/admin/online")) {
    return;
  }

  let isActive = true;

    let presenceChannel:
      RealtimeChannel | null = null;


    async function startPresence() {
      // ---------------------------------------------------
      // CURRENT SESSION
      // ---------------------------------------------------

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();


      if (
        !isActive ||
        !session
      ) {
        return;
      }


      const user =
        session.user;


      // ---------------------------------------------------
      // PROFILE
      // ---------------------------------------------------

      const {
        data: profile,
      } =
        await supabase
          .from("profiles")
          .select(
            `
              username,
              role
            `
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();


      if (!isActive) {
        return;
      }


      // ---------------------------------------------------
      // REALTIME AUTH
      // ---------------------------------------------------

      await supabase.realtime.setAuth(
        session.access_token
      );


      if (!isActive) {
        return;
      }


      // ---------------------------------------------------
      // PRESENCE CHANNEL
      // ---------------------------------------------------

      presenceChannel =
        supabase.channel(
          "game:global:presence",
          {
            config: {
              private: true,

              presence: {
                key: user.id,
              },
            },
          }
        );


      presenceChannel.subscribe(
        async (status) => {
          if (
            status !==
            "SUBSCRIBED"
          ) {
            return;
          }


          if (
            !isActive ||
            !presenceChannel
          ) {
            return;
          }


          await presenceChannel.track({
            userId:
              user.id,

            username:
              profile?.username ??
              user.email ??
              "Unknown Player",

            role:
              profile?.role ??
              "player",

            pathname,

            page:
              getPageLabel(
                pathname
              ),

            onlineAt:
              new Date()
                .toISOString(),
          });
        }
      );
    }


    void startPresence();


    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      isActive = false;

      if (
        presenceChannel
      ) {
        void presenceChannel.untrack();

        void supabase.removeChannel(
          presenceChannel
        );
      }
    };
  }, [
    pathname,
    supabase,
  ]);


  return null;
}