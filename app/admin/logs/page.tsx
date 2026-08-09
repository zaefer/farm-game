import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

type LogMetadata = {
  old_season_id?: number;
  old_season_name?: string;

  new_season_id?: number;
  new_season_name?: string;

  affected_players?: number;

  manual_wipe?: boolean;

  [key: string]: unknown;
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


function getActionLabel(
  action: string
) {
  switch (action) {
    case "START_NEW_SEASON":
      return "Started New Season";

    case "BAN_PLAYER":
      return "Banned Player";

    case "UNBAN_PLAYER":
      return "Unbanned Player";

    case "GIVE_COINS":
      return "Gave Coins";

    case "RESET_PLAYER":
      return "Reset Player";

    default:
      return action
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        );
  }
}


function getActionStyle(
  action: string
) {
  switch (action) {
    case "START_NEW_SEASON":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

    case "BAN_PLAYER":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    case "UNBAN_PLAYER":
      return "border-green-500/20 bg-green-500/10 text-green-300";

    case "GIVE_COINS":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

    case "RESET_PLAYER":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    default:
      return "border-white/10 bg-white/5 text-white/60";
  }
}


export default async function AdminLogsPage() {
  const admin =
    createAdminClient();


  // =====================================================
  // ADMIN LOGS
  // =====================================================

  const {
    data: logs,
    error: logsError,
  } =
    await admin
      .from("admin_logs")
      .select(
        `
          id,
          admin_id,
          action,
          target_user_id,
          metadata,
          created_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(200);


  // =====================================================
  // GET ALL PROFILE IDS USED IN LOGS
  // =====================================================

  const profileIds =
    Array.from(
      new Set(
        (logs ?? [])
          .flatMap(
            (log) => [
              log.admin_id,
              log.target_user_id,
            ]
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      )
    );


  // =====================================================
  // PROFILES
  // =====================================================

  const {
    data: profiles,
  } =
    profileIds.length > 0
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
            profileIds
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
          item.id ===
          userId
      );

    return (
      profile?.username ??
      "Unknown User"
    );
  }


  const wipeCount =
    logs?.filter(
      (log) =>
        log.action ===
        "START_NEW_SEASON"
    ).length ?? 0;


  const banActionCount =
    logs?.filter(
      (log) =>
        log.action ===
          "BAN_PLAYER" ||
        log.action ===
          "UNBAN_PLAYER"
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
              Admin Logs
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

        {/* ERROR */}

        {logsError && (

          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">

            Admin logs could not be loaded:
            {" "}
            {logsError.message}

          </div>

        )}


        {/* SUMMARY */}

        <section className="mb-7 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Recorded Actions
            </div>

            <div className="mt-2 text-3xl font-bold">
              {logs?.length ?? 0}
            </div>

          </div>


          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">

            <div className="text-sm text-yellow-300">
              Season Wipes
            </div>

            <div className="mt-2 text-3xl font-bold">
              {wipeCount}
            </div>

          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Ban Actions
            </div>

            <div className="mt-2 text-3xl font-bold">
              {banActionCount}
            </div>

          </div>

        </section>


        {/* LOG LIST */}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">

          <div className="border-b border-white/10 px-5 py-4">

            <h2 className="font-semibold">
              Administrative Activity
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Latest 200 recorded administrative actions.
            </p>

          </div>


          {!logs ||
          logs.length === 0 ? (

            <div className="px-5 py-12 text-center">

              <div className="text-3xl">
                📜
              </div>

              <div className="mt-3 font-semibold">
                No admin logs yet
              </div>

              <p className="mt-1 text-sm text-white/40">
                Administrative actions will appear here.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-white/5">

              {logs.map(
                (log) => {

                  const metadata =
                    (
                      log.metadata ??
                      {}
                    ) as LogMetadata;


                  return (

                    <article
                      key={log.id}
                      className="p-5 transition hover:bg-white/[0.02]"
                    >

                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">

                        {/* LEFT */}

                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getActionStyle(
                                log.action
                              )}`}
                            >
                              {getActionLabel(
                                log.action
                              )}
                            </span>


                            <span className="text-sm text-white/40">
                              {formatDate(
                                log.created_at
                              )}
                            </span>

                          </div>


                          <div className="mt-4 text-sm">

                            <span className="text-white/40">
                              Admin:
                            </span>

                            {" "}

                            <span className="font-semibold">
                              {getUsername(
                                log.admin_id
                              )}
                            </span>

                          </div>


                          {log.target_user_id && (

                            <div className="mt-2 text-sm">

                              <span className="text-white/40">
                                Target:
                              </span>

                              {" "}

                              <Link
                                href={`/admin/players/${log.target_user_id}`}
                                className="font-semibold text-green-400 transition hover:text-green-300"
                              >
                                {getUsername(
                                  log.target_user_id
                                )}
                              </Link>

                            </div>

                          )}

                        </div>


                        {/* ID */}

                        <div className="text-xs text-white/20">
                          Log #{log.id}
                        </div>

                      </div>


                      {/* WIPE DETAILS */}

                      {log.action ===
                        "START_NEW_SEASON" && (

                        <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 sm:grid-cols-3">

                          <div>

                            <div className="text-xs uppercase tracking-wider text-white/30">
                              Previous Season
                            </div>

                            <div className="mt-1 font-medium">
                              {metadata.old_season_name ??
                                "Unknown"}
                            </div>

                          </div>


                          <div>

                            <div className="text-xs uppercase tracking-wider text-white/30">
                              New Season
                            </div>

                            <div className="mt-1 font-medium text-green-300">
                              {metadata.new_season_name ??
                                "Unknown"}
                            </div>

                          </div>


                          <div>

                            <div className="text-xs uppercase tracking-wider text-white/30">
                              Players Reset
                            </div>

                            <div className="mt-1 font-medium">
                              {typeof metadata.affected_players ===
                              "number"
                                ? metadata.affected_players
                                : "—"}
                            </div>

                          </div>

                        </div>

                      )}

                    </article>

                  );
                }
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}