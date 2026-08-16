"use client";

import Link from "next/link";

import Header from "@/components/header";
import { useGame } from "@/context/GameContext";


// ======================================================
// STORAGE ITEMS
// ======================================================

const STORAGE_ITEMS = [
  {
    itemId: "wheat",
    name: "Wheat",
    icon: "🌾",
    category: "crop",
  },
  {
    itemId: "corn",
    name: "Corn",
    icon: "🌽",
    category: "crop",
  },
  {
    itemId: "carrot",
    name: "Carrot",
    icon: "🥕",
    category: "crop",
  },
  {
    itemId: "potato",
    name: "Potato",
    icon: "🥔",
    category: "crop",
  },
  {
    itemId: "tomato",
    name: "Tomato",
    icon: "🍅",
    category: "crop",
  },
  {
    itemId: "strawberry",
    name: "Strawberry",
    icon: "🍓",
    category: "crop",
  },
  {
    itemId: "sunflower",
    name: "Sunflower",
    icon: "🌻",
    category: "crop",
  },
  {
    itemId: "pumpkin",
    name: "Pumpkin",
    icon: "🎃",
    category: "crop",
  },

  {
    itemId: "egg",
    name: "Egg",
    icon: "🥚",
    category: "ranch",
  },
  {
    itemId: "goat_milk",
    name: "Goat Milk",
    icon: "🥛",
    category: "ranch",
  },
  {
    itemId: "milk",
    name: "Milk",
    icon: "🥛",
    category: "ranch",
  },
  {
    itemId: "duck_egg",
    name: "Duck Egg",
    icon: "🥚",
    category: "ranch",
  },
  {
    itemId: "wool",
    name: "Wool",
    icon: "🧶",
    category: "ranch",
  },
  {
    itemId: "honey",
    name: "Honey",
    icon: "🍯",
    category: "ranch",
  },
] as const;


// ======================================================
// PAGE
// ======================================================

export default function StoragePage() {
  const {
    game,
    loading,
    authenticated,
    actionLoading,
    activeAction,
    sellInventoryItem,
  } = useGame();


  // ====================================================
  // STORAGE SIZE
  // ====================================================

  function getStorageSize(
    itemId: string
  ) {
    return (
      game.market.find(
        (item) =>
          item.itemId ===
          itemId
      )?.storageSize ??
      1
    );
  }


  // ====================================================
  // STORAGE TOTALS
  // ====================================================

  const storageCapacity =
    game.buildings.storage.capacity;


  const storageUsed =
    Object.entries(
      game.inventory
    ).reduce(
      (
        total,
        [
          itemId,
          quantity,
        ]
      ) => {
        return (
          total +
          quantity *
            getStorageSize(
              itemId
            )
        );
      },
      0
    );


  const storageFree =
    Math.max(
      0,
      storageCapacity -
        storageUsed
    );


  const storagePercent =
    Math.min(
      100,
      (
        storageUsed /
        Math.max(
          storageCapacity,
          1
        )
      ) *
        100
    );


  // ====================================================
  // INVENTORY VALUE
  // ====================================================

  const estimatedInventoryValue =
    STORAGE_ITEMS.reduce(
      (
        total,
        item
      ) => {
        const quantity =
          game.inventory[
            item.itemId
          ] ??
          0;


        const marketItem =
          game.market.find(
            (market) =>
              market.itemId ===
              item.itemId
          );


        if (!marketItem) {
          return total;
        }


        return (
          total +
          quantity *
            marketItem.currentPrice
        );
      },
      0
    );


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <>
        <Header />

        <main className="min-h-screen bg-[#F5F0DF] px-4 py-10 md:px-6">

          <div className="mx-auto max-w-7xl">

            <div className="rounded-[30px] bg-white p-10 text-center shadow-sm">

              <div className="text-5xl">
                📦
              </div>


              <div className="mt-4 text-xl font-bold text-[#173B2B]">
                Loading Storage...
              </div>

            </div>

          </div>

        </main>
      </>
    );
  }


  // ====================================================
  // NOT LOGGED IN
  // ====================================================

  if (!authenticated) {
    return (
      <>
        <Header />

        <main className="min-h-screen bg-[#F5F0DF] px-4 py-10 md:px-6">

          <div className="mx-auto max-w-xl rounded-[30px] bg-white p-10 text-center shadow-sm">

            <div className="text-5xl">
              🔒
            </div>


            <h1 className="mt-4 text-2xl font-bold text-[#173B2B]">
              Login Required
            </h1>


            <Link
              href="/login"
              className="mt-6 inline-block rounded-xl bg-[#173B2B] px-6 py-3 font-bold text-white"
            >
              Login
            </Link>

          </div>

        </main>
      </>
    );
  }


  // ====================================================
  // ITEM CARD
  // ====================================================

  function renderItem(
    item: typeof STORAGE_ITEMS[number]
  ) {
    const quantity =
      game.inventory[
        item.itemId
      ] ??
      0;


    const storageSize =
      getStorageSize(
        item.itemId
      );


    const usedSpace =
      quantity *
      storageSize;


    const marketItem =
      game.market.find(
        (market) =>
          market.itemId ===
          item.itemId
      );


    const marketPrice =
      marketItem?.currentPrice ??
      0;


    const totalValue =
      quantity *
      marketPrice;


    return (
      <article
        key={item.itemId}
        className={`
          rounded-[24px]
          border
          border-black/5
          p-5
          transition
          ${
            quantity > 0
              ? "bg-white shadow-sm"
              : "bg-white/60"
          }
        `}
      >

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-center gap-3">

            <div
              className={`
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                text-3xl
                ${
                  quantity > 0
                    ? "bg-[#F8F6EF]"
                    : "bg-stone-100 grayscale"
                }
              `}
            >
              {item.icon}
            </div>


            <div>

              <h3 className="font-bold text-[#173B2B]">
                {item.name}
              </h3>


              <div className="mt-1 text-xs capitalize text-stone-400">
                {item.category}
              </div>

            </div>

          </div>


          <div
            className={`
              rounded-full
              px-3
              py-1
              text-sm
              font-bold
              ${
                quantity > 0
                  ? "bg-[#E7F1E9] text-[#36734A]"
                  : "bg-stone-100 text-stone-400"
              }
            `}
          >
            ×{quantity}
          </div>

        </div>


        {/* STORAGE INFO */}

        <div className="mt-5 grid grid-cols-2 gap-2">

          <div className="rounded-xl bg-[#F8F6EF] p-3">

            <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Space Each
            </div>


            <div className="mt-1 font-bold text-[#173B2B]">
              📦 {storageSize}
            </div>

          </div>


          <div className="rounded-xl bg-[#F8F6EF] p-3">

            <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Space Used
            </div>


            <div className="mt-1 font-bold text-[#173B2B]">
              {usedSpace}
            </div>

          </div>

        </div>


        {/* MARKET VALUE */}

        <div className="mt-3 rounded-xl border border-black/5 bg-[#FCFBF7] p-3">

          <div className="flex items-center justify-between gap-3">

            <div>

              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Market Price
              </div>


              <div className="mt-1 text-sm font-bold text-[#173B2B]">

                {marketItem
                  ? `🪙 ${marketPrice.toFixed(
                      2
                    )}`
                  : "—"}

              </div>

            </div>


            <div className="text-right">

              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Total Value
              </div>


              <div className="mt-1 text-sm font-bold text-[#173B2B]">

                {marketItem
                  ? `🪙 ${totalValue.toFixed(
                      2
                    )}`
                  : "—"}

              </div>

            </div>

          </div>

        </div>


        {/* SELL */}

        {quantity > 0 ? (

          <button
            type="button"
            disabled={
              actionLoading ||
              !marketItem
            }
            onClick={() => {
              void sellInventoryItem(
                item.itemId,
                quantity
              );
            }}
            className="mt-4 w-full rounded-xl bg-[#173B2B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#22533D] disabled:cursor-not-allowed disabled:opacity-40"
          >

            {activeAction ===
            `sell_${item.itemId}`
              ? "Selling..."
              : `Sell All ×${quantity}`}

          </button>

        ) : (

          <div className="mt-4 rounded-xl bg-stone-100 px-4 py-3 text-center text-xs font-semibold text-stone-400">
            No items in storage
          </div>

        )}

      </article>
    );
  }


  // ====================================================
  // PAGE
  // ====================================================

  return (
    <>
      <Header />


      <main className="min-h-screen bg-[#F5F0DF] px-4 py-6 text-stone-900 md:px-6">

        <div className="mx-auto max-w-[1400px]">


          {/* =================================================
              TOP
          ================================================= */}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <div>

              <Link
                href="/"
                className="text-sm font-semibold text-[#36734A] hover:underline"
              >
                ← Back to Farm
              </Link>


              <h1 className="mt-2 text-3xl font-bold text-[#173B2B] md:text-4xl">
                📦 Storage
              </h1>


              <p className="mt-2 text-stone-500">
                Manage all harvested and produced goods.
              </p>

            </div>


            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">

              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Season
              </div>


              <div className="mt-1 font-bold text-[#173B2B]">
                #{game.seasonId ?? "—"}
              </div>

            </div>

          </div>


          {/* =================================================
              STORAGE SUMMARY
          ================================================= */}

          <section className="mb-6 rounded-[30px] bg-[#173B2B] p-5 text-white shadow-sm md:p-6">

            <div className="grid gap-5 md:grid-cols-3">


              {/* USED */}

              <div>

                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
                  Storage Used
                </div>


                <div className="mt-2 text-3xl font-bold">
                  {storageUsed}
                  {" / "}
                  {storageCapacity}
                </div>


                <div className="mt-1 text-sm text-white/50">
                  {storageFree} space available
                </div>

              </div>


              {/* ITEMS */}

              <div>

                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
                  Item Types
                </div>


                <div className="mt-2 text-3xl font-bold">
                  {
                    STORAGE_ITEMS.filter(
                      (item) =>
                        (
                          game
                            .inventory[
                            item.itemId
                          ] ??
                          0
                        ) > 0
                    ).length
                  }
                  {" / "}
                  {STORAGE_ITEMS.length}
                </div>


                <div className="mt-1 text-sm text-white/50">
                  Different goods owned
                </div>

              </div>


              {/* VALUE */}

              <div>

                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
                  Estimated Value
                </div>


                <div className="mt-2 text-3xl font-bold">
                  🪙{" "}
                  {estimatedInventoryValue.toFixed(
                    0
                  )}
                </div>


                <div className="mt-1 text-sm text-white/50">
                  Based on current market prices
                </div>

              </div>

            </div>


            {/* CAPACITY BAR */}

            <div className="mt-6">

              <div className="mb-2 flex items-center justify-between text-xs">

                <span className="text-white/50">
                  Capacity
                </span>


                <span className="font-bold">
                  {Math.round(
                    storagePercent
                  )}
                  %
                </span>

              </div>


              <div className="h-4 overflow-hidden rounded-full bg-white/10">

                <div
                  className="h-full rounded-full bg-[#8FC79B] transition-[width] duration-500"
                  style={{
                    width:
                      `${storagePercent}%`,
                  }}
                />

              </div>

            </div>

          </section>


          {/* =================================================
              CROPS
          ================================================= */}

          <section>

            <div className="mb-4">

              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#36734A]">
                Farm Goods
              </div>


              <h2 className="mt-1 text-2xl font-bold text-[#173B2B]">
                🌾 Crops
              </h2>

            </div>


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {STORAGE_ITEMS
                .filter(
                  (item) =>
                    item.category ===
                    "crop"
                )
                .map(
                  renderItem
                )}

            </div>

          </section>


          {/* =================================================
              RANCH PRODUCTS
          ================================================= */}

          <section className="mt-8">

            <div className="mb-4">

              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#36734A]">
                Ranch Goods
              </div>


              <h2 className="mt-1 text-2xl font-bold text-[#173B2B]">
                🐄 Ranch Products
              </h2>

            </div>


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {STORAGE_ITEMS
                .filter(
                  (item) =>
                    item.category ===
                    "ranch"
                )
                .map(
                  renderItem
                )}

            </div>

          </section>


          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mt-8 rounded-[24px] bg-white px-5 py-5 text-center text-sm text-stone-400 shadow-sm">

            Storage capacity is calculated using each item&apos;s storage size.

          </footer>

        </div>

      </main>
    </>
  );
}