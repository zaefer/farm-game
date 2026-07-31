"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Header from "@/components/header";
import { useGame } from "@/context/GameContext";
import { CROPS, CropId } from "@/game/crops";

export default function Home() {
  const {
    game,
    plantCrop,
    harvestCrop,
    loading,
    authenticated,
    error,
  } = useGame();

  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  // Sadece ekrandaki countdown'ı her saniye yenilemek için.
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // =====================================================
  // FARM TILE CLICK
  // =====================================================

  async function handleTile(index: number) {
    const tile = game.farm[index];

    if (!tile) {
      return;
    }

    // Boş tarla ise plant modal aç.
    if (!tile.cropId) {
      setSelectedTile(index);
      return;
    }

    // Ürün hazırsa harvest yap.
    if (tile.readyAt && Date.now() >= tile.readyAt) {
      await harvestCrop(index);
    }
  }

  // =====================================================
  // PLANT
  // =====================================================

  async function handlePlant(cropId: CropId) {
    if (selectedTile === null) {
      return;
    }

    const success = await plantCrop(
      selectedTile,
      cropId
    );

    if (success) {
      setSelectedTile(null);
    }
  }

  // =====================================================
  // FARM TILE CONTENT
  // =====================================================

  function renderTile(index: number) {
    const tile = game.farm[index];

    if (!tile) {
      return null;
    }

    // EMPTY TILE

    if (!tile.cropId || !tile.readyAt) {
      return (
        <>
          <span className="text-3xl">
            🟫
          </span>

          <span className="text-xs text-stone-500">
            Empty
          </span>
        </>
      );
    }

    const crop = CROPS[tile.cropId];

    const remaining = Math.max(
      0,
      Math.ceil(
        (tile.readyAt - Date.now()) / 1000
      )
    );

    // READY TO HARVEST

    if (remaining === 0) {
      return (
        <>
          <span className="text-4xl">
            {crop.icon}
          </span>

          <span className="text-xs font-semibold text-green-700">
            Harvest
          </span>
        </>
      );
    }

    // GROWING

    return (
      <>
        <span className="text-3xl">
          {crop.seedIcon}
        </span>

        <span className="text-xs text-stone-500">
          {remaining}s
        </span>
      </>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <>
        <Header />

        <main className="min-h-screen bg-[#F5F0DF] px-4 py-10 md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">
                🌱
              </div>

              <div className="mt-4 text-lg font-semibold text-[#173B2B]">
                Loading your farm...
              </div>

              <p className="mt-2 text-sm text-stone-500">
                Getting your Season 1 farm from the server.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#F5F0DF] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-[28px] bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            🔒
          </div>

          <h1 className="mt-4 text-2xl font-bold text-[#173B2B]">
            Login Required
          </h1>

          <p className="mt-2 text-stone-500">
            Login to access your farm.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-[#173B2B] px-6 py-3 font-semibold text-white transition hover:bg-[#24563F]"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  // =====================================================
  // GAME
  // =====================================================

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F5F0DF] px-4 py-6 text-stone-900 md:px-6">
        <div className="mx-auto max-w-7xl">

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* FARM INTRO */}

          <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <span className="mb-2 inline-block rounded-full bg-[#E1ECDD] px-3 py-1 text-xs font-semibold text-[#36734A]">
                MY FARM
              </span>

              <h1 className="text-3xl font-bold text-[#173B2B] md:text-4xl">
                My Farm 🌾
              </h1>

              <p className="mt-2 text-stone-500">
                Plant crops, wait for them to grow and harvest your products.
              </p>
            </div>

            {/* STATS */}

            <div className="flex flex-wrap gap-3">

              {/* COINS */}

              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="text-xs text-stone-500">
                  Coins
                </div>

                <div className="mt-1 font-bold text-[#173B2B]">
                  🪙 {game.coins}
                </div>
              </div>

              {/* LEVEL */}

              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="text-xs text-stone-500">
                  Farm Level
                </div>

                <div className="mt-1 font-bold text-[#173B2B]">
                  ⭐ Level {game.level}
                </div>
              </div>

              {/* XP */}

              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="text-xs text-stone-500">
                  XP
                </div>

                <div className="mt-1 font-bold text-[#173B2B]">
                  ✨ {game.xp}
                </div>
              </div>

            </div>
          </section>

          {/* FARM AREA */}

          <section className="rounded-[28px] bg-white p-4 shadow-sm md:p-6">

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#173B2B]">
                  Farm Area
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Click an empty plot to start growing.
                </p>
              </div>

              <span className="rounded-full bg-[#E7F1E9] px-4 py-2 text-sm font-semibold text-[#36734A]">
                🌱 25 plots
              </span>
            </div>

            {/* FARM GRID */}

            <div className="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4">

              {game.farm.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTile(index)}
                  className="
                    aspect-square
                    rounded-2xl
                    border
                    border-[#DCCDAA]
                    bg-[#EFE1B9]
                    p-1
                    transition
                    duration-200
                    hover:-translate-y-1
                    hover:bg-[#E6D29C]
                    hover:shadow-md
                  "
                >
                  <div className="flex h-full flex-col items-center justify-center gap-1">
                    {renderTile(index)}
                  </div>
                </button>
              ))}

            </div>

          </section>

          {/* QUICK STORAGE */}

          <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm md:p-6">

            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#173B2B]">
                  Quick Storage 📦
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Your harvested products.
                </p>
              </div>

              <Link
                href="/storage"
                className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-[#173B2B] transition hover:bg-stone-50"
              >
                View Storage
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {/* WHEAT */}

              <div className="rounded-2xl border border-stone-200 bg-[#FFFDF7] p-4">
                <div className="flex items-center justify-between">

                  <span className="text-4xl">
                    🌾
                  </span>

                  <span className="rounded-full bg-[#FFF2C8] px-3 py-1 text-sm font-bold text-[#8A6612]">
                    x{game.inventory.wheat}
                  </span>

                </div>

                <div className="mt-4 font-semibold text-[#173B2B]">
                  Wheat
                </div>

                <div className="mt-1 text-sm text-stone-500">
                  Crop
                </div>
              </div>

              {/* TOMATO */}

              <div className="rounded-2xl border border-stone-200 bg-[#FFFDF7] p-4">
                <div className="flex items-center justify-between">

                  <span className="text-4xl">
                    🍅
                  </span>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                    x{game.inventory.tomato}
                  </span>

                </div>

                <div className="mt-4 font-semibold text-[#173B2B]">
                  Tomato
                </div>

                <div className="mt-1 text-sm text-stone-500">
                  Crop
                </div>
              </div>

            </div>

          </section>

        </div>
      </main>

      {/* =================================================
          PLANT MODAL
      ================================================= */}

      {selectedTile !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl">

            <span className="mb-2 inline-block rounded-full bg-[#E7F1E9] px-3 py-1 text-xs font-semibold text-[#36734A]">
              PLANT CROP
            </span>

            <h2 className="text-2xl font-bold text-[#173B2B]">
              What would you like to plant? 🌱
            </h2>

            <p className="mb-5 mt-2 text-sm text-stone-500">
              Choose a seed and wait for it to grow.
            </p>

            <div className="space-y-3">

              {/* WHEAT */}

              <button
                type="button"
                onClick={() =>
                  handlePlant("wheat")
                }
                className="flex w-full items-center justify-between rounded-2xl border border-green-100 bg-green-50 p-4 text-left transition hover:bg-green-100"
              >
                <div>
                  <div className="font-semibold text-[#173B2B]">
                    🌾 Wheat
                  </div>

                  <div className="text-sm text-stone-500">
                    Ready in{" "}
                    {CROPS.wheat.growthTime} seconds
                  </div>
                </div>

                <strong>
                  🪙 {CROPS.wheat.seedPrice}
                </strong>
              </button>

              {/* TOMATO */}

              <button
                type="button"
                onClick={() =>
                  handlePlant("tomato")
                }
                className="flex w-full items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-left transition hover:bg-red-100"
              >
                <div>
                  <div className="font-semibold text-[#173B2B]">
                    🍅 Tomato
                  </div>

                  <div className="text-sm text-stone-500">
                    Ready in{" "}
                    {CROPS.tomato.growthTime} seconds
                  </div>
                </div>

                <strong>
                  🪙 {CROPS.tomato.seedPrice}
                </strong>
              </button>

            </div>

            {/* CANCEL */}

            <button
              type="button"
              onClick={() =>
                setSelectedTile(null)
              }
              className="mt-4 w-full rounded-2xl border border-stone-200 p-3 font-medium text-stone-600 transition hover:bg-stone-50"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </>
  );
}