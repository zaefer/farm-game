"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/logout/actions";
import { useGame } from "@/context/GameContext";

const menuItems = [
  {
    name: "My Farm",
    href: "/",
    icon: "🌾",
  },
  {
    name: "Storage",
    href: "/storage",
    icon: "📦",
  },
  {
    name: "Market",
    href: "/market",
    icon: "🛒",
  },
];

export default function Header() {
  const pathname = usePathname();

  const { game } = useGame();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#173B2B]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">

        {/* LOGO */}

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6C453] text-2xl">
            🌱
          </div>

          <div className="hidden sm:block">
            <div className="text-lg font-bold text-white">
              Farm Game
            </div>

            <div className="text-xs text-[#BFD3C6]">
              Grow your little world
            </div>
          </div>
        </Link>

        {/* NAVIGATION */}

        <nav className="flex items-center rounded-2xl bg-white/10 p-1">
          {menuItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition md:px-5 ${
                  active
                    ? "bg-[#FFF8E8] text-[#173B2B]"
                    : "text-[#D7E4DA] hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>
                  {item.icon}
                </span>

                <span className="hidden sm:inline">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* PLAYER INFO */}

        <div className="flex items-center gap-2">
          <div className="hidden rounded-xl bg-white/10 px-3 py-2 md:block">
            <div className="text-[10px] uppercase tracking-wider text-[#BFD3C6]">
              Level
            </div>

            <div className="text-sm font-bold text-white">
              ⭐ {game.level}
            </div>
          </div>

          <div className="rounded-xl bg-[#F6C453] px-3 py-2 text-[#173B2B]">
            <div className="text-[10px] uppercase tracking-wider opacity-70">
              Coins
            </div>

            <div className="text-sm font-bold">
              🪙 {game.coins}
            </div>
          </div>
          <form action={logout}>
          <button
            type="submit"
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Logout
          </button>
        </form>
        </div>
      </div>
    </header>
  );
}