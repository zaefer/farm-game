import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBanToken } from "@/lib/ban-token";
import BanExpiryStatus from "./BanExpiryStatus";


type BannedPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};


export default async function BannedPage({
  searchParams,
}: BannedPageProps) {
  const params =
    await searchParams;


  // ====================================================
  // TOKEN
  // ====================================================

  if (!params.token) {
    return <InvalidBanPage />;
  }


  const payload =
    verifyBanToken(
      params.token
    );


  if (!payload) {
    return <InvalidBanPage />;
  }


  const admin =
    createAdminClient();


  // ====================================================
  // PROFILE
  // ====================================================

  const {
    data: profile,
  } =
    await admin
      .from("profiles")
      .select("username")
      .eq(
        "id",
        payload.userId
      )
      .maybeSingle();


  // ====================================================
  // ACTIVE BAN
  // ====================================================

  const {
    data: ban,
    error: banError,
  } =
    await admin
      .from("player_bans")
      .select(
        `
          id,
          reason,
          duration,
          banned_at,
          expires_at,
          is_active
        `
      )
      .eq(
        "user_id",
        payload.userId
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "banned_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();


  if (
    banError ||
    !ban
  ) {
    return <InvalidBanPage />;
  }


  // ====================================================
  // BAN PAGE
  // ====================================================

  return (
    <main className="min-h-screen bg-[#0F1813] px-5 py-10 text-white">

      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl items-center justify-center">

        <div className="w-full rounded-[32px] border border-red-500/20 bg-[#142019] p-7 md:p-9">


          {/* =================================================
              EXPIRY STATUS
          ================================================= */}

          <BanExpiryStatus
            expiresAt={
              ban.expires_at
            }
          >


            {/* =================================================
                ICON
            ================================================= */}

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
              🚫
            </div>


            {/* =================================================
                TITLE
            ================================================= */}

            <span className="mt-6 inline-block rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-300">
              Account Suspended
            </span>


            <h1 className="mt-4 text-3xl font-bold">
              Your account is banned.
            </h1>


            {profile?.username && (

              <p className="mt-2 text-white/50">

                Farmer:{" "}

                <strong className="text-white">
                  {profile.username}
                </strong>

              </p>

            )}


            {/* =================================================
                DETAILS
            ================================================= */}

            <div className="mt-7 space-y-3">


              {/* REASON */}

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">

                <div className="text-xs uppercase tracking-wider text-white/30">
                  Reason
                </div>

                <div className="mt-2 font-medium">
                  {ban.reason}
                </div>

              </div>


              {/* DURATION */}

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">

                <div className="text-xs uppercase tracking-wider text-white/30">
                  Duration
                </div>

                <div className="mt-2 font-medium">
                  {ban.duration}
                </div>

              </div>


              {/* STARTED */}

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">

                <div className="text-xs uppercase tracking-wider text-white/30">
                  Suspended On
                </div>

                <div className="mt-2 font-medium">

                  {new Date(
                    ban.banned_at
                  ).toLocaleString(
                    "tr-TR"
                  )}

                </div>

              </div>


              {/* ENDS */}

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">

                <div className="text-xs uppercase tracking-wider text-red-300/60">
                  Ban Ends
                </div>

                <div className="mt-2 font-semibold text-red-300">

                  {ban.expires_at
                    ? new Date(
                        ban.expires_at
                      ).toLocaleString(
                        "tr-TR"
                      )
                    : "Permanent"}

                </div>

              </div>

            </div>


            {/* =================================================
                HELP
            ================================================= */}

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/50">

              If you believe this suspension was made in error,
              please contact a game administrator.

            </div>


            <Link
              href="/login"
              className="mt-6 block w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold transition hover:bg-white/10"
            >
              ← Return to Login
            </Link>

          </BanExpiryStatus>

        </div>

      </div>

    </main>
  );
}


// ======================================================
// INVALID TOKEN
// ======================================================

function InvalidBanPage() {
  return (
    <main className="min-h-screen bg-[#0F1813] px-5 py-10 text-white">

      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl items-center justify-center">

        <div className="w-full rounded-[32px] border border-red-500/20 bg-[#142019] p-8 text-center">

          <div className="text-5xl">
            🚫
          </div>


          <h1 className="mt-5 text-3xl font-bold">
            Account Suspended
          </h1>


          <p className="mt-3 text-white/50">
            This account is currently unable to access the game.
          </p>


          <Link
            href="/login"
            className="mt-7 inline-block rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold transition hover:bg-white/10"
          >
            Return to Login
          </Link>

        </div>

      </div>

    </main>
  );
}