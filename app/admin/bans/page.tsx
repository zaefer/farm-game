import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { unbanPlayer } from "@/app/admin/players/[id]/actions";


type BanStatus =
  | "active"
  | "expired"
  | "ended";


type BanRow = {
  id: number;

  user_id: string;

  admin_id: string | null;

  reason: string;

  admin_note: string | null;

  duration: string;

  banned_at: string;

  expires_at: string | null;

  is_active: boolean;

  unbanned_at: string | null;

  unbanned_by: string | null;

  ban_status: BanStatus;
};


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


function StatusBadge({
  status,
}: {
  status: BanStatus;
}) {
  if (
    status === "active"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">

        <span className="h-2 w-2 rounded-full bg-red-400" />

        Active

      </span>
    );
  }


  if (
    status === "expired"
  ) {
    return (
      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
        Expired
      </span>
    );
  }


  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/50">
      Ended
    </span>
  );
}


export default async function AdminBansPage() {
  const admin =
    createAdminClient();


  // =====================================================
  // BANS
  // =====================================================

  const {
    data: banData,
    error: bansError,
  } =
    await admin
      .from(
        "player_bans_with_status"
      )
      .select(
        `
          id,
          user_id,
          admin_id,
          reason,
          admin_note,
          duration,
          banned_at,
          expires_at,
          is_active,
          unbanned_at,
          unbanned_by,
          ban_status
        `
      )
      .order(
        "banned_at",
        {
          ascending: false,
        }
      );


  const bans =
    (banData ??
      []) as BanRow[];


  // =====================================================
  // PROFILE IDS
  // =====================================================

  const userIds =
    Array.from(
      new Set(
        bans
          .flatMap(
            (ban) => [
              ban.user_id,
              ban.admin_id,
              ban.unbanned_by,
            ]
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
      )
    );


  // =====================================================
  // PROFILES
  // =====================================================

  const {
    data: profiles,
  } =
    userIds.length > 0
      ? await admin
          .from("profiles")
          .select(
            `
              id,
              username,
              role
            `
          )
          .in(
            "id",
            userIds
          )
      : {
          data: [],
        };


  function getUsername(
    userId:
      | string
      | null
  ) {
    if (!userId) {
      return "System";
    }


    const profile =
      profiles?.find(
        (item) =>
          item.id === userId
      );


    return (
      profile?.username ??
      "Unknown User"
    );
  }


  // =====================================================
  // COUNTS
  // =====================================================

  const activeBans =
    bans.filter(
      (ban) =>
        ban.ban_status ===
        "active"
    );


  const expiredBans =
    bans.filter(
      (ban) =>
        ban.ban_status ===
        "expired"
    );


  const endedBans =
    bans.filter(
      (ban) =>
        ban.ban_status ===
        "ended"
    );


  return (
    <main className="min-h-screen bg-[#0F1813] text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-white/10 bg-[#142019]">

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">

          <div>

            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
              Farm Game Admin
            </div>


            <h1 className="mt-1 text-xl font-bold">
              Ban Management
            </h1>

          </div>


          <div className="flex flex-wrap gap-3">

            <Link
              href="/admin/players"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Players
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


        {/* =================================================
            ERROR
        ================================================= */}

        {bansError && (

          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">

            Ban records could not be loaded:
            {" "}
            {bansError.message}

          </div>

        )}


        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


          {/* ACTIVE */}

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">

            <div className="text-sm text-red-300">
              Active Bans
            </div>


            <div className="mt-2 text-3xl font-bold">
              {activeBans.length}
            </div>

          </div>


          {/* TOTAL */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Total Ban Records
            </div>


            <div className="mt-2 text-3xl font-bold">
              {bans.length}
            </div>

          </div>


          {/* EXPIRED */}

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">

            <div className="text-sm text-yellow-300">
              Expired
            </div>


            <div className="mt-2 text-3xl font-bold">
              {expiredBans.length}
            </div>

          </div>


          {/* ENDED */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Manually Ended
            </div>


            <div className="mt-2 text-3xl font-bold">
              {endedBans.length}
            </div>

          </div>

        </section>


        {/* =================================================
            ACTIVE BANS
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-red-500/20 bg-white/5">

          <div className="border-b border-white/10 px-5 py-4">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>

                <h2 className="font-semibold">
                  Active Bans
                </h2>


                <p className="mt-1 text-sm text-white/40">
                  Players currently unable to access the game.
                </p>

              </div>


              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                {activeBans.length} Active
              </span>

            </div>

          </div>


          {activeBans.length ===
          0 ? (

            <div className="px-5 py-12 text-center">

              <div className="text-4xl">
                ✅
              </div>


              <div className="mt-3 font-semibold">
                No active bans
              </div>


              <p className="mt-1 text-sm text-white/40">
                There are currently no suspended players.
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
                      Reason
                    </th>

                    <th className="px-5 py-4">
                      Duration
                    </th>

                    <th className="px-5 py-4">
                      Banned By
                    </th>

                    <th className="px-5 py-4">
                      Started
                    </th>

                    <th className="px-5 py-4">
                      Ends
                    </th>

                    <th className="px-5 py-4">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-white/5">

                  {activeBans.map(
                    (ban) => (

                      <tr
                        key={ban.id}
                        className="transition hover:bg-white/[0.03]"
                      >


                        {/* PLAYER */}

                        <td className="px-5 py-4">

                          <Link
                            href={`/admin/players/${ban.user_id}`}
                            className="font-semibold transition hover:text-green-400"
                          >
                            {getUsername(
                              ban.user_id
                            )}
                          </Link>


                          <div className="mt-2">

                            <StatusBadge
                              status={
                                ban.ban_status
                              }
                            />

                          </div>

                        </td>


                        {/* REASON */}

                        <td className="max-w-[260px] px-5 py-4">

                          <div className="font-medium">
                            {ban.reason}
                          </div>


                          {ban.admin_note && (

                            <div className="mt-1 truncate text-xs text-white/30">
                              Note:{" "}
                              {ban.admin_note}
                            </div>

                          )}

                        </td>


                        {/* DURATION */}

                        <td className="px-5 py-4">
                          {ban.duration}
                        </td>


                        {/* ADMIN */}

                        <td className="px-5 py-4 text-white/60">

                          {getUsername(
                            ban.admin_id
                          )}

                        </td>


                        {/* STARTED */}

                        <td className="whitespace-nowrap px-5 py-4 text-white/50">

                          {formatDate(
                            ban.banned_at
                          )}

                        </td>


                        {/* ENDS */}

                        <td className="whitespace-nowrap px-5 py-4 text-red-300">

                          {ban.expires_at
                            ? formatDate(
                                ban.expires_at
                              )
                            : "Permanent"}

                        </td>


                        {/* ACTION */}

                        <td className="px-5 py-4">

                          <div className="flex flex-wrap gap-2">

                            <Link
                              href={`/admin/players/${ban.user_id}`}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                            >
                              View
                            </Link>


                            <form
                              action={
                                unbanPlayer
                              }
                            >

                              <input
                                type="hidden"
                                name="targetUserId"
                                value={
                                  ban.user_id
                                }
                              />


                              <button
                                type="submit"
                                className="rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-black transition hover:bg-green-400"
                              >
                                Unban
                              </button>

                            </form>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* =================================================
            BAN HISTORY
        ================================================= */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">

          <div className="border-b border-white/10 px-5 py-4">

            <h2 className="font-semibold">
              Ban History
            </h2>


            <p className="mt-1 text-sm text-white/40">
              Complete suspension history for all players.
            </p>

          </div>


          {bans.length === 0 ? (

            <div className="px-5 py-12 text-center text-white/40">
              No ban history found.
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
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Reason
                    </th>

                    <th className="px-5 py-4">
                      Duration
                    </th>

                    <th className="px-5 py-4">
                      Banned By
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4">
                      Ended
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-white/5">

                  {bans.map(
                    (ban) => (

                      <tr
                        key={ban.id}
                        className="transition hover:bg-white/[0.03]"
                      >


                        {/* PLAYER */}

                        <td className="px-5 py-4">

                          <Link
                            href={`/admin/players/${ban.user_id}`}
                            className="font-semibold transition hover:text-green-400"
                          >
                            {getUsername(
                              ban.user_id
                            )}
                          </Link>

                        </td>


                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <StatusBadge
                            status={
                              ban.ban_status
                            }
                          />

                        </td>


                        {/* REASON */}

                        <td className="max-w-[260px] px-5 py-4">

                          <div className="font-medium">
                            {ban.reason}
                          </div>

                        </td>


                        {/* DURATION */}

                        <td className="px-5 py-4">
                          {ban.duration}
                        </td>


                        {/* ADMIN */}

                        <td className="px-5 py-4 text-white/60">

                          {getUsername(
                            ban.admin_id
                          )}

                        </td>


                        {/* DATE */}

                        <td className="whitespace-nowrap px-5 py-4 text-white/50">

                          {formatDate(
                            ban.banned_at
                          )}

                        </td>


                        {/* ENDED */}

                        <td className="whitespace-nowrap px-5 py-4 text-white/50">

                          {ban.ban_status ===
                          "active"
                            ? ban.expires_at
                              ? formatDate(
                                  ban.expires_at
                                )
                              : "Permanent"
                            : ban.unbanned_at
                              ? formatDate(
                                  ban.unbanned_at
                                )
                              : ban.expires_at
                                ? formatDate(
                                    ban.expires_at
                                  )
                                : "—"}

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