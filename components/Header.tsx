"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo.svg";
import cname from "@/assets/cname.svg";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header({
  onNavigate,
}: {
  onNavigate?: (href: string) => void;
}) {
  const { isSignedIn } = useUser();
  const { credits } = useCredits();
  const router = useRouter();
  const nav = (href: string) =>
    onNavigate ? onNavigate(href) : router.push(href);

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-white dark:bg-neutral-950 py-3 sm:py-4 border-b border-neutral-200 dark:border-neutral-900 transition-colors">
      {/* Logo */}
      <button
        onClick={() => nav("/")}
        className="flex items-center gap-2 cursor-pointer"
      >
        <img src={Logo.src} className="w-8 sm:w-10 opacity-100 dark:opacity-90 transition-opacity" alt="CrawlCube logo" />
        <img
          src={cname.src}
          className="w-22 sm:w-30 hidden sm:block dark:invert-0 invert opacity-90 transition-all"
          alt="CrawlCube"
        />
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {isSignedIn && credits !== null && (
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 bg-neutral-100/80 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-full px-2.5 sm:px-3 py-1.5 transition-colors"
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {credits}
              <span className="hidden sm:inline">
                {" "}
                {credits === 1 ? "credit" : "credits"}
              </span>
            </span>
          </Link>
        )}

        {isSignedIn && (
          <button
            onClick={() => nav("/dashboard")}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        )}

        <ThemeToggle />
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
