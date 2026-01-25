"use client";

import { getChatHistoryPaginationKey } from "@/components/sidebar-history";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipArrow,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { PlusIcon } from "./icons";

type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

const PAGE_SIZE = 10;

export function ChatHistoryCards({ isGuest = false }: { isGuest?: boolean }) {
  const router = useRouter();
  
  const { data, size, setSize, isLoading } = useSWRInfinite<ChatHistory>(
    getChatHistoryPaginationKey,
    fetcher,
    {
      initialSize: 1,
    }
  );

  const chats = data?.flatMap((page) => page.chats) ?? [];
  const hasMore = data?.[data.length - 1]?.hasMore ?? false;

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isGuest) {
    return null;
  }

  if (chats.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Recent Interviews</h3>
          {!isGuest && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => signOut({ redirectTo: "/" })}
                  size="icon"
                  variant="ghost"
                  className="size-8"
                >
                  <LogOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <TooltipArrow className="fill-popover" />
                <p>Log out</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/chat/${chat.id}`}
                className="group block rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <h4 className="line-clamp-2 font-medium text-sm group-hover:text-primary">
                  {chat.title}
                </h4>
                <p className="mt-2 text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(chat.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
        {hasMore && (
          <button
            onClick={() => setSize(size + 1)}
            className="w-full rounded-md border py-2 text-sm transition-colors hover:bg-muted"
          >
            Load more
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
