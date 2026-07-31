"use client";

import Header from "@/components/header";
import { useGame } from "@/context/GameContext";

export default function StoragePage() {
  const { game } = useGame();

  const totalItems =
    game.inventory.wheat +
    game.inventory.tomato;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F5F0DF] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">

          {/* PAGE HEADER */}

          <section className="mb-6">
            <span className="mb-2 inline-block rounded-full bg-[#E7F1E9] px-3 py-1 text-xs font-semibold text-[#36734A]">
              STORAGE
            </span>

            <h1 className="text-3xl font-bold text-[#173B2B] md:text-4xl">
              My Storage 📦
            </h1>

            <p className="mt-2 text-stone-500">
              All harvested crops and farm products are stored here.
            </p>
          </section>

          {/* STORAGE SUMMARY */}

          <section className="mb-6 grid gap-3 sm:grid-cols-3">

            {/* TOTAL ITEMS */}

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs text-stone-500">
                Total Items
              </div>

              <div className="mt-2 text-xl font-bold text-[#173B2B]">
                {totalItems}
              </div>
            </div>

            {/* CAPACITY */}

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs text-stone-500">
                Storage Capacity
              </div>

              <div className="mt-2 text-xl font-bold text-[#173B2B]">
                {totalItems} / 100
              </div>
            </div>

            {/* LEVEL */}

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs text-stone-500">
                Storage Level
              </div>

              <div className="mt-2 text-xl font-bold text-[#173B2B]">
                Level 1
              </div>
            </div>
          </section>

          {/* INVENTORY */}

          <section className="rounded-[28px] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#173B2B]">
                Farm Products
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Your harvested products appear here.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {/* WHEAT */}

              <div className="rounded-2xl border border-stone-200 bg-[#FFFDF7] p-4 transition hover:-translate-y-1 hover:shadow-sm">
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

              <div className="rounded-2xl border border-stone-200 bg-[#FFFDF7] p-4 transition hover:-translate-y-1 hover:shadow-sm">
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
    </>
  );
}