"use client";

import {
  useCallback,
  useEffect,
  useMemo,
} from "react";

import { usePathname } from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";


function getPageLabel(
  pathname: string
) {
  if (pathname === "/") {
    return "My Farm";
  }

  if (
    pathname.startsWith(
      "/storage"
    )
  ) {
    return "Storage";
  }

  if (
    pathname.startsWith(
      "/market"
    )
  ) {
    return "Market";
  }

  if (
    pathname.startsWith(
      "/admin/players"
    )
  ) {
    return "Admin Players";
  }

  if (
    pathname.startsWith(
      "/admin/online"
    )
  ) {
    return "Online Players";
  }

  if (
    pathname.startsWith(
      "/admin/bans"
    )
  ) {
    return "Admin Bans";
  }

  if (
    pathname.startsWith(
      "/admin"
    )
  ) {
    return "Admin Panel";
  }

  if (
    pathname.startsWith(
      "/login"
    )
  ) {
    return "Login";
  }

  return "Unknown Page";
}


export default function LastSeenTracker() {
  const pathname =
    usePathname();


  const supabase =
    useMemo(
      () => createClient(),
      []
    );


  const updateLastSeen =
    useCallback(
      async () => {
        try {

          const {
            data: {
              session,
            },
          } =
            await supabase
              .auth
              .getSession();


          if (!session) {
            return;
          }


          const {
            error,
          } =
            await supabase.rpc(
              "update_my_last_seen",
              {
                p_last_page:
                  getPageLabel(
                    pathname
                  ),

                p_last_pathname:
                  pathname,
              }
            );


          if (error) {
            console.error(
              "Last seen update failed:",
              error
            );
          }

        } catch (error) {

          console.error(
            "Last seen tracker failed:",
            error
          );

        }
      },
      [
        pathname,
        supabase,
      ]
    );


  useEffect(() => {

    // Sayfa açıldığında veya rota değiştiğinde
    // hemen güncelle.
    void updateLastSeen();


    // Oyuncu sayfayı açık tuttuğu sürece
    // her 60 saniyede bir güncelle.
    const interval =
      window.setInterval(
        () => {
          void updateLastSeen();
        },
        60_000
      );


    const handleFocus =
      () => {
        void updateLastSeen();
      };


    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void updateLastSeen();
        }
      };


    window.addEventListener(
      "focus",
      handleFocus
    );


    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );


    return () => {

      window.clearInterval(
        interval
      );


      window.removeEventListener(
        "focus",
        handleFocus
      );


      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

    };

  }, [
    updateLastSeen,
  ]);


  return null;
}