"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiMessages } from "@/hooks/use-ui-messages";
import { guestRegex } from "@/lib/constants";
import { ChevronDown } from "lucide-react";
import type { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { LoaderIcon, PlusIcon } from "./icons";
import { toast } from "./toast";

function PureChatHeader({
  chatId,
  isReadonly,
  isGuest = false,
  user,
}: {
  chatId: string;
  isReadonly: boolean;
  isGuest?: boolean;
  user?: { id: string; email?: string | null; name?: string | null; type?: string } | null;
}) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const { DEPLOY_LINK } = useUiMessages();

  const isGuestUser = !user || guestRegex.test(user?.email ?? "");

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: Logo/Title */}
      <Link 
        href="/" 
        className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          AI
        </div>
        <span>Blog Chat</span>
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          className="h-9 gap-2"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          variant="outline"
        >
          <PlusIcon />
          <span>New Chat</span>
        </Button>

        {!isGuestUser && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {status === "loading" ? (
                <Button className="gap-2" variant="ghost">
                  <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                  <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                    Loading...
                  </span>
                  <div className="animate-spin text-zinc-500">
                    <LoaderIcon />
                  </div>
                </Button>
              ) : (
                <Button className="gap-2" variant="ghost">
                  <Image
                    alt={user.email ?? "User Avatar"}
                    className="rounded-full"
                    height={24}
                    src={`https://avatar.vercel.sh/${user.email}`}
                    width={24}
                  />
                  <span className="max-w-[150px] truncate">{user?.email}</span>
                  <ChevronDown className="size-4" />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button
                  className="w-full cursor-pointer"
                  onClick={() => {
                    if (status === "loading") {
                      toast({
                        type: "error",
                        description:
                          "Checking authentication status, please try again!",
                      });
                      return;
                    }
                    signOut({
                      redirectTo: "/",
                    });
                  }}
                  type="button"
                >
                  Sign Out
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isGuestUser && (
          <Button
            onClick={() => router.push("/login")}
            variant="default"
          >
            Sign In
          </Button>
        )}

        {DEPLOY_LINK.url && (
          <Link
            href={DEPLOY_LINK.url}
            className="ml-1 text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground"
            target="_blank"
            rel="noreferrer"
            aria-label="Open deployment"
          >
            {DEPLOY_LINK.label}
          </Link>
        )}
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.isGuest === nextProps.isGuest &&
    prevProps.user?.email === nextProps.user?.email
  );
});
