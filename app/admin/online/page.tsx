"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  RealtimeChannel,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/client";


type PresencePayload = {
  userId: string;
  username: string;
  role: string;
  pathname: string;
  page: string;
  onlineAt: string;
};


type OnlinePlayer = PresencePayload & {
  sessionCount: number;
};


function buildOnlinePlayers(
  state: Record<
    string,
    PresencePayload[]
  >
): OnlinePlayer[] {
  const players =
    new Map<
      string,
      OnlinePlayer
    >();


  for (
    const presences
    of Object.values(state)
  ) {
    for (
      const presence
      of presences
    ) {
      if (!presence.userId) {
        continue;
      }


      const existing =
        players.get(
          presence.userId
        );


      if (!existing) {
        players.set(
          presence.userId,
          {
            ...presence,

            sessionCount:
              presences.length,
          }
        );

        continue;
      }


      const existingTime =
        new Date(
          existing.onlineAt
        ).getTime();


      const presenceTime =
        new Date(
          presence.onlineAt
        ).getTime();


      if (
        presenceTime >
        existingTime
      ) {
        players.set(
          presence.userId,
          {
            ...presence,

            sessionCount:
              Math.max(
                existing.sessionCount,
                presences.length
              ),
          }
        );
      }
    }
  }


  return Array
    .from(
      players.values()
    )
    .sort(
      (first, second) => {
        if (
          first.role === "admin" &&
          second.role !== "admin"
        ) {
          return -1;
        }


        if (
          first.role !== "admin" &&
          second.role === "admin"
        ) {
          return 1;
        }


        return first.username
          .localeCompare(
            second.username
          );
      }
    );
}


function formatPresenceTime(
  value: string
) {
  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown";
  }


  return date.toLocaleString(
    "tr-TR"
  );
}


export default function AdminOnlinePage() {
  const supabase =
    useMemo(
      () => createClient(),
      []
    );


  const [
    players,
    setPlayers,
  ] =
    useState<
      OnlinePlayer[]
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);


  useEffect(() => {
    let mounted = true;

    let channel:
      RealtimeChannel | null =
      null;


    async function startOnlineList() {
      const {
        data: {
          session,
        },

        error:
          sessionError,
      } =
        await supabase
          .auth
          .getSession();


      if (!mounted) {
        return;
      }


      if (
        sessionError ||
        !session
      ) {
        setError(
          "Active admin session could not be found."
        );

        setLoading(false);

        return;
      }


      await supabase
        .realtime
        .setAuth(
          session.access_token
        );


      if (!mounted) {
        return;
      }


      channel =
        supabase.channel(
          "game:global:presence",
          {
            config: {
              private: true,
            },
          }
        );


      const updatePlayers =
        () => {
          if (
            !mounted ||
            !channel
          ) {
            return;
          }


        const presenceState =
            channel.presenceState() as unknown as Record<
                string,
                PresencePayload[]
            >;


          setPlayers(
            buildOnlinePlayers(
              presenceState
            )
          );


          setLoading(false);

          setError(null);
        };


      channel
        .on(
          "presence",
          {
            event: "sync",
          },
          updatePlayers
        )
        .on(
          "presence",
          {
            event: "join",
          },
          updatePlayers
        )
        .on(
          "presence",
          {
            event: "leave",
          },
          updatePlayers
        )
        .subscribe(
          (
            status,
            subscribeError
          ) => {
            if (!mounted) {
              return;
            }


            if (
              status ===
              "SUBSCRIBED"
            ) {
              updatePlayers();

              return;
            }


            if (
              status ===
                "CHANNEL_ERROR" ||
              status ===
                "TIMED_OUT"
            ) {
              console.error(
                "Online players channel:",
                status,
                subscribeError
              );


              setError(
                "Realtime connection could not be established."
              );

              setLoading(false);
            }
          }
        );
    }


    void startOnlineList();


    return () => {
      mounted = false;


      if (channel) {
        void supabase
          .removeChannel(
            channel
          );
      }
    };
  }, [
    supabase,
  ]);


  const playerCount =
    players.filter(
      (player) =>
        player.role !==
        "admin"
    ).length;


  const adminCount =
    players.filter(
      (player) =>
        player.role ===
        "admin"
    ).length;


  return (
    <main className="min-h-screen bg-[#0F1813] text-white">

      {/* HEADER */}

      <header className="border-b border-white/10 bg-[#142019]">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          <div>

            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
              Farm Game Admin
            </div>

            <h1 className="mt-1 text-xl font-bold">
              Online Players
            </h1>

          </div>


          <Link
            href="/admin"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            ← Dashboard
          </Link>

        </div>

      </header>


      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* SUMMARY */}

        <section className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5">

            <div className="flex items-center gap-2 text-sm text-green-300">

              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />

              Live Connections

            </div>


            <div className="mt-2 text-3xl font-bold">
              {players.length}
            </div>

          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Players Online
            </div>

            <div className="mt-2 text-3xl font-bold">
              {playerCount}
            </div>

          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Admins Online
            </div>

            <div className="mt-2 text-3xl font-bold">
              {adminCount}
            </div>

          </div>

        </section>


        {/* ERROR */}

        {error && (

          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>

        )}


        {/* ONLINE LIST */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

            <div>

              <h2 className="font-semibold">
                Current Connections
              </h2>

              <p className="mt-1 text-sm text-white/40">
                This list updates automatically.
              </p>

            </div>


            <div className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
              ● Live
            </div>

          </div>


          {loading ? (

            <div className="px-5 py-12 text-center text-sm text-white/40">
              Connecting to Realtime...
            </div>

          ) : players.length === 0 ? (

            <div className="px-5 py-12 text-center">

              <div className="text-3xl">
                🌙
              </div>

              <div className="mt-3 font-semibold">
                Nobody is online
              </div>

              <p className="mt-1 text-sm text-white/40">
                Connected players will appear here.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="border-b border-white/10 bg-black/10 text-xs uppercase text-white/40">

                  <tr>

                    <th className="px-5 py-4">
                      Player
                    </th>

                    <th className="px-5 py-4">
                      Role
                    </th>

                    <th className="px-5 py-4">
                      Current Page
                    </th>

                    <th className="px-5 py-4">
                      Sessions
                    </th>

                    <th className="px-5 py-4">
                      Presence Updated
                    </th>

                    <th className="px-5 py-4">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-white/5">

                  {players.map(
                    (player) => (

                      <tr
                        key={player.userId}
                        className="transition hover:bg-white/5"
                      >

                        {/* PLAYER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <span className="relative flex h-3 w-3">

                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />

                              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-400" />

                            </span>


                            <div>

                              <Link
                                href={`/admin/players/${player.userId}`}
                                className="font-semibold transition hover:text-green-400"
                              >
                                {player.username}
                              </Link>

                              <div className="mt-1 max-w-[220px] truncate text-xs text-white/30">
                                {player.userId}
                              </div>

                            </div>

                          </div>

                        </td>


                        {/* ROLE */}

                        <td className="px-5 py-4">

                          {player.role ===
                          "admin" ? (

                            <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                              Admin
                            </span>

                          ) : (

                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                              Player
                            </span>

                          )}

                        </td>


                        {/* PAGE */}

                        <td className="px-5 py-4">

                          <div className="font-medium">
                            {player.page}
                          </div>

                          <div className="mt-1 text-xs text-white/30">
                            {player.pathname}
                          </div>

                        </td>


                        {/* SESSION COUNT */}

                        <td className="px-5 py-4">
                          {player.sessionCount}
                        </td>


                        {/* UPDATED */}

                        <td className="px-5 py-4 text-white/50">
                          {formatPresenceTime(
                            player.onlineAt
                          )}
                        </td>


                        {/* ACTION */}

                        <td className="px-5 py-4">

                          <Link
                            href={`/admin/players/${player.userId}`}
                            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold transition hover:border-green-500/30 hover:bg-green-500/10 hover:text-green-300"
                          >
                            View Player →
                          </Link>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </main>
  );
}