import { AppNav } from "@/components/app-nav";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import fs from "node:fs/promises";
import path from "node:path";
import { Suspense } from "react";
import { Toaster } from "sonner";
import YAML from "yaml";

import { SessionProvider } from "next-auth/react";
import "./globals.css";

const DEFAULT_BRANDING = {
  title: "Interview with Sangwoo Lee",
  description: "AI-powered interview chatbot about Sangwoo Lee's blog and experience.",
  favicon: "/favicon.ico",
};

async function loadBranding() {
  try {
    const configPath = path.join(process.cwd(), "public", "ai-chatbot-blog.yaml");
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = YAML.parse(raw) as {
      BRANDING?: { title?: string; description?: string; favicon?: string };
    };
    return {
      ...DEFAULT_BRANDING,
      ...parsed?.BRANDING,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await loadBranding();
  return {
    metadataBase: new URL("https://chat.vercel.ai"),
    title: branding.title,
    description: branding.description,
    icons: branding.favicon ? { icon: branding.favicon } : undefined,
  };
}

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable}`}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <Toaster position="top-center" />
          <SessionProvider>
            <div className="flex h-screen flex-col">
              <Suspense fallback={null}>
                <AppNav />
              </Suspense>
              <div className="flex-1 overflow-hidden">{children}</div>
            </div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
