import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

function formatLastSeen(value: string | null) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const difference =
    Date.now() - date.getTime();

  const seconds =
    Math.floor(difference / 1000);

  const minutes =
    Math.floor(seconds / 60);

  const hours =
    Math.floor(minutes / 60);

  const days =
    Math.floor(hours / 24);

  if (seconds < 30) {
    return "Just now";
  }

  if (minutes < 1) {
    return "Less than a minute ago";
  }

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleString("tr-TR");
}


export default async function AdminPlayersPage() {
  const admin =
    createAdminClient();


  // =====================================================
  // AUTH USERS
  // =====================================================

  const {
    data: usersData,
    error: usersError,
  } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });


  if (usersError) {
    return (
      <main className="min-h-screen bg-[#0F1813] p-8 text-white">

        <div className="mx-auto max-w-7xl">

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
            {usersError.message}
          </div>

        </div>

      </main>
    );
  }


  // =====================================================
  // PROFILES
  // =====================================================

  const {
    data: profiles,
    error: profilesError,
  } =
    await admin
      .from("profiles")
      .select(
        `
          id,
          username,
          role,
          created_at,
          last_seen_at,
          last_page,
          last_pathname
        `
      );


  if (profilesError) {
    console.error(
      "Profiles error:",
      profilesError
    );
  }


  // =====================================================
  // ACTIVE SEASON
  // =====================================================

  const {
    data: season,
    error: seasonError,
  } =
    await admin
      .from("seasons")
      .select(
        `
          id,
          name
        `
      )
      .eq(
        "status",
        "active"
      )
      .order(
        "starts_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();


  if (seasonError) {
    console.error(
      "Season error:",
      seasonError
    );
  }


  // =====================================================
  // PLAYER PROGRESS
  // =====================================================

  const {
    data: progress,
    error: progressError,
  } =
    season
      ? await admin
          .from(
            "player_progress"
          )
          .select(
            `
              user_id,
              coins,
              level,
              xp
            `
          )
          .eq(
            "season_id",
            season.id
          )
      : {
          data: [],
          error: null,
        };


  if (progressError) {
    console.error(
      "Progress error:",
      progressError
    );
  }


  // =====================================================
  // BUILD PLAYERS
  // =====================================================

  const players =
    usersData.users.map(
      (user) => {
        const profile =
          profiles?.find(
            (item) =>
              item.id === user.id
          );


        const playerProgress =
          progress?.find(
            (item) =>
              item.user_id === user.id
          );


        return {
          id: user.id,

          email:
            user.email ??
            "No email",

          username:
            profile?.username ??
            "Unknown",

          role:
            profile?.role ??
            "player",

          coins:
            playerProgress?.coins ??
            0,

          level:
            playerProgress?.level ??
            1,

          xp:
            playerProgress?.xp ??
            0,

          lastSeen:
            profile?.last_seen_at ??
            null,

          lastPage:
            profile?.last_page ??
            "Unknown",

          lastPathname:
            profile?.last_pathname ??
            null,

          lastSignIn:
            user.last_sign_in_at,
        };
      }
    );


  players.sort(
    (first, second) => {
      const firstTime =
        first.lastSeen
          ? new Date(
              first.lastSeen
            ).getTime()
          : 0;


      const secondTime =
        second.lastSeen
          ? new Date(
              second.lastSeen
            ).getTime()
          : 0;


      return secondTime - firstTime;
    }
  );


  return (
    <main className="min-h-screen bg-[#0F1813] text-white">

      {/* HEADER */}

      <header className="border-b border-white/10 bg-[#142019]">

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">

          <div>

            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
              Farm Game Admin
            </div>

            <h1 className="mt-1 text-xl font-bold">
              Players
            </h1>

          </div>


          <div className="flex flex-wrap gap-3">

            <Link
              href="/admin/online"
              className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20"
            >
              ● Live Players
            </Link>


            <Link
              href="/admin"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              ← Dashboard
            </Link>

          </div>

        </div>

      </header>


      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* SUMMARY */}

        <section className="mb-7 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Total Accounts
            </div>

            <div className="mt-2 text-3xl font-bold">
              {players.length}
            </div>

          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Current Season
            </div>

            <div className="mt-2 text-xl font-bold">
              {season?.name ??
                "No Active Season"}
            </div>

          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Admin Accounts
            </div>

            <div className="mt-2 text-3xl font-bold">
              {
                players.filter(
                  (player) =>
                    player.role ===
                    "admin"
                ).length
              }
            </div>

          </div>

        </section>


        {/* PLAYER TABLE */}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">

            <div>

              <h2 className="font-semibold">
                All Players
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Players are ordered by their latest activity.
              </p>

            </div>


            <Link
              href="/admin/online"
              className="text-sm font-medium text-green-400 transition hover:text-green-300"
            >
              Open live activity →
            </Link>

          </div>


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
                    Level
                  </th>

                  <th className="px-5 py-4">
                    Coins
                  </th>

                  <th className="px-5 py-4">
                    XP
                  </th>

                  <th className="px-5 py-4">
                    Last Page
                  </th>

                  <th className="px-5 py-4">
                    Last Seen
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
                      key={player.id}
                      className="transition hover:bg-white/5"
                    >

                      {/* PLAYER */}

                      <td className="px-5 py-4">

                        <Link
                          href={`/admin/players/${player.id}`}
                          className="font-semibold text-white transition hover:text-green-400"
                        >
                          {player.username}
                        </Link>


                        <div className="mt-1 text-xs text-white/40">
                          {player.email}
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


                      {/* LEVEL */}

                      <td className="px-5 py-4 font-medium">
                        ⭐ {player.level}
                      </td>


                      {/* COINS */}

                      <td className="px-5 py-4 font-medium text-yellow-300">
                        🪙 {player.coins}
                      </td>


                      {/* XP */}

                      <td className="px-5 py-4">
                        {player.xp}
                      </td>


                      {/* LAST PAGE */}

                      <td className="px-5 py-4">

                        <div className="font-medium">
                          {player.lastPage}
                        </div>


                        {player.lastPathname && (

                          <div className="mt-1 text-xs text-white/30">
                            {player.lastPathname}
                          </div>

                        )}

                      </td>


                      {/* LAST SEEN */}

                      <td className="px-5 py-4">

                        <div className="text-white/70">
                          {formatLastSeen(
                            player.lastSeen
                          )}
                        </div>


                        {player.lastSeen && (

                          <div className="mt-1 text-xs text-white/30">
                            {new Date(
                              player.lastSeen
                            ).toLocaleString(
                              "tr-TR"
                            )}
                          </div>

                        )}

                      </td>


                      {/* ACTION */}

                      <td className="px-5 py-4">

                        <Link
                          href={`/admin/players/${player.id}`}
                          className="inline-flex whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold transition hover:border-green-500/30 hover:bg-green-500/10 hover:text-green-300"
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

        </section>

      </div>

    </main>
  );
}