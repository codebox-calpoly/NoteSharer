"use client";

import Link from "next/link";

const LOGO_SRC = "https://c.animaapp.com/vYVdVbUl/img/container-8.svg";

type NavLink = "home" | "browse" | "upload" | "leaderboard" | "profile";

export function DesignNav({
  active,
  rightSlot,
}: {
  active?: NavLink;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="flex h-[72px] items-center justify-between px-4 md:px-8 bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <img
          className="w-[54px] h-[54px]"
          alt="Poly Pages Logo"
          src={LOGO_SRC}
        />
        <h1 className="font-bold text-[#2e2e2e] text-xl md:text-2xl">
          Poly Pages
        </h1>
      </div>
      <nav className="hidden md:flex items-center gap-8">
        <Link
          href="/"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "home" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b]"
          }`}
        >
          Home
        </Link>
        <Link
          href="/dashboard"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "browse" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b]"
          }`}
        >
          Browse
        </Link>
        <Link
          href="/upload"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "upload" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b]"
          }`}
        >
          Upload
        </Link>
        <Link
          href="/leaderboard"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "leaderboard" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b]"
          }`}
        >
          Leaderboard
        </Link>
        <Link
          href="/dashboard/profile-dashboard"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "profile" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b]"
          }`}
        >
          Profile
        </Link>
      </nav>
      {rightSlot ? <div className="hidden md:flex items-center gap-4">{rightSlot}</div> : null}
    </header>
  );
}
