"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useFormStatus,
} from "react-dom";

import {
  startNewSeason,
} from "./actions";


function SubmitButton({
  enabled,
}: {
  enabled: boolean;
}) {
  const {
    pending,
  } =
    useFormStatus();


  return (
    <button
      type="submit"
      disabled={
        !enabled ||
        pending
      }
      className="w-full rounded-xl bg-red-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending
        ? "Starting New Season..."
        : "Start New Season Now"}
    </button>
  );
}


export default function WipeForm({
  currentSeasonName,
}: {
  currentSeasonName: string;
}) {
  const [
    newSeasonName,
    setNewSeasonName,
  ] =
    useState("Season 2");


  const [
    confirmation,
    setConfirmation,
  ] =
    useState("");


  const expectedConfirmation =
    useMemo(
      () =>
        `START ${newSeasonName
          .trim()
          .toUpperCase()}`,

      [
        newSeasonName,
      ]
    );


  const isConfirmed =
    newSeasonName
      .trim()
      .length >= 3 &&
    confirmation
      .trim()
      .toUpperCase() ===
      expectedConfirmation;


  return (
    <form
      action={startNewSeason}
      className="grid gap-5"
    >

      {/* CURRENT SEASON */}

      <div className="rounded-2xl border border-white/10 bg-black/10 p-5">

        <div className="text-xs uppercase tracking-wider text-white/40">
          Current Season
        </div>

        <div className="mt-2 text-xl font-bold">
          {currentSeasonName}
        </div>

        <p className="mt-2 text-sm text-white/40">
          This season will end immediately when you confirm the wipe.
        </p>

      </div>


      {/* NEW SEASON NAME */}

      <div>

        <label
          htmlFor="newSeasonName"
          className="mb-2 block text-sm font-medium"
        >
          New Season Name
        </label>

        <input
          id="newSeasonName"
          name="newSeasonName"
          type="text"
          required
          minLength={3}
          maxLength={60}
          value={newSeasonName}
          onChange={
            (
              event
            ) => {
              setNewSeasonName(
                event.target.value
              );
            }
          }
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-green-500/50"
        />

      </div>


      {/* EFFECTS */}

      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">

        <h3 className="font-semibold text-yellow-200">
          This operation will:
        </h3>

        <div className="mt-4 grid gap-2 text-sm text-white/60">

          <div>
            ✓ End {currentSeasonName} immediately
          </div>

          <div>
            ✓ Start {newSeasonName || "the new season"} immediately
          </div>

          <div>
            ✓ Reset coins to 100
          </div>

          <div>
            ✓ Reset level to 1
          </div>

          <div>
            ✓ Reset XP to 0
          </div>

          <div>
            ✓ Reset inventory
          </div>

          <div>
            ✓ Reset farm usage
          </div>

          <div>
            ✓ Preserve player accounts
          </div>

          <div>
            ✓ Preserve bans and admin history
          </div>

          <div>
            ✓ Preserve all previous season data
          </div>

        </div>

      </div>


      {/* CONFIRMATION */}

      <div>

        <label
          htmlFor="confirmation"
          className="mb-2 block text-sm font-medium"
        >
          Type the confirmation text
        </label>

        <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-sm font-bold text-red-300">
          {expectedConfirmation}
        </div>

        <input
          id="confirmation"
          name="confirmation"
          type="text"
          required
          autoComplete="off"
          value={confirmation}
          onChange={
            (
              event
            ) => {
              setConfirmation(
                event.target.value
              );
            }
          }
          placeholder={
            expectedConfirmation
          }
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-white outline-none transition focus:border-red-500/50"
        />

      </div>


      <SubmitButton
        enabled={
          isConfirmed
        }
      />

    </form>
  );
}