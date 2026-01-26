"use client";

import { useEffect, useState } from "react";
import YAML from "yaml";

type ChatGreeting = {
  title: string;
  subtitle: string;
  cta: string;
};

type UiMessages = {
  CHAT_GREETING: ChatGreeting;
  CHAT_SUGGESTED_ACTIONS: string[];
  DEPLOY_LINK: {
    url: string;
    label: string;
    hide: boolean;
  };
  UI_SETTINGS?: {
    modelSelector?: {
      enabledInProduction?: boolean;
    };
  };
};

const DEFAULT_MESSAGES: UiMessages = {
  CHAT_GREETING: {
    title: "Hello!",
    subtitle: "Get a quick overview about me.",
    cta: "Sign in to start the interview right away.",
  },
  CHAT_SUGGESTED_ACTIONS: [
    "Tell me about your career and experience",
    "What are the key projects you've worked on?",
    "What tech stack do you use?",
    "What are your strengths?",
  ],
  DEPLOY_LINK: {
    url: "",
    label: "Deploy",
    hide: false,
  },
  UI_SETTINGS: {
    modelSelector: {
      enabledInProduction: false,
    },
  },
};

const isValidMessages = (messages: UiMessages | null | undefined) => {
  return Boolean(
    messages?.CHAT_GREETING?.title &&
      messages?.CHAT_GREETING?.subtitle &&
      messages?.CHAT_GREETING?.cta &&
      Array.isArray(messages?.CHAT_SUGGESTED_ACTIONS)
  );
};

export const useUiMessages = () => {
  const [messages, setMessages] = useState<UiMessages>(DEFAULT_MESSAGES);

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      try {
        const response = await fetch("/ai-chatbot-blog.yaml", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const text = await response.text();
        const parsed = YAML.parse(text) as UiMessages;
        if (!cancelled && isValidMessages(parsed)) {
          setMessages({
            ...DEFAULT_MESSAGES,
            ...parsed,
            CHAT_GREETING: {
              ...DEFAULT_MESSAGES.CHAT_GREETING,
              ...parsed.CHAT_GREETING,
            },
            DEPLOY_LINK: {
              ...DEFAULT_MESSAGES.DEPLOY_LINK,
              ...parsed.DEPLOY_LINK,
            },
          });
        }
      } catch (_error) {
        // Keep defaults on failure
      }
    };

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, []);

  return messages;
};
