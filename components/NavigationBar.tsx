"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const navigationItems = [
  { name: "Battle", href: "/battle" },
  { name: "Obtain Gear", href: "/obtain-gear" },
  { name: "Manage Inventory", href: "/inventory" },
  { name: "Inspect", href: "/inspect" },
];

const CONFIRM_TEXT = "DELETE";

export function NavigationBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function openDeleteDialog() {
    setDeleteDialogOpen(true);
    setConfirmInput("");
    setDeleteError(null);
  }

  function closeDeleteDialog() {
    setDeleteDialogOpen(false);
    setConfirmInput("");
    setDeleteError(null);
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setIsDeleting(true);
    const { error } = await supabase.rpc("delete_my_account");
    setIsDeleting(false);
    if (error) {
      setDeleteError(error.message ?? "Could not delete account. Try again.");
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const canConfirmDelete =
    confirmInput.trim() === CONFIRM_TEXT && !isDeleting;

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-base sm:text-lg font-bold text-white whitespace-nowrap transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                >
                  Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={openDeleteDialog}
                >
                  Delete User Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              Your account and all associated data will be permanently deleted.
              This cannot be undone. To confirm, type <strong>{CONFIRM_TEXT}</strong> in the
              box below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_TEXT}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Type ${CONFIRM_TEXT} to confirm`}
              disabled={isDeleting}
            />
            {deleteError && (
              <p className="text-sm text-danger" role="alert">
                {deleteError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!canConfirmDelete}
            >
              {isDeleting ? "Deleting…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
