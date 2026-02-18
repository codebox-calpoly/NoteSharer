"use client";

import Link from "next/link";
import { ThemeToggle } from "@/app/components/ThemeToggle";

type NavLink = "home" | "browse" | "upload" | "leaderboard" | "profile";

export function DesignNav({
  active,
  rightSlot,
}: {
  active?: NavLink;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="design-nav-header flex h-[72px] items-center justify-between px-4 md:px-8 bg-white border-b border-neutral-200 sticky top-0 z-50 transition-colors [data-theme=dark]:bg-[#262626] [data-theme=dark]:border-neutral-700">
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-[#2e2e2e] text-xl md:text-2xl [data-theme=dark]:text-gray-100">
          Poly Pages
        </h1>
      </div>
      <nav className="hidden md:flex items-center gap-8">
        <Link
          href="/"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "home" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b] [data-theme=dark]:text-gray-300 [data-theme=dark]:hover:text-[#6dbe8b]"
          }`}
        >
          Home
        </Link>
        <Link
          href="/dashboard"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "browse" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b] [data-theme=dark]:text-gray-300 [data-theme=dark]:hover:text-[#6dbe8b]"
          }`}
        >
          Browse
        </Link>
        <Link
          href="/upload"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "upload" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b] [data-theme=dark]:text-gray-300 [data-theme=dark]:hover:text-[#6dbe8b]"
          }`}
        >
          Upload
        </Link>
        <Link
          href="/leaderboard"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "leaderboard" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b] [data-theme=dark]:text-gray-300 [data-theme=dark]:hover:text-[#6dbe8b]"
          }`}
        >
          Leaderboard
        </Link>
        <Link
          href="/dashboard/profile-dashboard"
          className={`font-medium text-base transition-colors duration-200 ${
            active === "profile" ? "text-[#6dbe8b]" : "text-[#666666] hover:text-[#6dbe8b] [data-theme=dark]:text-gray-300 [data-theme=dark]:hover:text-[#6dbe8b]"
          }`}
        >
          Profile
        </Link>
      </nav>
      <div className="hidden md:flex items-center gap-4">
        <ThemeToggle />
        {rightSlot}
      </div>
    </header>
  );
}
