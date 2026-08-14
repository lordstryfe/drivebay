import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";

export const Route = createFileRoute("/")({
  ssr: false,
  component: HomePage,
});

function HomePage() {
  const [App, setApp] = useState<ComponentType | null>(null);
  useEffect(() => {
    let alive = true;
    void import("@/components/browser/app").then((mod) => {
      if (alive) setApp(() => mod.FileBrowserApp);
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!App) {
    return <div className="min-h-dvh bg-bg" />;
  }
  return <App />;
}
