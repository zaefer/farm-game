"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { CropId } from "@/game/crops";

export type BuildingType = "farm" | "storage" | "ranch";

export type BatchCropId =
  | "wheat"
  | "corn"
  | "carrot"
  | "potato"
  | "tomato"
  | "strawberry"
  | "sunflower"
  | "pumpkin";

const DEFAULT_INVENTORY_ITEMS = [
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

export type FarmTile = {
  cropId: CropId | null;
  plantedAt: number | null;
  readyAt: number | null;
};

export type Inventory = Record<string, number>;

export type PlayerBuilding = {
  buildingType: BuildingType;
  tier: number;
  capacity: number;
  isUnlocked: boolean;
  upgradeTargetTier: number | null;
  upgradeTargetCapacity: number | null;
  upgradeStartedAt: number | null;
  upgradeEndsAt: number | null;
};

export type BuildingsState = {
  farm: PlayerBuilding;
  storage: PlayerBuilding;
  ranch: PlayerBuilding;
};

export type CropDefinition = {
  cropId: BatchCropId;
  displayName: string;
  unlockLevel: number;
  seedCost: number;
  growthSeconds: number;
  sellPrice: number;
  xpPerUnit: number;
  isActive: boolean;
};

export type CropBatch = {
  id: number;
  cropId: BatchCropId;
  quantity: number;
  plantedAt: number;
  readyAt: number;
  harvestedAt: number | null;
  seedCostPaid: number;
  xpReward: number;
};

export type RanchDefinition = {
  unitId: string;
  displayName: string;
  unlockLevel: number;
  purchaseCost: number;
  slotCost: number;
  productionSeconds: number;
  outputItemId: string;
  outputQuantityPerUnit: number;
  xpPerUnit: number;
  isActive: boolean;
};

export type RanchFeedRequirement = {
  unitId: string;
  itemId: string;
  quantityPerUnit: number;
};

export type PlayerRanchUnit = {
  unitId: string;
  quantity: number;
};

export type RanchProductionBatch = {
  id: number;
  unitId: string;
  quantity: number;
  outputItemId: string;
  outputQuantity: number;
  xpReward: number;
  startedAt: number;
  readyAt: number;
  collectedAt: number | null;
};

export type MarketItem = {
  itemId: string;
  displayName: string;
  category: "crop" | "ranch";
  basePrice: number;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  periodStartedAt: number;
  nextRefreshAt: number;
  storageSize: number;
};

export type GameState = {
  seasonId: number | null;
  coins: number;
  level: number;
  xp: number;
  farm: FarmTile[];
  inventory: Inventory;
  buildings: BuildingsState;
  cropDefinitions: CropDefinition[];
  cropBatches: CropBatch[];
  ranchDefinitions: RanchDefinition[];
  ranchFeedRequirements: RanchFeedRequirement[];
  ranchUnits: PlayerRanchUnit[];
  ranchProductionBatches: RanchProductionBatch[];
  market: MarketItem[];
};

type GameContextType = {
  game: GameState;
  loading: boolean;
  authenticated: boolean;
  error: string | null;
  actionLoading: boolean;
  activeAction: string | null;

  plantCrop: (tileIndex: number, cropId: CropId) => Promise<boolean>;
  harvestCrop: (tileIndex: number) => Promise<boolean>;

  plantCropBatch: (cropId: BatchCropId, quantity: number) => Promise<boolean>;
  harvestCropBatches: (cropId: BatchCropId) => Promise<boolean>;

  startBuildingUpgrade: (buildingType: BuildingType) => Promise<boolean>;
  completeBuildingUpgrade: (buildingType: BuildingType) => Promise<boolean>;

  buyRanchUnits: (unitId: string, quantity: number) => Promise<boolean>;
  startRanchProduction: (unitId: string, quantity: number) => Promise<boolean>;
  collectRanchProduction: (unitId: string) => Promise<boolean>;

  sellInventoryItem: (itemId: string, quantity: number) => Promise<boolean>;
  refreshMarket: () => Promise<boolean>;

  refreshGame: () => Promise<void>;
};

type SeasonRow = { id: number };
type ProgressRow = { coins: number; level: number; xp: number };

type FarmRow = {
  tile_index: number;
  crop_id: string | null;
  planted_at: string | null;
  ready_at: string | null;
};

type InventoryRow = {
  item_id: string;
  quantity: number;
};

type BuildingRow = {
  building_type: string;
  tier: number;
  capacity: number;
  is_unlocked: boolean;
  upgrade_target_tier: number | null;
  upgrade_target_capacity: number | null;
  upgrade_started_at: string | null;
  upgrade_ends_at: string | null;
};

type CropDefinitionRow = {
  crop_id: string;
  display_name: string;
  unlock_level: number;
  seed_cost: number;
  growth_seconds: number;
  sell_price: number;
  xp_per_unit: number;
  is_active: boolean;
};

type CropBatchRow = {
  id: number;
  crop_id: string;
  quantity: number;
  planted_at: string;
  ready_at: string;
  harvested_at: string | null;
  seed_cost_paid: number;
  xp_reward: number;
};

type RanchDefinitionRow = {
  unit_id: string;
  display_name: string;
  unlock_level: number;
  purchase_cost: number;
  slot_cost: number;
  production_seconds: number;
  output_item_id: string;
  output_quantity_per_unit: number;
  xp_per_unit: number;
  is_active: boolean;
};

type RanchFeedRow = {
  unit_id: string;
  item_id: string;
  quantity_per_unit: number;
};

type PlayerRanchUnitRow = {
  unit_id: string;
  quantity: number;
};

type RanchProductionRow = {
  id: number;
  unit_id: string;
  quantity: number;
  output_item_id: string;
  output_quantity: number;
  xp_reward: number;
  started_at: string;
  ready_at: string;
  collected_at: string | null;
};

type MarketRow = {
  item_id: string;
  display_name: string;
  category: string;
  base_price: number;
  current_price: number;
  previous_price: number;
  change_percent: number;
  period_started_at: string;
  next_refresh_at: string;
};

type MarketStorageRow = {
  item_id: string;
  storage_size: number;
};

function toMillis(value: string | null): number | null {
  return value ? new Date(value).getTime() : null;
}

function createEmptyFarm(): FarmTile[] {
  return Array.from({ length: 25 }, () => ({
    cropId: null,
    plantedAt: null,
    readyAt: null,
  }));
}

function createDefaultInventory(): Inventory {
  return Object.fromEntries(
    DEFAULT_INVENTORY_ITEMS.map((itemId) => [itemId, 0])
  ) as Inventory;
}

function createBuilding(
  buildingType: BuildingType,
  capacity: number,
  isUnlocked: boolean
): PlayerBuilding {
  return {
    buildingType,
    tier: 0,
    capacity,
    isUnlocked,
    upgradeTargetTier: null,
    upgradeTargetCapacity: null,
    upgradeStartedAt: null,
    upgradeEndsAt: null,
  };
}

function createDefaultBuildings(): BuildingsState {
  return {
    farm: createBuilding("farm", 25, true),
    storage: createBuilding("storage", 100, true),
    ranch: createBuilding("ranch", 4, false),
  };
}

function createDefaultGameState(): GameState {
  return {
    seasonId: null,
    coins: 100,
    level: 1,
    xp: 0,
    farm: createEmptyFarm(),
    inventory: createDefaultInventory(),
    buildings: createDefaultBuildings(),
    cropDefinitions: [],
    cropBatches: [],
    ranchDefinitions: [],
    ranchFeedRequirements: [],
    ranchUnits: [],
    ranchProductionBatches: [],
    market: [],
  };
}

function isLegacyCropId(value: string | null): value is CropId {
  return value === "wheat" || value === "tomato";
}

function isBatchCropId(value: string): value is BatchCropId {
  return (
    value === "wheat" ||
    value === "corn" ||
    value === "carrot" ||
    value === "potato" ||
    value === "tomato" ||
    value === "strawberry" ||
    value === "sunflower" ||
    value === "pumpkin"
  );
}

function isBuildingType(value: string): value is BuildingType {
  return value === "farm" || value === "storage" || value === "ranch";
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [game, setGame] = useState<GameState>(() => createDefaultGameState());
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const loadGame = useCallback(
    async (silent = false) => {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (!silent) setLoading(true);
        setError(null);

        if (userError || !userData.user) {
          setAuthenticated(false);
          setGame(createDefaultGameState());
          return;
        }

        const user = userData.user;
        setAuthenticated(true);

        const { data: seasonData, error: seasonError } = await supabase
          .from("seasons")
          .select("id")
          .eq("status", "active")
          .order("starts_at", { ascending: false })
          .limit(1)
          .single();

        if (seasonError || !seasonData) {
          setError(
            seasonError?.message ?? "Active season could not be found."
          );
          return;
        }

        const season = seasonData as SeasonRow;

        const [
          progressResult,
          farmResult,
          inventoryResult,
          buildingsResult,
          cropDefinitionsResult,
          cropBatchesResult,
          ranchDefinitionsResult,
          ranchFeedResult,
          ranchUnitsResult,
          ranchProductionResult,
          marketResult,
          marketStorageResult,
        ] = await Promise.all([
          supabase
            .from("player_progress")
            .select("coins, level, xp")
            .eq("user_id", user.id)
            .eq("season_id", season.id)
            .single(),

          supabase
            .from("farm_tiles")
            .select("tile_index, crop_id, planted_at, ready_at")
            .eq("user_id", user.id)
            .eq("season_id", season.id)
            .order("tile_index", { ascending: true }),

          supabase
            .from("inventory")
            .select("item_id, quantity")
            .eq("user_id", user.id)
            .eq("season_id", season.id),

          supabase
            .from("player_buildings")
            .select(
              `
                building_type,
                tier,
                capacity,
                is_unlocked,
                upgrade_target_tier,
                upgrade_target_capacity,
                upgrade_started_at,
                upgrade_ends_at
              `
            )
            .eq("user_id", user.id)
            .eq("season_id", season.id),

          supabase
            .from("crop_definitions")
            .select(
              `
                crop_id,
                display_name,
                unlock_level,
                seed_cost,
                growth_seconds,
                sell_price,
                xp_per_unit,
                is_active
              `
            )
            .eq("is_active", true)
            .order("unlock_level", { ascending: true }),

          supabase
            .from("crop_batches")
            .select(
              `
                id,
                crop_id,
                quantity,
                planted_at,
                ready_at,
                harvested_at,
                seed_cost_paid,
                xp_reward
              `
            )
            .eq("user_id", user.id)
            .eq("season_id", season.id)
            .is("harvested_at", null)
            .order("ready_at", { ascending: true }),

          supabase
            .from("ranch_definitions")
            .select(
              `
                unit_id,
                display_name,
                unlock_level,
                purchase_cost,
                slot_cost,
                production_seconds,
                output_item_id,
                output_quantity_per_unit,
                xp_per_unit,
                is_active
              `
            )
            .eq("is_active", true)
            .order("unlock_level", { ascending: true }),

          supabase
            .from("ranch_feed_requirements")
            .select("unit_id, item_id, quantity_per_unit")
            .order("unit_id", { ascending: true }),

          supabase
            .from("player_ranch_units")
            .select("unit_id, quantity")
            .eq("user_id", user.id)
            .eq("season_id", season.id),

          supabase
            .from("ranch_production_batches")
            .select(
              `
                id,
                unit_id,
                quantity,
                output_item_id,
                output_quantity,
                xp_reward,
                started_at,
                ready_at,
                collected_at
              `
            )
            .eq("user_id", user.id)
            .eq("season_id", season.id)
            .is("collected_at", null)
            .order("ready_at", { ascending: true }),

          supabase.rpc("get_live_market"),

          supabase
            .from("market_items")
            .select("item_id, storage_size")
            .eq("is_active", true),
        ]);

        const databaseError =
          progressResult.error ??
          farmResult.error ??
          inventoryResult.error ??
          buildingsResult.error ??
          cropDefinitionsResult.error ??
          cropBatchesResult.error ??
          ranchDefinitionsResult.error ??
          ranchFeedResult.error ??
          ranchUnitsResult.error ??
          ranchProductionResult.error ??
          marketResult.error ??
          marketStorageResult.error;

        if (databaseError) {
          console.error(databaseError);
          setError(databaseError.message);
          return;
        }

        const progress = progressResult.data as ProgressRow;

        const loadedFarm = createEmptyFarm();
        for (const tile of (farmResult.data ?? []) as FarmRow[]) {
          if (tile.tile_index < 0 || tile.tile_index >= loadedFarm.length) {
            continue;
          }

          loadedFarm[tile.tile_index] = {
            cropId: isLegacyCropId(tile.crop_id) ? tile.crop_id : null,
            plantedAt: toMillis(tile.planted_at),
            readyAt: toMillis(tile.ready_at),
          };
        }

        const loadedInventory = createDefaultInventory();

        for (const item of (inventoryResult.data ?? []) as InventoryRow[]) {
          loadedInventory[item.item_id] = Number(item.quantity);
        }

        const loadedBuildings = createDefaultBuildings();

        for (const row of (buildingsResult.data ?? []) as BuildingRow[]) {
          if (!isBuildingType(row.building_type)) continue;

          loadedBuildings[row.building_type] = {
            buildingType: row.building_type,
            tier: Number(row.tier),
            capacity: Number(row.capacity),
            isUnlocked: row.is_unlocked,
            upgradeTargetTier: row.upgrade_target_tier,
            upgradeTargetCapacity: row.upgrade_target_capacity,
            upgradeStartedAt: toMillis(row.upgrade_started_at),
            upgradeEndsAt: toMillis(row.upgrade_ends_at),
          };
        }

        const loadedCropDefinitions: CropDefinition[] = (
          (cropDefinitionsResult.data ?? []) as CropDefinitionRow[]
        )
          .filter((row) => isBatchCropId(row.crop_id))
          .map((row) => ({
            cropId: row.crop_id as BatchCropId,
            displayName: row.display_name,
            unlockLevel: Number(row.unlock_level),
            seedCost: Number(row.seed_cost),
            growthSeconds: Number(row.growth_seconds),
            sellPrice: Number(row.sell_price),
            xpPerUnit: Number(row.xp_per_unit),
            isActive: row.is_active,
          }));

        const loadedCropBatches: CropBatch[] = (
          (cropBatchesResult.data ?? []) as CropBatchRow[]
        )
          .filter((row) => isBatchCropId(row.crop_id))
          .map((row) => ({
            id: Number(row.id),
            cropId: row.crop_id as BatchCropId,
            quantity: Number(row.quantity),
            plantedAt: new Date(row.planted_at).getTime(),
            readyAt: new Date(row.ready_at).getTime(),
            harvestedAt: toMillis(row.harvested_at),
            seedCostPaid: Number(row.seed_cost_paid),
            xpReward: Number(row.xp_reward),
          }));

        const loadedRanchDefinitions: RanchDefinition[] = (
          (ranchDefinitionsResult.data ?? []) as RanchDefinitionRow[]
        ).map((row) => ({
          unitId: row.unit_id,
          displayName: row.display_name,
          unlockLevel: Number(row.unlock_level),
          purchaseCost: Number(row.purchase_cost),
          slotCost: Number(row.slot_cost),
          productionSeconds: Number(row.production_seconds),
          outputItemId: row.output_item_id,
          outputQuantityPerUnit: Number(row.output_quantity_per_unit),
          xpPerUnit: Number(row.xp_per_unit),
          isActive: row.is_active,
        }));

        const loadedRanchFeed: RanchFeedRequirement[] = (
          (ranchFeedResult.data ?? []) as RanchFeedRow[]
        ).map((row) => ({
          unitId: row.unit_id,
          itemId: row.item_id,
          quantityPerUnit: Number(row.quantity_per_unit),
        }));

        const loadedRanchUnits: PlayerRanchUnit[] = (
          (ranchUnitsResult.data ?? []) as PlayerRanchUnitRow[]
        ).map((row) => ({
          unitId: row.unit_id,
          quantity: Number(row.quantity),
        }));

        const loadedRanchProduction: RanchProductionBatch[] = (
          (ranchProductionResult.data ?? []) as RanchProductionRow[]
        ).map((row) => ({
          id: Number(row.id),
          unitId: row.unit_id,
          quantity: Number(row.quantity),
          outputItemId: row.output_item_id,
          outputQuantity: Number(row.output_quantity),
          xpReward: Number(row.xp_reward),
          startedAt: new Date(row.started_at).getTime(),
          readyAt: new Date(row.ready_at).getTime(),
          collectedAt: toMillis(row.collected_at),
        }));

        const storageSizeByItem = new Map<string, number>();

        for (const row of (marketStorageResult.data ?? []) as MarketStorageRow[]) {
          storageSizeByItem.set(
            row.item_id,
            Math.max(1, Number(row.storage_size))
          );
        }

        const loadedMarket: MarketItem[] = (
          (marketResult.data ?? []) as MarketRow[]
        )
          .filter((row) => row.category === "crop" || row.category === "ranch")
          .map((row) => ({
            itemId: row.item_id,
            displayName: row.display_name,
            category: row.category as "crop" | "ranch",
            basePrice: Number(row.base_price),
            currentPrice: Number(row.current_price),
            previousPrice: Number(row.previous_price),
            changePercent: Number(row.change_percent),
            periodStartedAt: new Date(row.period_started_at).getTime(),
            nextRefreshAt: new Date(row.next_refresh_at).getTime(),
            storageSize: storageSizeByItem.get(row.item_id) ?? 1,
          }));

        setGame({
          seasonId: season.id,
          coins: Number(progress.coins),
          level: Number(progress.level),
          xp: Number(progress.xp),
          farm: loadedFarm,
          inventory: loadedInventory,
          buildings: loadedBuildings,
          cropDefinitions: loadedCropDefinitions,
          cropBatches: loadedCropBatches,
          ranchDefinitions: loadedRanchDefinitions,
          ranchFeedRequirements: loadedRanchFeed,
          ranchUnits: loadedRanchUnits,
          ranchProductionBatches: loadedRanchProduction,
          market: loadedMarket,
        });
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading your farm.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [supabase]
  );

  const refreshGame = useCallback(async () => {
    await loadGame(true);
  }, [loadGame]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGame(false);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname, loadGame]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAuthenticated(false);
        setGame(createDefaultGameState());
        setError(null);
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        window.setTimeout(() => {
          void loadGame(false);
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadGame]);

  const runAction = useCallback(
    async (
      actionName: string,
      rpcName: string,
      args?: Record<string, unknown>
    ): Promise<boolean> => {
      setError(null);
      setActionLoading(true);
      setActiveAction(actionName);

      try {
        const { error: rpcError } = args
          ? await supabase.rpc(rpcName, args)
          : await supabase.rpc(rpcName);

        if (rpcError) {
          console.error(rpcError);
          setError(rpcError.message);
          return false;
        }

        await loadGame(true);
        return true;
      } finally {
        setActionLoading(false);
        setActiveAction(null);
      }
    },
    [supabase, loadGame]
  );

  const plantCrop = useCallback(
    async (tileIndex: number, cropId: CropId) =>
      runAction("legacy_plant", "plant_crop", {
        p_tile_index: tileIndex,
        p_crop_id: cropId,
      }),
    [runAction]
  );

  const harvestCrop = useCallback(
    async (tileIndex: number) =>
      runAction("legacy_harvest", "harvest_crop", {
        p_tile_index: tileIndex,
      }),
    [runAction]
  );

  const plantCropBatch = useCallback(
    async (cropId: BatchCropId, quantity: number) =>
      runAction(`plant_${cropId}`, "plant_crop_batch", {
        p_crop_id: cropId,
        p_quantity: quantity,
      }),
    [runAction]
  );

  const harvestCropBatches = useCallback(
    async (cropId: BatchCropId) =>
      runAction(`harvest_${cropId}`, "harvest_crop_batches", {
        p_crop_id: cropId,
      }),
    [runAction]
  );

  const startBuildingUpgrade = useCallback(
    async (buildingType: BuildingType) =>
      runAction(`upgrade_${buildingType}`, "start_building_upgrade", {
        p_building_type: buildingType,
      }),
    [runAction]
  );

  const completeBuildingUpgrade = useCallback(
    async (buildingType: BuildingType) =>
      runAction(`complete_${buildingType}`, "complete_building_upgrade", {
        p_building_type: buildingType,
      }),
    [runAction]
  );

  const buyRanchUnits = useCallback(
    async (unitId: string, quantity: number) =>
      runAction(`buy_${unitId}`, "buy_ranch_units", {
        p_unit_id: unitId,
        p_quantity: quantity,
      }),
    [runAction]
  );

  const startRanchProduction = useCallback(
    async (unitId: string, quantity: number) =>
      runAction(`produce_${unitId}`, "start_ranch_production", {
        p_unit_id: unitId,
        p_quantity: quantity,
      }),
    [runAction]
  );

  const collectRanchProduction = useCallback(
    async (unitId: string) =>
      runAction(`collect_${unitId}`, "collect_ranch_production", {
        p_unit_id: unitId,
      }),
    [runAction]
  );

  const sellInventoryItem = useCallback(
    async (itemId: string, quantity: number) =>
      runAction(`sell_${itemId}`, "sell_inventory_item", {
        p_item_id: itemId,
        p_quantity: quantity,
      }),
    [runAction]
  );

  const refreshMarket = useCallback(
    async () => runAction("refresh_market", "get_live_market"),
    [runAction]
  );

  return (
    <GameContext.Provider
      value={{
        game,
        loading,
        authenticated,
        error,
        actionLoading,
        activeAction,
        plantCrop,
        harvestCrop,
        plantCropBatch,
        harvestCropBatches,
        startBuildingUpgrade,
        completeBuildingUpgrade,
        buyRanchUnits,
        startRanchProduction,
        collectRanchProduction,
        sellInventoryItem,
        refreshMarket,
        refreshGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used inside GameProvider");
  }

  return context;
}