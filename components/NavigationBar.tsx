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
  { name: "Settings", href: "/settings" },
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
    <nav className="border-b bg-card shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-lg sm:text-xl font-bold text-foreground hover:text-primary"
            >
              Arena Triumph
            </Link>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center space-x-1">
              {navigationItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-2 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
              className="ml-2 text-xs sm:text-sm whitespace-nowrap"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
