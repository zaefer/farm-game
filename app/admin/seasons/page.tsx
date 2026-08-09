import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";


function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

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


export default async function AdminSeasonsPage() {
  const admin =
    createAdminClient();


  // =====================================================
  // SEASONS
  // =====================================================

  const {
    data: seasons,
    error: seasonsError,
  } =
    await admin
      .from("seasons")
      .select(
        `
          id,
          name,
          starts_at,
          ends_at,
          status,
          created_at
        `
      )
      .order(
        "starts_at",
        {
          ascending: false,
        }
      );


  // =====================================================
  // PLAYER PROGRESS
  // We use this to calculate how many players
  // participated in each season.
  // =====================================================

  const {
    data: progress,
    error: progressError,
  } =
    await admin
      .from("player_progress")
      .select(
        `
          user_id,
          season_id,
          coins,
          level,
          xp
        `
      );


  if (progressError) {
    console.error(
      "Season progress error:",
      progressError
    );
  }


  // =====================================================
  // BUILD SEASON STATS
  // =====================================================

  const seasonStats =
    new Map<
      number,
      {
        players: Set<string>;
        totalCoins: number;
        totalXp: number;
        highestLevel: number;
      }
    >();


  for (
    const row
    of progress ?? []
  ) {
    if (
      !seasonStats.has(
        row.season_id
      )
    ) {
      seasonStats.set(
        row.season_id,
        {
          players:
            new Set<string>(),

          totalCoins: 0,

          totalXp: 0,

          highestLevel: 0,
        }
      );
    }


    const stats =
      seasonStats.get(
        row.season_id
      );


    if (!stats) {
      continue;
    }


    stats.players.add(
      row.user_id
    );


    stats.totalCoins +=
      row.coins ?? 0;


    stats.totalXp +=
      row.xp ?? 0;


    stats.highestLevel =
      Math.max(
        stats.highestLevel,
        row.level ?? 1
      );
  }


  const activeSeason =
    seasons?.find(
      (season) =>
        season.status ===
        "active"
    ) ?? null;


  const endedSeasonCount =
    seasons?.filter(
      (season) =>
        season.status ===
        "ended"
    ).length ?? 0;


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
              Seasons
            </h1>

          </div>


          <div className="flex flex-wrap gap-3">

            <Link
              href="/admin/wipe"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              Start New Season
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

        {/* DATABASE ERROR */}

        {seasonsError && (

          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
            Seasons could not be loaded:
            {" "}
            {seasonsError.message}
          </div>

        )}


        {/* SUMMARY */}

        <section className="mb-7 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5">

            <div className="text-sm text-green-300">
              Active Season
            </div>

            <div className="mt-2 text-2xl font-bold">
              {activeSeason?.name ??
                "None"}
            </div>

          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Total Seasons
            </div>

            <div className="mt-2 text-3xl font-bold">
              {seasons?.length ?? 0}
            </div>

          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Completed Seasons
            </div>

            <div className="mt-2 text-3xl font-bold">
              {endedSeasonCount}
            </div>

          </div>

        </section>


        {/* SEASON LIST */}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">

          <div className="border-b border-white/10 px-5 py-4">

            <h2 className="font-semibold">
              Season History
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Previous season data is preserved after every manual wipe.
            </p>

          </div>


          {!seasons ||
          seasons.length === 0 ? (

            <div className="px-5 py-12 text-center text-white/40">
              No seasons found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="border-b border-white/10 bg-black/10 text-xs uppercase text-white/40">

                  <tr>

                    <th className="px-5 py-4">
                      Season
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Players
                    </th>

                    <th className="px-5 py-4">
                      Highest Level
                    </th>

                    <th className="px-5 py-4">
                      Started
                    </th>

                    <th className="px-5 py-4">
                      Ended
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-white/5">

                  {seasons.map(
                    (season) => {

                      const stats =
                        seasonStats.get(
                          season.id
                        );


                      return (

                        <tr
                          key={season.id}
                          className="transition hover:bg-white/5"
                        >

                          {/* SEASON */}

                          <td className="px-5 py-4">

                            <div className="font-semibold">
                              {season.name}
                            </div>

                            <div className="mt-1 text-xs text-white/30">
                              Season ID:{" "}
                              {season.id}
                            </div>

                          </td>


                          {/* STATUS */}

                          <td className="px-5 py-4">

                            {season.status ===
                            "active" ? (

                              <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">

                                <span className="h-2 w-2 rounded-full bg-green-400" />

                                Active

                              </span>

                            ) : season.status ===
                              "ended" ? (

                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/50">
                                Ended
                              </span>

                            ) : (

                              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                                {season.status}
                              </span>

                            )}

                          </td>


                          {/* PLAYERS */}

                          <td className="px-5 py-4">

                            {stats?.players.size ??
                              0}

                          </td>


                          {/* HIGHEST LEVEL */}

                          <td className="px-5 py-4">

                            ⭐{" "}
                            {stats?.highestLevel ??
                              0}

                          </td>


                          {/* STARTED */}

                          <td className="px-5 py-4 text-white/60">

                            {formatDate(
                              season.starts_at
                            )}

                          </td>


                          {/* ENDED */}

                          <td className="px-5 py-4 text-white/60">

                            {season.status ===
                            "active"
                              ? "Still active"
                              : formatDate(
                                  season.ends_at
                                )}

                          </td>

                        </tr>

                      );
                    }
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