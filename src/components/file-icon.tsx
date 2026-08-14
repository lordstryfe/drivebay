import {
  Archive,
  Box,
  File,
  FileCode2,
  FileText,
  Folder,
  Image as ImageIcon,
  Music,
  Printer,
  Video,
} from "lucide-react";
import type { FileCategory } from "@/lib/files/types";
import { cn } from "@/lib/utils";

const ICONS = {
  folder: Folder,
  image: ImageIcon,
  video: Video,
  audio: Music,
  text: FileText,
  code: FileCode2,
  document: FileText,
  archive: Archive,
  model: Box,
  print: Printer,
  other: File,
} as const;

export function FileGlyph({
  category,
  className,
}: {
  category: FileCategory;
  className?: string;
}) {
  const Icon = ICONS[category] ?? File;
  return <Icon className={cn("size-4 shrink-0", className)} strokeWidth={1.75} />;
}
