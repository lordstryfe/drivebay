export type DriveKind = "volume" | "system" | "home" | "project";

export type Drive = {
  id: string;
  path: string;
  label: string;
  kind: DriveKind;
};

export type FsKind = "dir" | "file" | "link" | "other";

export type FileCategory =
  | "folder"
  | "image"
  | "video"
  | "audio"
  | "text"
  | "code"
  | "document"
  | "archive"
  | "model"
  | "print"
  | "other";

export type FsEntry = {
  name: string;
  path: string;
  kind: FsKind;
  ext: string;
  size: number | null;
  mtime: number | null;
  category: FileCategory;
};

export type DirListing = {
  path: string;
  parent: string | null;
  entries: FsEntry[];
};

export type TextPreview = {
  kind: "text";
  text: string;
  truncated: boolean;
  language: string | null;
};

export type ImagePreview = {
  kind: "image";
  mime: string;
};

export type BinaryPreview = {
  kind: "binary";
};

export type PreviewPayload = TextPreview | ImagePreview | BinaryPreview;

export type SearchHit = FsEntry & {
  folder: string;
};

export type SearchResult = {
  root: string;
  query: string;
  hits: SearchHit[];
  truncated: boolean;
};

