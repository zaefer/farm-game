import Link from "next/link";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import WipeForm from "./WipeForm";


type AdminWipePageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};


export default async function AdminWipePage({
  searchParams,
}: AdminWipePageProps) {
  const messages =
    await searchParams;


  const admin =
    createAdminClient();


  const {
    data: season,
    error: seasonError,
  } =
    await admin
      .from("seasons")
      .select(
        `
          id,
          name,
          starts_at
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


  const {
    count:
      playerCount,
  } =
    await admin
      .from("profiles")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      );


  return (
    <main className="min-h-screen bg-[#0F1813] text-white">

      {/* HEADER */}

      <header className="border-b border-white/10 bg-[#142019]">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          <div>

            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
              Farm Game Admin
            </div>

            <h1 className="mt-1 text-xl font-bold">
              Manual Season Wipe
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


      <div className="mx-auto max-w-5xl px-5 py-8">

        {/* MESSAGES */}

        {messages.error && (

          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {messages.error}
          </div>

        )}


        {messages.success && (

          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm text-green-300">
            {messages.success}
          </div>

        )}


        {/* SUMMARY */}

        <section className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Active Season
            </div>

            <div className="mt-2 text-xl font-bold">
              {season?.name ??
                "Not Found"}
            </div>

          </div>


          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="text-sm text-white/40">
              Affected Accounts
            </div>

            <div className="mt-2 text-3xl font-bold">
              {playerCount ?? 0}
            </div>

          </div>


          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5">

            <div className="text-sm text-green-300">
              Wipe Mode
            </div>

            <div className="mt-2 text-xl font-bold">
              Manual Only
            </div>

          </div>

        </section>


        {/* DATABASE ERROR */}

        {seasonError && (

          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
            Active season could not be loaded:
            {" "}
            {seasonError.message}
          </div>

        )}


        {/* WIPE FORM */}

        {season ? (

          <section className="rounded-2xl border border-red-500/20 bg-white/5 p-6 md:p-8">

            <div className="mb-7">

              <h2 className="text-2xl font-bold">
                Start a New Season
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                There is no scheduled or automatic wipe. The current
                season will only end when an authorized admin manually
                confirms this form.
              </p>

            </div>


            <WipeForm
              currentSeasonName={
                season.name
              }
            />

          </section>

        ) : (

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            Wipe cannot continue because there is no active season.
          </div>

        )}

      </div>

    </main>
  );
}