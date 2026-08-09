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


// ======================================================
// TYPES
// ======================================================

export type FarmTile = {
  cropId: CropId | null;
  plantedAt: number | null;
  readyAt: number | null;
};

type Inventory = {
  wheat: number;
  tomato: number;
};

type GameState = {
  coins: number;
  level: number;
  xp: number;
  farm: FarmTile[];
  inventory: Inventory;
};

type GameContextType = {
  game: GameState;
  loading: boolean;
  authenticated: boolean;
  error: string | null;

  plantCrop: (
    tileIndex: number,
    cropId: CropId
  ) => Promise<boolean>;

  harvestCrop: (
    tileIndex: number
  ) => Promise<boolean>;

  refreshGame: () => Promise<void>;
};


// ======================================================
// DATABASE TYPES
// ======================================================

type SeasonRow = {
  id: number;
};

type ProgressRow = {
  coins: number;
  level: number;
  xp: number;
};

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


// ======================================================
// DEFAULT GAME
// ======================================================

function createEmptyFarm(): FarmTile[] {
  return Array.from(
    { length: 25 },
    () => ({
      cropId: null,
      plantedAt: null,
      readyAt: null,
    })
  );
}

const DEFAULT_GAME_STATE: GameState = {
  coins: 100,
  level: 1,
  xp: 0,

  farm: createEmptyFarm(),

  inventory: {
    wheat: 0,
    tomato: 0,
  },
};


// ======================================================
// CONTEXT
// ======================================================

const GameContext =
  createContext<GameContextType | undefined>(
    undefined
  );


// ======================================================
// CROP CHECK
// ======================================================

function isCropId(
  value: string | null
): value is CropId {
  return (
    value === "wheat" ||
    value === "tomato"
  );
}


// ======================================================
// PROVIDER
// ======================================================

export function GameProvider({
  children,
}: {
  children: ReactNode;
}) {
  // BURASI SENİN SORDUĞUN KISIM
  const pathname = usePathname();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [game, setGame] =
    useState<GameState>(
      DEFAULT_GAME_STATE
    );

  const [loading, setLoading] =
    useState(true);

  const [
    authenticated,
    setAuthenticated,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);


  // ====================================================
  // LOAD GAME FROM SUPABASE
  // ====================================================

    const refreshGame =
      useCallback(async () => {
        try {
          // ----------------------------------------------
          // USER
          // ----------------------------------------------

          const {
            data: userData,
            error: userError,
          } =
            await supabase.auth.getUser();

          setLoading(true);
          setError(null);

        if (
          userError ||
          !userData.user
        ) {
          setAuthenticated(false);

          setGame({
            ...DEFAULT_GAME_STATE,
            farm: createEmptyFarm(),
          });

          return;
        }

        const user =
          userData.user;

        setAuthenticated(true);


        // ----------------------------------------------
        // ACTIVE SEASON
        // ----------------------------------------------

        const {
          data: seasonData,
          error: seasonError,
        } =
          await supabase
            .from("seasons")
            .select("id")
            .eq("status", "active")
            .order(
              "starts_at",
              {
                ascending: false,
              }
            )
            .limit(1)
            .single();

        if (
          seasonError ||
          !seasonData
        ) {
          setError(
            "Active season could not be found."
          );

          return;
        }

        const season =
          seasonData as SeasonRow;


        // ----------------------------------------------
        // PLAYER PROGRESS
        // ----------------------------------------------

        const {
          data: progressData,
          error: progressError,
        } =
          await supabase
            .from(
              "player_progress"
            )
            .select(
              "coins, level, xp"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "season_id",
              season.id
            )
            .single();

        if (
          progressError ||
          !progressData
        ) {
          setError(
            progressError?.message ??
              "Player progress could not be loaded."
          );

          return;
        }

        const progress =
          progressData as ProgressRow;


        // ----------------------------------------------
        // FARM
        // ----------------------------------------------

        const {
          data: farmData,
          error: farmError,
        } =
          await supabase
            .from("farm_tiles")
            .select(
              "tile_index, crop_id, planted_at, ready_at"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "season_id",
              season.id
            )
            .order(
              "tile_index",
              {
                ascending: true,
              }
            );

        if (farmError) {
          setError(
            farmError.message
          );

          return;
        }

        const farmRows =
          (farmData ??
            []) as FarmRow[];


        // ----------------------------------------------
        // INVENTORY
        // ----------------------------------------------

        const {
          data: inventoryData,
          error:
            inventoryError,
        } =
          await supabase
            .from("inventory")
            .select(
              "item_id, quantity"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "season_id",
              season.id
            );

        if (inventoryError) {
          setError(
            inventoryError.message
          );

          return;
        }

        const inventoryRows =
          (inventoryData ??
            []) as InventoryRow[];


        // ----------------------------------------------
        // BUILD FARM
        // ----------------------------------------------

        const loadedFarm =
          createEmptyFarm();

        for (
          const tile of farmRows
        ) {
          if (
            tile.tile_index < 0 ||
            tile.tile_index >=
              loadedFarm.length
          ) {
            continue;
          }

          loadedFarm[
            tile.tile_index
          ] = {
            cropId: isCropId(
              tile.crop_id
            )
              ? tile.crop_id
              : null,

            plantedAt:
              tile.planted_at
                ? new Date(
                    tile.planted_at
                  ).getTime()
                : null,

            readyAt:
              tile.ready_at
                ? new Date(
                    tile.ready_at
                  ).getTime()
                : null,
          };
        }


        // ----------------------------------------------
        // BUILD INVENTORY
        // ----------------------------------------------

        const loadedInventory: Inventory =
          {
            wheat: 0,
            tomato: 0,
          };

        for (
          const item of inventoryRows
        ) {
          if (
            item.item_id ===
            "wheat"
          ) {
            loadedInventory.wheat =
              item.quantity;
          }

          if (
            item.item_id ===
            "tomato"
          ) {
            loadedInventory.tomato =
              item.quantity;
          }
        }


        // ----------------------------------------------
        // UPDATE GAME
        // ----------------------------------------------

        setGame({
          coins: progress.coins,
          level: progress.level,
          xp: progress.xp,
          farm: loadedFarm,
          inventory:
            loadedInventory,
        });

      } catch (err) {
        console.error(err);

        setError(
          "Something went wrong while loading your farm."
        );
      } finally {
        setLoading(false);
      }
    }, [supabase]);


  // ====================================================
  // SAYFA DEĞİŞİNCE FARM'I YENİDEN ÇEK
  // ====================================================

    useEffect(() => {
      const timer = window.setTimeout(() => {
        void refreshGame();
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }, [pathname, refreshGame]);


  // ====================================================
  // LOGIN / LOGOUT DEĞİŞİKLİĞİNİ DİNLE
  // ====================================================

  useEffect(() => {
    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event) => {
          if (
            event ===
            "SIGNED_OUT"
          ) {
            setAuthenticated(
              false
            );

            setGame({
              ...DEFAULT_GAME_STATE,
              farm: createEmptyFarm(),
            });

            setLoading(false);

            return;
          }

          if (
            event ===
              "SIGNED_IN" ||
            event ===
              "USER_UPDATED"
          ) {
            setTimeout(() => {
              void refreshGame();
            }, 0);
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [
    supabase,
    refreshGame,
  ]);


  // ====================================================
  // PLANT
  // ====================================================

  const plantCrop =
    useCallback(
      async (
        tileIndex: number,
        cropId: CropId
      ): Promise<boolean> => {
        setError(null);

        const {
          error: plantError,
        } =
          await supabase.rpc(
            "plant_crop",
            {
              p_tile_index:
                tileIndex,

              p_crop_id:
                cropId,
            }
          );

        if (plantError) {
          console.error(
            plantError
          );

          setError(
            plantError.message
          );

          return false;
        }

        await refreshGame();

        return true;
      },
      [
        supabase,
        refreshGame,
      ]
    );


  // ====================================================
  // HARVEST
  // ====================================================

  const harvestCrop =
    useCallback(
      async (
        tileIndex: number
      ): Promise<boolean> => {
        setError(null);

        const {
          error:
            harvestError,
        } =
          await supabase.rpc(
            "harvest_crop",
            {
              p_tile_index:
                tileIndex,
            }
          );

        if (
          harvestError
        ) {
          console.error(
            harvestError
          );

          setError(
            harvestError.message
          );

          return false;
        }

        await refreshGame();

        return true;
      },
      [
        supabase,
        refreshGame,
      ]
    );


  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <GameContext.Provider
      value={{
        game,
        loading,
        authenticated,
        error,
        plantCrop,
        harvestCrop,
        refreshGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}


// ======================================================
// USE GAME
// ======================================================

export function useGame() {
  const context =
    useContext(GameContext);

  if (!context) {
    throw new Error(
      "useGame must be used inside GameProvider"
    );
  }

  return context;
}