import { createFileRoute } from "@tanstack/react-router";
import { FileBrowserApp } from "@/components/browser/app";

export const Route = createFileRoute("/")({
  ssr: false,
  component: FileBrowserApp,
});
