"use client";

import { useEffect, useState } from "react";

type CropType = "wheat" | "tomato" | null;

type FarmTile = {
  crop: CropType;
  plantedAt: number | null;
  readyAt: number | null;
};

const CROPS = {
  wheat: {
    name: "Wheat",
    icon: "🌾",
    seedIcon: "🌱",
    growthTime: 10,
    price: 2,
  },
  tomato: {
    name: "Tomato",
    icon: "🍅",
    seedIcon: "🌱",
    growthTime: 15,
    price: 4,
  },
};

export default function Home() {
  const [coins, setCoins] = useState(100);
  const [wheat, setWheat] = useState(0);
  const [tomato, setTomato] = useState(0);

  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [, setTick] = useState(0);

  const [farm, setFarm] = useState<FarmTile[]>(
    Array.from({ length: 25 }, () => ({
      crop: null,
      plantedAt: null,
      readyAt: null,
    }))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function plantCrop(index: number, crop: "wheat" | "tomato") {
    const cropData = CROPS[crop];

    if (coins < cropData.price) return;

    const now = Date.now();

    setFarm((currentFarm) =>
      currentFarm.map((tile, tileIndex) =>
        tileIndex === index
          ? {
              crop,
              plantedAt: now,
              readyAt: now + cropData.growthTime * 1000,
            }
          : tile
      )
    );

    setCoins((currentCoins) => currentCoins - cropData.price);
    setSelectedTile(null);
  }

  function harvestCrop(index: number) {
    const tile = farm[index];

    if (!tile.crop || !tile.readyAt) return;
    if (Date.now() < tile.readyAt) return;

    if (tile.crop === "wheat") {
      setWheat((amount) => amount + 1);
    }

    if (tile.crop === "tomato") {
      setTomato((amount) => amount + 1);
    }

    setFarm((currentFarm) =>
      currentFarm.map((farmTile, tileIndex) =>
        tileIndex === index
          ? {
              crop: null,
              plantedAt: null,
              readyAt: null,
            }
          : farmTile
      )
    );
  }

  function handleTile(index: number) {
    const tile = farm[index];

    if (!tile.crop) {
      setSelectedTile(index);
      return;
    }

    if (tile.readyAt && Date.now() >= tile.readyAt) {
      harvestCrop(index);
    }
  }

  function renderTile(tile: FarmTile) {
    if (!tile.crop || !tile.readyAt) {
      return (
        <>
          <span className="text-3xl">🟫</span>
          <span className="text-xs text-stone-500">Empty</span>
        </>
      );
    }

    const crop = CROPS[tile.crop];
    const remaining = Math.max(
      0,
      Math.ceil((tile.readyAt - Date.now()) / 1000)
    );

    if (remaining === 0) {
      return (
        <>
          <span className="text-4xl">{crop.icon}</span>
          <span className="text-xs font-semibold text-green-700">
            Harvest
          </span>
        </>
      );
    }

    return (
      <>
        <span className="text-3xl">{crop.seedIcon}</span>
        <span className="text-xs text-stone-500">{remaining}s</span>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0df] p-5 text-stone-900">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-stone-500">Welcome back</p>
            <h1 className="text-2xl font-bold">My Farm 🌾</h1>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl bg-yellow-100 px-4 py-2">
              <span className="text-sm text-stone-500">Coins</span>
              <div className="font-bold">🪙 {coins}</div>
            </div>

            <div className="rounded-2xl bg-green-100 px-4 py-2">
              <span className="text-sm text-stone-500">Level</span>
              <div className="font-bold">⭐ 1</div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Farm</h2>
              <p className="text-sm text-stone-500">
                Click an empty plot to plant.
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
              25 plots
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {farm.map((tile, index) => (
              <button
                key={index}
                onClick={() => handleTile(index)}
                className="aspect-square rounded-2xl border border-stone-200 bg-[#efe5c8] p-1 transition hover:-translate-y-1 hover:bg-[#e8d9af]"
              >
                <div className="flex h-full flex-col items-center justify-center gap-1">
                  {renderTile(tile)}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold">Inventory 🎒</h2>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              🌾 Wheat <strong>x{wheat}</strong>
            </div>

            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              🍅 Tomato <strong>x{tomato}</strong>
            </div>
          </div>
        </section>
      </div>

      {selectedTile !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Plant Crop 🌱</h2>
            <p className="mb-5 mt-1 text-sm text-stone-500">
              What would you like to plant?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => plantCrop(selectedTile, "wheat")}
                className="flex w-full items-center justify-between rounded-2xl bg-green-50 p-4 text-left hover:bg-green-100"
              >
                <div>
                  <div className="font-semibold">🌾 Wheat</div>
                  <div className="text-sm text-stone-500">
                    Ready in 10 seconds
                  </div>
                </div>

                <strong>🪙 2</strong>
              </button>

              <button
                onClick={() => plantCrop(selectedTile, "tomato")}
                className="flex w-full items-center justify-between rounded-2xl bg-red-50 p-4 text-left hover:bg-red-100"
              >
                <div>
                  <div className="font-semibold">🍅 Tomato</div>
                  <div className="text-sm text-stone-500">
                    Ready in 15 seconds
                  </div>
                </div>

                <strong>🪙 4</strong>
              </button>
            </div>

            <button
              onClick={() => setSelectedTile(null)}
              className="mt-4 w-full rounded-2xl border border-stone-200 p-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}