"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Battle", href: "/battle" },
  { name: "Obtain Gear", href: "/obtain-gear" },
  { name: "Manage Inventory", href: "/inventory" },
  { name: "Inspect", href: "/inspect" },
];

export function NavigationBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b shadow-sm bg-[var(--nav-bar-bg)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-28 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <img
                src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/arena_triumph_title.png"
                alt="Arena Triumph"
                className="h-[7rem] sm:h-[7.875rem] w-auto object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center gap-1 overflow-x-hidden">
            <div className="flex items-center space-x-1">
              {navigationItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-base sm:text-lg font-bold whitespace-nowrap transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="ml-2 text-base sm:text-lg font-bold text-white whitespace-nowrap transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
