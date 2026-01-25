import { auth } from "@/app/(auth)/auth";
import { DataStreamProvider } from "@/components/data-stream-provider";
import Script from "next/script";
import { Suspense } from "react";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <Suspense fallback={<div className="flex h-dvh" />}>
          {children}
        </Suspense>
      </DataStreamProvider>
    </>
  );
}
