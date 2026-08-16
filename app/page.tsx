"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Header from "@/components/header";
import {
  type BatchCropId,
  type BuildingType,
  useGame,
} from "@/context/GameContext";

const ITEM_ICONS: Record<string, string> = {
  wheat: "🌾",
  corn: "🌽",
  carrot: "🥕",
  potato: "🥔",
  tomato: "🍅",
  strawberry: "🍓",
  sunflower: "🌻",
  pumpkin: "🎃",
  egg: "🥚",
  goat_milk: "🥛",
  milk: "🥛",
  duck_egg: "🥚",
  wool: "🧶",
  honey: "🍯",
  chicken: "🐔",
  goat: "🐐",
  cow: "🐄",
  duck: "🦆",
  sheep: "🐑",
  beehive: "🐝",
};

const STORAGE_ITEM_ORDER = [
  "wheat",
  "corn",
  "carrot",
  "potato",
  "tomato",
  "strawberry",
  "sunflower",
  "pumpkin",
  "egg",
  "goat_milk",
  "milk",
  "duck_egg",
  "wool",
  "honey",
] as const;

const BUILDING_LABELS: Record<
  BuildingType,
  { title: string; icon: string; description: string }
> = {
  farm: {
    title: "Farm",
    icon: "🌾",
    description:
      "Increase the amount of crops you can grow at the same time.",
  },
  storage: {
    title: "Storage",
    icon: "📦",
    description:
      "Increase the total storage space available for harvested goods.",
  },
  ranch: {
    title: "Ranch",
    icon: "🐄",
    description:
      "Increase the number of animals and production units you can own.",
  },
};

const BUILDING_ORDER: BuildingType[] = ["farm", "storage", "ranch"];

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function xpRequiredForNextLevel(level: number) {
  return Math.ceil(100 * Math.pow(1.35, Math.max(level - 1, 0)));
}

function totalXpRequiredForLevel(targetLevel: number) {
  if (targetLevel <= 1) return 0;

  let total = 0;

  for (let level = 1; level < targetLevel; level++) {
    total += xpRequiredForNextLevel(level);
  }

  return total;
}

function buildingCapacityForTier(
  buildingType: BuildingType,
  tier: number
) {
  if (buildingType === "farm") {
    return 25 + (5 * tier * (tier + 3)) / 2;
  }

  if (buildingType === "storage") {
    return 100 + (25 * tier * (tier + 3)) / 2;
  }

  if (tier === 0) return 4;

  return 5 + (tier * (tier + 1)) / 2;
}

function buildingUpgradeSeconds(targetTier: number) {
  if (targetTier === 1) return 300;
  if (targetTier === 2) return 2700;
  if (targetTier === 3) return 10800;
  if (targetTier === 4) return 36000;

  return Math.ceil(36000 * Math.pow(1.5, targetTier - 4));
}

function buildingUpgradeCost(
  buildingType: BuildingType,
  targetTier: number
) {
  if (buildingType === "farm") {
    if (targetTier === 1) return 250;
    if (targetTier === 2) return 1000;
    if (targetTier === 3) return 3500;
    if (targetTier === 4) return 12000;

    return Math.ceil(12000 * Math.pow(1.55, targetTier - 4));
  }

  if (buildingType === "storage") {
    if (targetTier === 1) return 200;
    if (targetTier === 2) return 800;
    if (targetTier === 3) return 3000;
    if (targetTier === 4) return 10000;

    return Math.ceil(10000 * Math.pow(1.5, targetTier - 4));
  }

  if (targetTier === 1) return 600;
  if (targetTier === 2) return 2500;
  if (targetTier === 3) return 8500;
  if (targetTier === 4) return 28000;

  return Math.ceil(28000 * Math.pow(1.6, targetTier - 4));
}

function formatError(error: string) {
  if (error.includes("NOT_ENOUGH_COINS")) {
    return "You do not have enough coins.";
  }

  if (error.includes("NOT_ENOUGH_FARM_CAPACITY")) {
    return "There is not enough free Farm capacity.";
  }

  if (error.includes("NOT_ENOUGH_STORAGE")) {
    return "There is not enough free Storage space.";
  }

  if (error.includes("NOT_ENOUGH_RANCH_CAPACITY")) {
    return "There is not enough Ranch capacity.";
  }

  if (error.includes("NOT_ENOUGH_FEED")) {
    return "You do not have enough feed in Storage.";
  }

  if (error.includes("NOTHING_READY")) {
    return "Nothing is ready yet.";
  }

  if (
    error.includes("BUILDING_LOCKED") ||
    error.includes("RANCH_LOCKED")
  ) {
    return "This building is still locked.";
  }

  if (
    error.includes("CROP_LOCKED") ||
    error.includes("RANCH_UNIT_LOCKED")
  ) {
    return "Your player level is too low.";
  }

  return error;
}

export default function Home() {
  const {
    game,
    loading,
    authenticated,
    error,
    actionLoading,
    activeAction,
    plantCropBatch,
    harvestCropBatches,
    startBuildingUpgrade,
    completeBuildingUpgrade,
    buyRanchUnits,
    startRanchProduction,
    collectRanchProduction,
    sellInventoryItem,
  } = useGame();

  const [activeSection, setActiveSection] = useState<"farm" | "ranch">(
    "farm"
  );
  const [upgradePanelOpen, setUpgradePanelOpen] = useState(false);
  const [showStorageCatalog, setShowStorageCatalog] = useState(false);
  const [tick, setTick] = useState<number | null>(null);
  const [cropQuantities, setCropQuantities] = useState<
    Record<string, number>
  >({});
  const [ranchQuantities, setRanchQuantities] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const updateTime = () => setTick(Date.now());
    const firstTimer = window.setTimeout(updateTime, 0);
    const interval = window.setInterval(updateTime, 1000);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUpgradePanelOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getStorageSize = (itemId: string) =>
    game.market.find((item) => item.itemId === itemId)?.storageSize ?? 1;

  const currentLevelStartXp = totalXpRequiredForLevel(game.level);
  const xpNeededForNextLevel = xpRequiredForNextLevel(game.level);
  const xpInCurrentLevel = Math.max(0, game.xp - currentLevelStartXp);
  const xpRemaining = Math.max(
    0,
    xpNeededForNextLevel - xpInCurrentLevel
  );
  const levelProgressPercent = Math.min(
    100,
    Math.max(
      0,
      (xpInCurrentLevel / Math.max(xpNeededForNextLevel, 1)) * 100
    )
  );

  const pendingFarmXp = game.cropBatches.reduce(
    (total, batch) => total + batch.xpReward,
    0
  );

  const pendingRanchXp = game.ranchProductionBatches.reduce(
    (total, batch) => total + batch.xpReward,
    0
  );

  const pendingXp = pendingFarmXp + pendingRanchXp;
  const visiblePendingXp = Math.min(pendingXp, xpRemaining);
  const pendingXpPercent = Math.min(
    100 - levelProgressPercent,
    (visiblePendingXp / Math.max(xpNeededForNextLevel, 1)) * 100
  );

  const projectedXp = xpInCurrentLevel + pendingXp;
  const levelUpReady =
    pendingXp > 0 && projectedXp >= xpNeededForNextLevel;
  const carryOverXp = levelUpReady
    ? Math.max(0, projectedXp - xpNeededForNextLevel)
    : 0;

  const farmCapacity = game.buildings.farm.capacity;
  const farmUsed = game.cropBatches.reduce(
    (total, batch) => total + batch.quantity,
    0
  );
  const farmFree = Math.max(0, farmCapacity - farmUsed);

  const storageCapacity = game.buildings.storage.capacity;

  const knownStorageItems = new Set<string>(STORAGE_ITEM_ORDER);

  const inventoryEntries: Array<[string, number]> = [
    ...STORAGE_ITEM_ORDER.map(
      (itemId) => [itemId, game.inventory[itemId] ?? 0] as [string, number]
    ),
    ...Object.entries(game.inventory).filter(
      ([itemId]) => !knownStorageItems.has(itemId)
    ),
  ];

  const ownedInventoryEntries = inventoryEntries.filter(
    ([, quantity]) => quantity > 0
  );

  const storageUsed = inventoryEntries.reduce(
    (total, [itemId, quantity]) =>
      total + quantity * getStorageSize(itemId),
    0
  );
  const storageFree = Math.max(0, storageCapacity - storageUsed);

  const ranchCapacity = game.buildings.ranch.capacity;
  const ranchUsed = game.ranchUnits.reduce((total, unit) => {
    const definition = game.ranchDefinitions.find(
      (item) => item.unitId === unit.unitId
    );

    if (!definition) return total;

    return total + unit.quantity * definition.slotCost;
  }, 0);

  const activeUpgradeCount = BUILDING_ORDER.filter(
    (buildingType) =>
      game.buildings[buildingType].upgradeTargetTier !== null
  ).length;

  function getCropQuantity(cropId: string) {
    return Math.max(1, cropQuantities[cropId] ?? 1);
  }

  function setCropQuantity(cropId: string, quantity: number) {
    setCropQuantities((current) => ({
      ...current,
      [cropId]: Math.max(1, Math.floor(quantity)),
    }));
  }

  function getRanchQuantity(unitId: string) {
    return Math.max(1, ranchQuantities[unitId] ?? 1);
  }

  function setRanchQuantity(unitId: string, quantity: number) {
    setRanchQuantities((current) => ({
      ...current,
      [unitId]: Math.max(1, Math.floor(quantity)),
    }));
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#F5F0DF] px-4 py-10 text-stone-900 md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[30px] border border-black/5 bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">🌱</div>
              <div className="mt-5 text-xl font-bold text-[#173B2B]">
                Loading your farm...
              </div>
              <p className="mt-2 text-sm text-stone-500">
                Preparing your current season.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#F5F0DF] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-[30px] bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-5 text-3xl font-bold text-[#173B2B]">
            Login Required
          </h1>
          <p className="mt-3 text-stone-500">
            Login to access your farm.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-block rounded-xl bg-[#36734A] px-6 py-3 font-semibold text-white transition hover:bg-[#2D603D]"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  function renderUpgradeCard(buildingType: BuildingType) {
    const building = game.buildings[buildingType];
    const labels = BUILDING_LABELS[buildingType];
    const targetTier = building.tier + 1;
    const targetCapacity = buildingCapacityForTier(
      buildingType,
      targetTier
    );
    const capacityIncrease = targetCapacity - building.capacity;
    const upgradeCost = buildingUpgradeCost(buildingType, targetTier);
    const upgradeSeconds = buildingUpgradeSeconds(targetTier);
    const upgrading = building.upgradeTargetTier !== null;

    const secondsRemaining =
      upgrading && building.upgradeEndsAt && tick !== null
        ? Math.max(
            0,
            Math.ceil((building.upgradeEndsAt - tick) / 1000)
          )
        : null;

    const readyToComplete = upgrading && secondsRemaining === 0;

    const totalUpgradeDuration = building.upgradeTargetTier
      ? buildingUpgradeSeconds(building.upgradeTargetTier)
      : 0;

    const upgradeProgress =
      upgrading &&
      secondsRemaining !== null &&
      totalUpgradeDuration > 0
        ? Math.min(
            100,
            Math.max(
              0,
              100 -
                (secondsRemaining / totalUpgradeDuration) * 100
            )
          )
        : 0;

    return (
      <article
        key={buildingType}
        className="rounded-[28px] border border-black/5 bg-[#FCFBF7] p-5 md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
              {labels.icon}
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#173B2B]">
                {labels.title}
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-stone-400">
                {labels.description}
              </p>
            </div>
          </div>

          {upgrading ? (
            <span className="rounded-full bg-[#FFF1C7] px-3 py-1 text-xs font-bold text-amber-700">
              Upgrading
            </span>
          ) : (
            <span className="rounded-full bg-[#E7F1E9] px-3 py-1 text-xs font-bold text-[#36734A]">
              Tier {building.tier}
            </span>
          )}
        </div>

        {!building.isUnlocked ? (
          <div className="mt-6 rounded-2xl border border-black/5 bg-stone-100 p-5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔒</div>
              <div>
                <div className="font-bold text-stone-600">
                  Building Locked
                </div>
                <div className="mt-1 text-sm text-stone-400">
                  Reach the required player level to unlock this
                  building.
                </div>
              </div>
            </div>
          </div>
        ) : upgrading ? (
          <>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="rounded-2xl border border-[#36734A]/15 bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#36734A]">
                  ✓ Current
                </div>
                <div className="mt-3 text-2xl font-bold text-[#173B2B]">
                  Tier {building.tier}
                </div>
                <div className="mt-1 text-sm text-stone-500">
                  Capacity{" "}
                  <strong className="text-[#173B2B]">
                    {building.capacity}
                  </strong>
                </div>
              </div>

              <div className="text-2xl font-bold text-[#36734A]">→</div>

              <div className="rounded-2xl border border-amber-200 bg-[#FFF8E4] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Upgrading To
                </div>
                <div className="mt-3 text-2xl font-bold text-[#173B2B]">
                  Tier {building.upgradeTargetTier}
                </div>
                <div className="mt-1 text-sm text-stone-500">
                  Capacity{" "}
                  <strong className="text-[#173B2B]">
                    {building.upgradeTargetCapacity}
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-stone-500">
                  Upgrade Progress
                </span>
                <span className="text-sm font-bold text-amber-700">
                  {secondsRemaining !== null
                    ? formatDuration(secondsRemaining)
                    : "..."}
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-amber-500 transition-[width] duration-500"
                  style={{ width: `${upgradeProgress}%` }}
                />
              </div>
            </div>

            {readyToComplete && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  void completeBuildingUpgrade(buildingType);
                }}
                className="mt-4 w-full rounded-2xl bg-[#36734A] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#2D603D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeAction === `complete_${buildingType}`
                  ? "Completing..."
                  : "✓ Complete Upgrade"}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="rounded-2xl border-2 border-[#36734A]/20 bg-[#E7F1E9] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#36734A]">
                  ✓ Current
                </div>
                <div className="mt-3 text-2xl font-bold text-[#173B2B]">
                  Tier {building.tier}
                </div>
                <div className="mt-1 text-sm text-[#36734A]">
                  Capacity <strong>{building.capacity}</strong>
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-[#36734A] shadow-sm">
                →
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Next
                </div>
                <div className="mt-3 text-2xl font-bold text-[#173B2B]">
                  Tier {targetTier}
                </div>
                <div className="mt-1 text-sm text-stone-500">
                  Capacity{" "}
                  <strong className="text-[#173B2B]">
                    {targetCapacity}
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#E7F1E9] px-4 py-3 text-center">
              <span className="text-sm font-semibold text-[#36734A]">
                +{capacityIncrease} Capacity
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Upgrade Cost
                </div>
                <div className="mt-2 text-lg font-bold text-[#173B2B]">
                  🪙 {upgradeCost.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Build Time
                </div>
                <div className="mt-2 text-lg font-bold text-[#173B2B]">
                  ⏱ {formatDuration(upgradeSeconds)}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={actionLoading || game.coins < upgradeCost}
              onClick={() => {
                void startBuildingUpgrade(buildingType);
              }}
              className="mt-4 w-full rounded-2xl bg-[#173B2B] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#22533D] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {activeAction === `upgrade_${buildingType}`
                ? "Starting Upgrade..."
                : game.coins < upgradeCost
                  ? `Need 🪙 ${upgradeCost.toLocaleString()}`
                  : `Upgrade to Tier ${targetTier}`}
            </button>
          </>
        )}
      </article>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F5F0DF] px-4 py-6 text-stone-900 md:px-6">
        <div className="mx-auto max-w-[1500px]">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
              {formatError(error)}
            </div>
          )}

          <section className="mb-6 rounded-[30px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <span className="inline-flex rounded-full bg-[#E7F1E9] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#36734A]">
                  Season {game.seasonId ?? "—"}
                </span>

                <h1 className="mt-3 text-3xl font-bold text-[#173B2B] md:text-4xl">
                  Farm Dashboard
                </h1>

                <p className="mt-2 text-stone-500">
                  Grow, produce, sell and expand your farm.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[460px]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#F8F6EF] px-4 py-3">
                    <div className="text-xs text-stone-400">Coins</div>
                    <div className="mt-1 text-lg font-bold text-[#173B2B]">
                      🪙 {game.coins.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#E7F1E9] px-4 py-3">
                    <div className="text-xs font-semibold text-[#36734A]/60">
                      Player Level
                    </div>
                    <div className="mt-1 text-lg font-bold text-[#173B2B]">
                      ⭐ Level {game.level}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-[#F8F6EF] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                        Level Progress
                      </div>
                      <div className="mt-1 text-sm font-bold text-[#173B2B]">
                        {xpInCurrentLevel.toLocaleString()} /{" "}
                        {xpNeededForNextLevel.toLocaleString()} XP
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-stone-400">
                        Total XP
                      </div>
                      <div className="mt-1 text-sm font-bold text-[#173B2B]">
                        ✨ {game.xp.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-3 h-4 overflow-hidden rounded-full bg-black/[0.07]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[#36734A] transition-[width] duration-500"
                      style={{ width: `${levelProgressPercent}%` }}
                    />

                    {visiblePendingXp > 0 && (
                      <div
                        className="absolute inset-y-0 animate-pulse border-l border-white/60 bg-[#8FC79B] transition-all duration-500"
                        style={{
                          left: `${levelProgressPercent}%`,
                          width: `${pendingXpPercent}%`,
                        }}
                      />
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#36734A]" />
                      Current XP
                    </div>

                    {pendingXp > 0 && (
                      <div className="flex items-center gap-1.5 font-semibold text-[#4F8A5B]">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#8FC79B]" />
                        +{pendingXp.toLocaleString()} XP pending
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 border-t border-black/5 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-medium text-stone-400">
                      {Math.round(levelProgressPercent)}% collected
                    </span>

                    {!levelUpReady ? (
                      <span className="text-xs font-semibold text-[#36734A]">
                        {xpRemaining.toLocaleString()} XP to Level{" "}
                        {game.level + 1}
                      </span>
                    ) : (
                      <div className="text-left sm:text-right">
                        <div className="animate-pulse text-xs font-extrabold text-[#36734A]">
                          ⭐ LEVEL UP READY
                        </div>

                        {carryOverXp > 0 && (
                          <div className="mt-0.5 text-[10px] font-medium text-stone-400">
                            +{carryOverXp.toLocaleString()} XP continues
                            after the next level.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {pendingXp > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-stone-400">
                          Farm XP
                        </div>
                        <div className="mt-1 text-xs font-bold text-[#173B2B]">
                          🌾 +{pendingFarmXp.toLocaleString()}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-stone-400">
                          Ranch XP
                        </div>
                        <div className="mt-1 text-xs font-bold text-[#173B2B]">
                          🐄 +{pendingRanchXp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_330px]">
            <aside className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveSection("farm")}
                className={`w-full rounded-[26px] border p-5 text-left shadow-sm transition ${
                  activeSection === "farm"
                    ? "border-[#36734A]/30 bg-[#E7F1E9]"
                    : "border-black/5 bg-white hover:bg-[#FAF8F1]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-4xl">🌾</div>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#36734A]">
                    Tier {game.buildings.farm.tier}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-bold text-[#173B2B]">
                  Farm
                </h2>

                <div className="mt-2 text-sm text-stone-500">
                  {farmUsed} / {farmCapacity} capacity
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-[#36734A]"
                    style={{
                      width: `${Math.min(
                        100,
                        (farmUsed / Math.max(farmCapacity, 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </button>

              <button
                type="button"
                disabled={!game.buildings.ranch.isUnlocked}
                onClick={() => {
                  if (game.buildings.ranch.isUnlocked) {
                    setActiveSection("ranch");
                  }
                }}
                className={`w-full rounded-[26px] border p-5 text-left shadow-sm transition ${
                  activeSection === "ranch" &&
                  game.buildings.ranch.isUnlocked
                    ? "border-[#36734A]/30 bg-[#E7F1E9]"
                    : "border-black/5 bg-white"
                } ${
                  !game.buildings.ranch.isUnlocked
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-[#FAF8F1]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-4xl">🐄</div>

                  {!game.buildings.ranch.isUnlocked ? (
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
                      🔒 Lv.5
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#36734A]">
                      Tier {game.buildings.ranch.tier}
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-xl font-bold text-[#173B2B]">
                  Ranch
                </h2>

                <div className="mt-2 text-sm text-stone-500">
                  {game.buildings.ranch.isUnlocked
                    ? `${ranchUsed} / ${ranchCapacity} capacity`
                    : "Unlocks at Player Level 5"}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUpgradePanelOpen(true)}
                className="group w-full rounded-[26px] border border-[#173B2B]/10 bg-[#173B2B] p-5 text-left text-white shadow-sm transition hover:bg-[#22533D]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                    🛠️
                  </div>

                  {activeUpgradeCount > 0 && (
                    <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-[#173B2B]">
                      {activeUpgradeCount} active
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <div className="font-bold">Building Upgrades</div>
                    <div className="mt-1 text-xs text-white/50">
                      View tiers and improvements
                    </div>
                  </div>

                  <span className="text-xl transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </button>
            </aside>

            <section className="min-w-0">
              {activeSection === "farm" && (
                <div className="rounded-[30px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#36734A]">
                        Production
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-[#173B2B]">
                        Farm Management
                      </h2>
                      <p className="mt-1 text-sm text-stone-500">
                        Choose a crop and plant any quantity in one
                        action.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#E7F1E9] px-4 py-3">
                      <div className="text-xs text-[#36734A]/60">
                        Free Capacity
                      </div>
                      <div className="mt-1 text-xl font-bold text-[#173B2B]">
                        {farmFree} / {farmCapacity}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {game.cropDefinitions.map((crop) => {
                      const quantity = getCropQuantity(crop.cropId);
                      const locked = game.level < crop.unlockLevel;
                      const storageSize = getStorageSize(crop.cropId);

                      const batches = game.cropBatches.filter(
                        (batch) => batch.cropId === crop.cropId
                      );

                      const totalGrowing = batches.reduce(
                        (total, batch) => total + batch.quantity,
                        0
                      );

                      const cropPendingXp = batches.reduce(
                        (total, batch) => total + batch.xpReward,
                        0
                      );

                      const readyQuantity =
                        tick === null
                          ? 0
                          : batches
                              .filter((batch) => batch.readyAt <= tick)
                              .reduce(
                                (total, batch) =>
                                  total + batch.quantity,
                                0
                              );

                      const growingQuantity = Math.max(
                        0,
                        totalGrowing - readyQuantity
                      );

                      const nextBatch = batches
                        .filter(
                          (batch) =>
                            tick === null || batch.readyAt > tick
                        )
                        .sort(
                          (first, second) =>
                            first.readyAt - second.readyAt
                        )[0];

                      const nextReadySeconds =
                        nextBatch && tick !== null
                          ? Math.max(
                              0,
                              Math.ceil(
                                (nextBatch.readyAt - tick) / 1000
                              )
                            )
                          : null;

                      const totalCost = quantity * crop.seedCost;

                      const canPlant =
                        !locked &&
                        quantity <= farmFree &&
                        game.coins >= totalCost;

                      const harvestStorageNeeded =
                        readyQuantity * storageSize;

                      const storageCanFit =
                        harvestStorageNeeded <= storageFree;

                      return (
                        <article
                          key={crop.cropId}
                          className={`rounded-[24px] border p-5 ${
                            locked
                              ? "border-black/5 bg-stone-50 opacity-60"
                              : "border-black/5 bg-[#FCFBF7]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                                {ITEM_ICONS[crop.cropId] ?? "🌱"}
                              </div>

                              <div>
                                <h3 className="font-bold text-[#173B2B]">
                                  {crop.displayName}
                                </h3>
                                <div className="mt-1 text-xs text-stone-400">
                                  Unlock Lv.{crop.unlockLevel}
                                </div>
                              </div>
                            </div>

                            {locked && (
                              <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-500">
                                🔒 Locked
                              </span>
                            )}
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                            <div className="rounded-xl bg-white p-3">
                              <div className="text-stone-400">Seed</div>
                              <div className="mt-1 font-bold text-[#173B2B]">
                                🪙 {crop.seedCost}
                              </div>
                            </div>

                            <div className="rounded-xl bg-white p-3">
                              <div className="text-stone-400">
                                Growth
                              </div>
                              <div className="mt-1 font-bold text-[#173B2B]">
                                {formatDuration(crop.growthSeconds)}
                              </div>
                            </div>

                            <div className="rounded-xl bg-white p-3">
                              <div className="text-stone-400">Sell</div>
                              <div className="mt-1 font-bold text-[#173B2B]">
                                🪙 {crop.sellPrice}
                              </div>
                            </div>

                            <div className="rounded-xl bg-[#E7F1E9] p-3">
                              <div className="text-[#36734A]/60">XP</div>
                              <div className="mt-1 font-bold text-[#36734A]">
                                ✨ {crop.xpPerUnit}
                              </div>
                            </div>

                            <div className="rounded-xl bg-[#EEF1F5] p-3">
                              <div className="text-slate-500">
                                Storage
                              </div>
                              <div className="mt-1 font-bold text-slate-700">
                                📦 {storageSize}
                              </div>
                            </div>
                          </div>

                          {!locked && (
                            <>
                              <div className="mt-5 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCropQuantity(
                                      crop.cropId,
                                      quantity - 1
                                    )
                                  }
                                  className="h-10 w-10 rounded-xl border border-black/10 bg-white font-bold"
                                >
                                  −
                                </button>

                                <input
                                  type="number"
                                  min={1}
                                  value={quantity}
                                  onChange={(event) =>
                                    setCropQuantity(
                                      crop.cropId,
                                      Number(event.target.value)
                                    )
                                  }
                                  className="h-10 min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 text-center font-bold outline-none"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    setCropQuantity(
                                      crop.cropId,
                                      quantity + 1
                                    )
                                  }
                                  className="h-10 w-10 rounded-xl border border-black/10 bg-white font-bold"
                                >
                                  +
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setCropQuantity(
                                      crop.cropId,
                                      Math.max(1, farmFree)
                                    )
                                  }
                                  className="h-10 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold"
                                >
                                  Max
                                </button>
                              </div>

                              <button
                                type="button"
                                disabled={!canPlant || actionLoading}
                                onClick={() => {
                                  void plantCropBatch(
                                    crop.cropId as BatchCropId,
                                    quantity
                                  );
                                }}
                                className="mt-3 w-full rounded-xl bg-[#173B2B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#22533D] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {activeAction ===
                                `plant_${crop.cropId}`
                                  ? "Planting..."
                                  : `Plant ${quantity} • 🪙 ${totalCost} • ✨ +${
                                      quantity * crop.xpPerUnit
                                    }`}
                              </button>
                            </>
                          )}

                          {totalGrowing > 0 && (
                            <div className="mt-5 border-t border-black/5 pt-4">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-xl bg-[#FFF6D9] p-3">
                                  <div className="text-xs text-amber-700/70">
                                    Growing
                                  </div>
                                  <div className="mt-1 font-bold text-amber-800">
                                    {growingQuantity}
                                  </div>
                                </div>

                                <div className="rounded-xl bg-[#E7F1E9] p-3">
                                  <div className="text-xs text-[#36734A]/70">
                                    Ready
                                  </div>
                                  <div className="mt-1 font-bold text-[#36734A]">
                                    {readyQuantity}
                                  </div>
                                </div>

                                <div className="rounded-xl bg-[#EEF5EF] p-3">
                                  <div className="text-xs text-[#36734A]/70">
                                    Pending XP
                                  </div>
                                  <div className="mt-1 font-bold text-[#36734A]">
                                    +{cropPendingXp}
                                  </div>
                                </div>
                              </div>

                              {nextReadySeconds !== null &&
                                growingQuantity > 0 && (
                                  <div className="mt-3 text-xs text-stone-500">
                                    Next batch ready in{" "}
                                    <strong className="text-[#173B2B]">
                                      {formatDuration(
                                        nextReadySeconds
                                      )}
                                    </strong>
                                  </div>
                                )}

                              {readyQuantity > 0 && (
                                <>
                                  <div className="mt-3 rounded-xl bg-[#EEF1F5] px-3 py-2 text-xs text-slate-600">
                                    📦 Harvest needs{" "}
                                    <strong>
                                      {harvestStorageNeeded}
                                    </strong>{" "}
                                    storage space ({readyQuantity} ×{" "}
                                    {storageSize})
                                  </div>

                                  <button
                                    type="button"
                                    disabled={
                                      actionLoading || !storageCanFit
                                    }
                                    onClick={() => {
                                      void harvestCropBatches(
                                        crop.cropId
                                      );
                                    }}
                                    className="mt-3 w-full rounded-xl bg-[#4F8A5B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#41744B] disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {activeAction ===
                                    `harvest_${crop.cropId}`
                                      ? "Harvesting..."
                                      : storageCanFit
                                        ? `Harvest ${readyQuantity}`
                                        : `Need ${
                                            harvestStorageNeeded -
                                            storageFree
                                          } More Storage`}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSection === "ranch" &&
                game.buildings.ranch.isUnlocked && (
                  <div className="rounded-[30px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#36734A]">
                          Production
                        </div>
                        <h2 className="mt-2 text-2xl font-bold text-[#173B2B]">
                          Ranch Management
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                          Buy animals, feed them and collect their
                          products.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#E7F1E9] px-4 py-3">
                        <div className="text-xs text-[#36734A]/60">
                          Ranch Capacity
                        </div>
                        <div className="mt-1 text-xl font-bold text-[#173B2B]">
                          {ranchUsed} / {ranchCapacity}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {game.ranchDefinitions.map((unit) => {
                        const locked = game.level < unit.unlockLevel;
                        const outputStorageSize = getStorageSize(
                          unit.outputItemId
                        );

                        const owned =
                          game.ranchUnits.find(
                            (item) => item.unitId === unit.unitId
                          )?.quantity ?? 0;

                        const batches =
                          game.ranchProductionBatches.filter(
                            (batch) => batch.unitId === unit.unitId
                          );

                        const ranchPendingXpForUnit = batches.reduce(
                          (total, batch) =>
                            total + batch.xpReward,
                          0
                        );

                        const busy = batches.reduce(
                          (total, batch) =>
                            total + batch.quantity,
                          0
                        );

                        const idle = Math.max(0, owned - busy);

                        const readyOutput =
                          tick === null
                            ? 0
                            : batches
                                .filter(
                                  (batch) => batch.readyAt <= tick
                                )
                                .reduce(
                                  (total, batch) =>
                                    total + batch.outputQuantity,
                                  0
                                );

                        const readyOutputSpace =
                          readyOutput * outputStorageSize;

                        const quantity = getRanchQuantity(
                          unit.unitId
                        );

                        const feed =
                          game.ranchFeedRequirements.filter(
                            (item) => item.unitId === unit.unitId
                          );

                        const hasFeed = feed.every(
                          (item) =>
                            (game.inventory[item.itemId] ?? 0) >=
                            item.quantityPerUnit * quantity
                        );

                        const freeRanchSlots = Math.max(
                          0,
                          ranchCapacity - ranchUsed
                        );

                        const canBuy =
                          !locked &&
                          freeRanchSlots >= unit.slotCost &&
                          game.coins >= unit.purchaseCost;

                        const canProduce =
                          !locked &&
                          owned > 0 &&
                          quantity <= idle &&
                          hasFeed;

                        const storageCanFit =
                          readyOutputSpace <= storageFree;

                        return (
                          <article
                            key={unit.unitId}
                            className={`rounded-[24px] border border-black/5 p-5 ${
                              locked
                                ? "bg-stone-50 opacity-60"
                                : "bg-[#FCFBF7]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                                  {ITEM_ICONS[unit.unitId] ?? "🐾"}
                                </div>

                                <div>
                                  <h3 className="font-bold text-[#173B2B]">
                                    {unit.displayName}
                                  </h3>
                                  <div className="mt-1 text-xs text-stone-400">
                                    Unlock Lv.{unit.unlockLevel}
                                  </div>
                                </div>
                              </div>

                              {locked ? (
                                <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-500">
                                  🔒
                                </span>
                              ) : (
                                <span className="rounded-full bg-[#E7F1E9] px-3 py-1 text-xs font-semibold text-[#36734A]">
                                  Owned {owned}
                                </span>
                              )}
                            </div>

                            {!locked && (
                              <>
                                <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                                  <div className="rounded-xl bg-white p-3">
                                    <div className="text-stone-400">
                                      Buy
                                    </div>
                                    <div className="mt-1 font-bold text-[#173B2B]">
                                      🪙 {unit.purchaseCost}
                                    </div>
                                  </div>

                                  <div className="rounded-xl bg-white p-3">
                                    <div className="text-stone-400">
                                      Slots
                                    </div>
                                    <div className="mt-1 font-bold text-[#173B2B]">
                                      {unit.slotCost}
                                    </div>
                                  </div>

                                  <div className="rounded-xl bg-white p-3">
                                    <div className="text-stone-400">
                                      Time
                                    </div>
                                    <div className="mt-1 font-bold text-[#173B2B]">
                                      {formatDuration(
                                        unit.productionSeconds
                                      )}
                                    </div>
                                  </div>

                                  <div className="rounded-xl bg-[#E7F1E9] p-3">
                                    <div className="text-[#36734A]/60">
                                      XP
                                    </div>
                                    <div className="mt-1 font-bold text-[#36734A]">
                                      ✨ {unit.xpPerUnit}
                                    </div>
                                  </div>

                                  <div className="rounded-xl bg-[#EEF1F5] p-3">
                                    <div className="text-slate-500">
                                      Output Space
                                    </div>
                                    <div className="mt-1 font-bold text-slate-700">
                                      📦 {outputStorageSize}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={!canBuy || actionLoading}
                                  onClick={() => {
                                    void buyRanchUnits(unit.unitId, 1);
                                  }}
                                  className="mt-3 w-full rounded-xl border border-[#173B2B]/10 bg-white px-4 py-3 text-sm font-bold text-[#173B2B] transition hover:bg-[#E7F1E9] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {activeAction === `buy_${unit.unitId}`
                                    ? "Buying..."
                                    : `Buy 1 ${unit.displayName}`}
                                </button>

                                {owned > 0 && (
                                  <div className="mt-5 border-t border-black/5 pt-4">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-stone-500">
                                        Idle
                                      </span>
                                      <strong className="text-[#173B2B]">
                                        {idle} / {owned}
                                      </strong>
                                    </div>

                                    {ranchPendingXpForUnit > 0 && (
                                      <div className="mt-3 rounded-xl bg-[#E7F1E9] px-3 py-2 text-xs font-bold text-[#36734A]">
                                        ✨ +{ranchPendingXpForUnit} XP
                                        pending
                                      </div>
                                    )}

                                    <div className="mt-3 rounded-xl bg-white p-3 text-xs">
                                      <div className="font-semibold text-stone-500">
                                        Feed per unit
                                      </div>

                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {feed.map((item) => (
                                          <span
                                            key={item.itemId}
                                            className="rounded-lg bg-[#F5F0DF] px-2 py-1 font-semibold text-[#173B2B]"
                                          >
                                            {ITEM_ICONS[item.itemId] ??
                                              "📦"}{" "}
                                            {item.quantityPerUnit}{" "}
                                            {item.itemId.replaceAll(
                                              "_",
                                              " "
                                            )}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setRanchQuantity(
                                            unit.unitId,
                                            quantity - 1
                                          )
                                        }
                                        className="h-10 w-10 rounded-xl border border-black/10 bg-white font-bold"
                                      >
                                        −
                                      </button>

                                      <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(event) =>
                                          setRanchQuantity(
                                            unit.unitId,
                                            Number(
                                              event.target.value
                                            )
                                          )
                                        }
                                        className="h-10 min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 text-center font-bold outline-none"
                                      />

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setRanchQuantity(
                                            unit.unitId,
                                            quantity + 1
                                          )
                                        }
                                        className="h-10 w-10 rounded-xl border border-black/10 bg-white font-bold"
                                      >
                                        +
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setRanchQuantity(
                                            unit.unitId,
                                            Math.max(1, idle)
                                          )
                                        }
                                        className="h-10 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold"
                                      >
                                        Max
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        !canProduce || actionLoading
                                      }
                                      onClick={() => {
                                        void startRanchProduction(
                                          unit.unitId,
                                          quantity
                                        );
                                      }}
                                      className="mt-3 w-full rounded-xl bg-[#173B2B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#22533D] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {activeAction ===
                                      `produce_${unit.unitId}`
                                        ? "Starting..."
                                        : !hasFeed
                                          ? "Not Enough Feed"
                                          : idle === 0
                                            ? "All Units Busy"
                                            : `Start Production ×${quantity} • ✨ +${
                                                quantity *
                                                unit.xpPerUnit
                                              }`}
                                    </button>

                                    {readyOutput > 0 && (
                                      <>
                                        <div className="mt-3 rounded-xl bg-[#EEF1F5] px-3 py-2 text-xs text-slate-600">
                                          📦 Collection needs{" "}
                                          <strong>
                                            {readyOutputSpace}
                                          </strong>{" "}
                                          storage space ({readyOutput} ×{" "}
                                          {outputStorageSize})
                                        </div>

                                        <button
                                          type="button"
                                          disabled={
                                            actionLoading ||
                                            !storageCanFit
                                          }
                                          onClick={() => {
                                            void collectRanchProduction(
                                              unit.unitId
                                            );
                                          }}
                                          className="mt-3 w-full rounded-xl bg-[#4F8A5B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#41744B] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          {activeAction ===
                                          `collect_${unit.unitId}`
                                            ? "Collecting..."
                                            : storageCanFit
                                              ? `Collect ${readyOutput} ${unit.outputItemId.replaceAll(
                                                  "_",
                                                  " "
                                                )}`
                                              : `Need ${
                                                  readyOutputSpace -
                                                  storageFree
                                                } More Storage`}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
            </section>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
                      Storage
                    </div>
                    <h2 className="mt-1 text-xl font-bold text-[#173B2B]">
                      📦 Inventory
                    </h2>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-[#173B2B]">
                      {storageUsed} / {storageCapacity}
                    </div>
                    <div className="text-xs text-stone-400">
                      {storageFree} space free
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-[#36734A]"
                    style={{
                      width: `${Math.min(
                        100,
                        (storageUsed /
                          Math.max(storageCapacity, 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-2 text-[11px] text-stone-400">
                  Capacity is calculated by item size, not item count.
                </div>

                <div className="mt-5 space-y-2">
                  {ownedInventoryEntries
                    .sort(
                      ([firstItem, firstQuantity], [
                        secondItem,
                        secondQuantity,
                      ]) =>
                        secondQuantity *
                          getStorageSize(secondItem) -
                        firstQuantity * getStorageSize(firstItem)
                    )
                    .map(([itemId, quantity]) => {
                      const marketItem = game.market.find(
                        (item) => item.itemId === itemId
                      );
                      const itemStorageSize = getStorageSize(itemId);
                      const itemStorageUsed =
                        quantity * itemStorageSize;

                      return (
                        <div
                          key={itemId}
                          className="rounded-2xl bg-[#F8F6EF] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="text-xl">
                                {ITEM_ICONS[itemId] ?? "📦"}
                              </span>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold capitalize text-[#173B2B]">
                                  {itemId.replaceAll("_", " ")}
                                </div>

                                {marketItem && (
                                  <div className="mt-0.5 text-xs text-stone-400">
                                    🪙{" "}
                                    {marketItem.currentPrice.toFixed(
                                      2
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-[#173B2B]">
                                {quantity}
                              </div>

                              {marketItem && (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => {
                                    void sellInventoryItem(
                                      itemId,
                                      quantity
                                    );
                                  }}
                                  className="mt-1 text-xs font-bold text-[#36734A] hover:underline disabled:opacity-40"
                                >
                                  {activeAction === `sell_${itemId}`
                                    ? "Selling..."
                                    : "Sell All"}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[11px]">
                            <span className="text-stone-400">
                              📦 {itemStorageSize} space each
                            </span>
                            <span className="font-bold text-[#173B2B]">
                              {itemStorageUsed} space used
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {storageUsed === 0 && (
                    <div className="rounded-2xl bg-[#F8F6EF] p-6 text-center">
                      <div className="text-3xl">📭</div>
                      <p className="mt-2 text-sm text-stone-400">
                        Storage is empty.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setShowStorageCatalog((current) => !current)
                    }
                    className="mt-3 flex w-full items-center justify-between rounded-xl border border-black/5 bg-white px-3 py-2 text-xs font-bold text-[#173B2B] transition hover:bg-[#F8F6EF]"
                  >
                    <span>Storage Catalog • {STORAGE_ITEM_ORDER.length} items</span>
                    <span>{showStorageCatalog ? "▲" : "▼"}</span>
                  </button>

                  {showStorageCatalog && (
                    <div className="mt-3 space-y-1.5 rounded-2xl border border-black/5 bg-white p-2">
                      {STORAGE_ITEM_ORDER.map((itemId) => {
                        const quantity = game.inventory[itemId] ?? 0;
                        const marketItem = game.market.find(
                          (item) => item.itemId === itemId
                        );
                        const itemStorageSize = getStorageSize(itemId);

                        return (
                          <div
                            key={`catalog-${itemId}`}
                            className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-[#F8F6EF]"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span>{ITEM_ICONS[itemId] ?? "📦"}</span>
                              <div className="min-w-0">
                                <div className="truncate text-xs font-semibold capitalize text-[#173B2B]">
                                  {marketItem?.displayName ??
                                    itemId.replaceAll("_", " ")}
                                </div>
                                <div className="text-[10px] text-stone-400">
                                  📦 {itemStorageSize} space each
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div
                                className={`text-xs font-bold ${
                                  quantity > 0
                                    ? "text-[#173B2B]"
                                    : "text-stone-300"
                                }`}
                              >
                                {quantity}
                              </div>
                              <div className="text-[10px] text-stone-400">
                                owned
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-black/5 bg-[#173B2B] p-5 text-white shadow-sm">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">
                  Live Market
                </div>
                <h2 className="mt-1 text-xl font-bold">
                  Market Prices
                </h2>

                <div className="mt-5 space-y-2">
                  {game.market.map((item) => {
                    const positive = item.changePercent > 0;
                    const negative = item.changePercent < 0;

                    return (
                      <div
                        key={item.itemId}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.07] px-3 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="text-lg">
                            {ITEM_ICONS[item.itemId] ?? "📦"}
                          </span>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {item.displayName}
                            </div>
                            <div className="mt-0.5 text-[10px] text-white/35">
                              📦 {item.storageSize} space
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold">
                            🪙 {item.currentPrice.toFixed(2)}
                          </div>

                          <div
                            className={`mt-0.5 text-[11px] font-semibold ${
                              positive
                                ? "text-green-300"
                                : negative
                                  ? "text-red-300"
                                  : "text-white/30"
                            }`}
                          >
                            {positive ? "▲ " : negative ? "▼ " : ""}
                            {Math.abs(item.changePercent).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {game.market[0] && tick !== null && (
                  <div className="mt-4 border-t border-white/10 pt-4 text-xs text-white/40">
                    Next market refresh in{" "}
                    <strong className="text-white/70">
                      {formatDuration(
                        Math.max(
                          0,
                          Math.ceil(
                            (game.market[0].nextRefreshAt - tick) /
                              1000
                          )
                        )
                      )}
                    </strong>
                  </div>
                )}
              </section>
            </aside>
          </div>

          <footer className="mt-6 rounded-[26px] border border-black/5 bg-white px-5 py-5 text-center text-sm text-stone-400 shadow-sm">
            Farm Game • Season {game.seasonId ?? "—"}
          </footer>
        </div>
      </main>

      {upgradePanelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10281D]/70 p-4 backdrop-blur-sm"
          onClick={() => setUpgradePanelOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] bg-[#F5F0DF] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-black/5 bg-[#F5F0DF]/95 px-5 py-5 backdrop-blur md:px-7">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#36734A]">
                    Farm Expansion
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-[#173B2B] md:text-3xl">
                    🛠️ Building Upgrades
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Upgrade your buildings to increase production
                    capacity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setUpgradePanelOpen(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-[#173B2B] shadow-sm transition hover:bg-stone-100"
                >
                  ✕
                </button>
              </div>

              {activeUpgradeCount > 0 && (
                <div className="mt-4 inline-flex rounded-full bg-[#FFF1C7] px-3 py-1 text-xs font-bold text-amber-700">
                  ⚙️ {activeUpgradeCount} building
                  {activeUpgradeCount > 1 ? "s" : ""} currently
                  upgrading
                </div>
              )}
            </div>

            <div className="grid gap-5 p-5 md:p-7 lg:grid-cols-2">
              {BUILDING_ORDER.map((buildingType) =>
                renderUpgradeCard(buildingType)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}