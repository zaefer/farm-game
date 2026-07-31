import Header from "@/components/header";

export default function MarketPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F5F0DF] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">

          {/* PAGE HEADER */}

          <section className="mb-6">
            <span className="mb-2 inline-block rounded-full bg-[#FFF2C8] px-3 py-1 text-xs font-semibold text-[#8A6612]">
              ONLINE MARKET
            </span>

            <h1 className="text-3xl font-bold text-[#173B2B] md:text-4xl">
              Market 🛒
            </h1>

            <p className="mt-2 max-w-2xl text-stone-500">
              Buy products from other farmers or list your own crops for sale.
            </p>
          </section>

          {/* MARKET STATS */}

          <section className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs text-stone-500">
                Active Listings
              </div>

              <div className="mt-2 text-xl font-bold text-[#173B2B]">
                0
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs text-stone-500">
                My Listings
              </div>

              <div className="mt-2 text-xl font-bold text-[#173B2B]">
                0
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs text-stone-500">
                Coins
              </div>

              <div className="mt-2 text-xl font-bold text-[#173B2B]">
                🪙 100
              </div>
            </div>
          </section>

          {/* MARKET */}

          <section className="rounded-[28px] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#173B2B]">
                  Player Market
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Products listed by other players will appear here.
                </p>
              </div>

              <button className="rounded-2xl bg-[#173B2B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#23573F]">
                + Sell Product
              </button>
            </div>

            {/* EMPTY STATE */}

            <div className="rounded-3xl border-2 border-dashed border-stone-200 bg-[#FFFDF7] px-6 py-14 text-center">
              <div className="text-5xl">
                🧺
              </div>

              <h3 className="mt-4 text-lg font-semibold text-[#173B2B]">
                The market is empty
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
                Player listings will appear here once the online market system
                is connected.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}