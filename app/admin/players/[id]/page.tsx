import Link from "next/link";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

import {
  banPlayer,
  unbanPlayer,
} from "./actions";


type PlayerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};


export default async function PlayerDetailPage({
  params,
  searchParams,
}: PlayerDetailPageProps) {
  const { id } = await params;

  const messages =
    await searchParams;

  const admin =
    createAdminClient();


  // =====================================================
  // AUTH USER
  // =====================================================

  const {
    data: authData,
    error: authError,
  } =
    await admin.auth.admin.getUserById(
      id
    );


  if (
    authError ||
    !authData.user
  ) {
    notFound();
  }


  const user =
    authData.user;


  // =====================================================
  // PROFILE
  // =====================================================

  const { data: profile } =
    await admin
      .from("profiles")
      .select(
        `
          id,
          username,
          role,
          created_at
        `
      )
      .eq("id", id)
      .maybeSingle();


  // =====================================================
  // ACTIVE SEASON
  // =====================================================

  const { data: season } =
    await admin
      .from("seasons")
      .select(
        `
          id,
          name,
          starts_at,
          ends_at
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


  // =====================================================
  // PROGRESS
  // =====================================================

  const { data: progress } =
    season
      ? await admin
          .from(
            "player_progress"
          )
          .select(
            `
              coins,
              level,
              xp
            `
          )
          .eq(
            "user_id",
            id
          )
          .eq(
            "season_id",
            season.id
          )
          .maybeSingle()
      : {
          data: null,
        };


  // =====================================================
  // INVENTORY
  // =====================================================

  const { data: inventory } =
    season
      ? await admin
          .from("inventory")
          .select(
            `
              item_id,
              quantity
            `
          )
          .eq(
            "user_id",
            id
          )
          .eq(
            "season_id",
            season.id
          )
      : {
          data: [],
        };


  // =====================================================
  // FARM
  // =====================================================

  const { data: farm } =
    season
      ? await admin
          .from("farm_tiles")
          .select(
            `
              tile_index,
              crop_id
            `
          )
          .eq(
            "user_id",
            id
          )
          .eq(
            "season_id",
            season.id
          )
      : {
          data: [],
        };


  // =====================================================
  // BAN HISTORY
  // =====================================================

  const { data: bans } =
    await admin
      .from("player_bans")
      .select(
        `
          id,
          reason,
          admin_note,
          duration,
          banned_at,
          expires_at,
          is_active,
          unbanned_at
        `
      )
      .eq(
        "user_id",
        id
      )
      .order(
        "banned_at",
        {
          ascending: false,
        }
      );


  const activeBan =
    bans?.find(
      (ban) =>
        ban.is_active
    ) ?? null;


  // =====================================================
  // VALUES
  // =====================================================

  const usedSlots =
    farm?.filter(
      (tile) =>
        tile.crop_id !== null
    ).length ?? 0;


  const totalSlots =
    farm?.length ?? 0;


  const wheat =
    inventory?.find(
      (item) =>
        item.item_id ===
        "wheat"
    )?.quantity ?? 0;


  const tomato =
    inventory?.find(
      (item) =>
        item.item_id ===
        "tomato"
    )?.quantity ?? 0;


  const isAdmin =
    profile?.role ===
    "admin";


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
              Player Details
            </h1>
          </div>

          <Link
            href="/admin/players"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            ← Players
          </Link>

        </div>
      </header>


      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* MESSAGES */}

        {messages.error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {messages.error}
          </div>
        )}


        {messages.success && (
          <div className="mb-5 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm text-green-300">
            {messages.success}
          </div>
        )}


        {/* PROFILE */}

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>
              <div className="flex flex-wrap items-center gap-3">

                <h2 className="text-2xl font-bold">
                  {profile?.username ??
                    "Unknown Player"}
                </h2>


                {isAdmin ? (
                  <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                    Admin
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                    Player
                  </span>
                )}


                {activeBan && (
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                    Banned
                  </span>
                )}

              </div>


              <p className="mt-2 text-sm text-white/50">
                {user.email ??
                  "No email"}
              </p>


              <p className="mt-1 text-xs text-white/30">
                User ID: {user.id}
              </p>
            </div>


            {activeBan ? (
              <div className="rounded-xl bg-red-500/10 px-4 py-3">

                <div className="text-xs text-white/40">
                  Account Status
                </div>

                <div className="mt-1 font-semibold text-red-400">
                  ● Banned
                </div>

              </div>
            ) : (
              <div className="rounded-xl bg-green-500/10 px-4 py-3">

                <div className="text-xs text-white/40">
                  Account Status
                </div>

                <div className="mt-1 font-semibold text-green-400">
                  ● Active
                </div>

              </div>
            )}

          </div>

        </section>


        {/* STATS */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/40">
              Level
            </div>

            <div className="mt-2 text-3xl font-bold">
              ⭐ {progress?.level ?? 1}
            </div>
          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/40">
              Coins
            </div>

            <div className="mt-2 text-3xl font-bold text-yellow-300">
              🪙 {progress?.coins ?? 0}
            </div>
          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/40">
              XP
            </div>

            <div className="mt-2 text-3xl font-bold">
              {progress?.xp ?? 0}
            </div>
          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/40">
              Farm Capacity
            </div>

            <div className="mt-2 text-3xl font-bold">
              {usedSlots} / {totalSlots}
            </div>

            <div className="mt-2 text-xs text-white/30">
              Used slots
            </div>
          </div>

        </section>


        {/* INVENTORY */}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">

          <h2 className="text-lg font-semibold">
            Inventory
          </h2>


          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 p-4">

              <div>
                🌾 Wheat
              </div>

              <strong>
                {wheat}
              </strong>

            </div>


            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 p-4">

              <div>
                🍅 Tomato
              </div>

              <strong>
                {tomato}
              </strong>

            </div>

          </div>

        </section>


        {/* BAN MANAGEMENT */}

        {!isAdmin && (
          <section className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">

            <h2 className="text-lg font-semibold">
              Ban Management
            </h2>

           <p className="mt-1 text-sm text-white/40">
            Control this player&apos;s access to the game.
          </p>


            {activeBan ? (

              <div className="mt-5">

                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">

                  <div className="font-semibold text-red-300">
                    Player is currently banned
                  </div>

                  <div className="mt-3 text-sm text-white/60">
                    Reason:{" "}
                    {activeBan.reason}
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    Duration:{" "}
                    {activeBan.duration}
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    Expires:{" "}
                    {activeBan.expires_at
                      ? new Date(
                          activeBan.expires_at
                        ).toLocaleString(
                          "tr-TR"
                        )
                      : "Permanent"}
                  </div>

                </div>


                <form
                  action={unbanPlayer}
                  className="mt-4"
                >

                  <input
                    type="hidden"
                    name="targetUserId"
                    value={id}
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-green-400"
                  >
                    Unban Player
                  </button>

                </form>

              </div>

            ) : (

              <form
                action={banPlayer}
                className="mt-5 grid gap-4"
              >

                <input
                  type="hidden"
                  name="targetUserId"
                  value={id}
                />


                <div>

                  <label
                    htmlFor="reason"
                    className="mb-2 block text-sm font-medium"
                  >
                    Ban Reason
                  </label>

                  <input
                    id="reason"
                    name="reason"
                    type="text"
                    required
                    minLength={3}
                    maxLength={500}
                    placeholder="Cheating, exploiting, abusive behavior..."
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-red-500/50"
                  />

                </div>


                <div>

                  <label
                    htmlFor="duration"
                    className="mb-2 block text-sm font-medium"
                  >
                    Duration
                  </label>

                  <select
                    id="duration"
                    name="duration"
                    defaultValue="24h"
                    className="w-full rounded-xl border border-white/10 bg-[#142019] px-4 py-3 text-white"
                  >
                    <option value="1h">
                      1 Hour
                    </option>

                    <option value="24h">
                      24 Hours
                    </option>

                    <option value="3d">
                      3 Days
                    </option>

                    <option value="7d">
                      7 Days
                    </option>

                    <option value="30d">
                      30 Days
                    </option>

                    <option value="permanent">
                      Permanent
                    </option>
                  </select>

                </div>


                <div>

                  <label
                    htmlFor="adminNote"
                    className="mb-2 block text-sm font-medium"
                  >
                    Admin Note
                  </label>

                  <textarea
                    id="adminNote"
                    name="adminNote"
                    maxLength={1000}
                    rows={4}
                    placeholder="Internal note..."
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-red-500/50"
                  />

                </div>


                <div>
                  <button
                    type="submit"
                    className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
                  >
                    🚫 Ban Player
                  </button>
                </div>

              </form>

            )}

          </section>
        )}


        {/* BAN HISTORY */}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">

          <h2 className="text-lg font-semibold">
            Ban History
          </h2>


          {!bans ||
          bans.length === 0 ? (

            <p className="mt-4 text-sm text-white/40">
              This player has no ban history.
            </p>

          ) : (

            <div className="mt-5 space-y-3">

              {bans.map(
                (ban) => (

                  <div
                    key={ban.id}
                    className="rounded-xl border border-white/10 bg-black/10 p-4"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div className="font-medium">
                        {ban.reason}
                      </div>


                      {ban.is_active ? (
                        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">
                          Ended
                        </span>
                      )}

                    </div>


                    <div className="mt-3 text-xs text-white/40">

                      {new Date(
                        ban.banned_at
                      ).toLocaleString(
                        "tr-TR"
                      )}

                      {" • "}

                      {ban.duration}

                    </div>


                    {ban.admin_note && (
                      <div className="mt-2 text-sm text-white/50">
                        Admin note:{" "}
                        {ban.admin_note}
                      </div>
                    )}

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>
    </main>
  );
}