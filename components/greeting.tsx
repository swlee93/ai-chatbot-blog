'use client';

import { useUiMessages } from "@/hooks/use-ui-messages";
import { motion } from "framer-motion";
import { ChatHistoryCards } from "./chat-history-cards";

type GreetingProps = {
  isGuest?: boolean;
};

export const Greeting = ({ isGuest = false }: GreetingProps) => {
  const { CHAT_GREETING } = useUiMessages();
  return (
    <div
      className="mt-4 flex w-full flex-col justify-start md:mt-16"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        {CHAT_GREETING.title}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-zinc-500 md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        {CHAT_GREETING.subtitle}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        <ChatHistoryCards isGuest={isGuest} />
      </motion.div>
    </div>
  );
};
