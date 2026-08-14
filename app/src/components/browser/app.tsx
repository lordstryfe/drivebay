import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowUp,
  ChevronRight,
  Columns2,
  Download,
  Eye,
  EyeOff,
  FolderPlus,
  HardDrive,
  Home,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  LogOut,
  Menu,
  Pencil,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { emailToUsername } from "@/lib/files/identity";
import {
  createFolder,
  deleteEntry,
  getPreview,
  listDrives,
  listEntries,
  readFileBase64,
  renameEntry,
  uploadFile,
} from "@/lib/files/api.functions";
import { defaultStartPath, formatBytes, formatWhen, splitPath } from "@/lib/files/format";
import type { DirListing, Drive, FsEntry, PreviewPayload } from "@/lib/files/types";
import { FileGlyph } from "@/components/file-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "grid";

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message === "Unauthorized" ? "Session expired" : err.message;
  return "Something went wrong";
}

export function FileBrowserApp() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [listing, setListing] = useState<DirListing | null>(null);
  const [path, setPath] = useState<string>("");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pathEdit, setPathEdit] = useState(false);
  const [pathDraft, setPathDraft] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const selectedEntry = listing?.entries.find((e) => e.path === selected) ?? null;
  const crumbs = useMemo(() => (listing ? splitPath(listing.path) : []), [listing]);

  const visible = useMemo(() => {
    const entries = listing?.entries ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [listing, query]);

  const loadDrives = useCallback(async () => {
    const next = await listDrives();
    setDrives(next);
    return next;
  }, []);

  const openPath = useCallback(
    async (nextPath: string, opts?: { select?: string | null; silent?: boolean }) => {
      setLoading(true);
      try {
        const next = await listEntries({ data: { path: nextPath, showHidden } });
        setListing(next);
        setPath(next.path);
        setSelected(opts?.select === undefined ? null : opts.select);
        setPreview(null);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        return true;
      } catch (err) {
        if (!opts?.silent) toast.error(errMessage(err));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showHidden],
  );

  useEffect(() => {
    if (isPending || !user) return;
    let alive = true;
    (async () => {
      try {
        const nextDrives = await loadDrives();
        if (!alive) return;
        const candidates = [
          defaultStartPath(nextDrives),
          nextDrives.find((d) => d.kind === "project")?.path ?? null,
          "/workspace",
          nextDrives.find((d) => d.kind === "home")?.path ?? null,
          "/",
        ].filter((p, i, arr): p is string => Boolean(p) && arr.indexOf(p) === i);

        const tryOpen = async (target: string, silent: boolean) => {
          if (await openPath(target, { silent })) return true;
          await new Promise((resolve) => setTimeout(resolve, 280));
          if (!alive) return false;
          return openPath(target, { silent });
        };

        for (let i = 0; i < candidates.length; i += 1) {
          if (!alive) return;
          const last = i === candidates.length - 1;
          const ok = await tryOpen(candidates[i] ?? "/", !last);
          if (ok) return;
        }
      } catch (err) {
        if (alive) toast.error(errMessage(err));
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, user, showHidden]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  async function inspect(entry: FsEntry) {
    setSelected(entry.path);
    if (entry.kind === "dir") return;
    setPreview(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    try {
      const payload = await getPreview({ data: { path: entry.path } });
      setPreview(payload);
      if (payload.kind === "image") {
        const file = await readFileBase64({ data: { path: entry.path } });
        const bin = Uint8Array.from(atob(file.contentBase64), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bin], { type: file.mime }));
        setPreviewUrl(url);
      }
    } catch (err) {
      toast.error(errMessage(err));
    }
  }

  async function activate(entry: FsEntry) {
    if (entry.kind === "dir" || entry.kind === "link") {
      setMobileNav(false);
      await openPath(entry.path);
      return;
    }
    await inspect(entry);
    setMobilePreview(true);
  }

  async function downloadSelected() {
    if (!selectedEntry || selectedEntry.kind === "dir") return;
    setBusy(true);
    try {
      const file = await readFileBase64({ data: { path: selectedEntry.path } });
      const bin = Uint8Array.from(atob(file.contentBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bin], { type: file.mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(files: FileList | File[]) {
    if (!listing) return;
    const list = Array.from(files);
    if (list.length === 0) return;
    setBusy(true);
    try {
      for (const file of list) {
        if (file.size > 32 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 32 MB`);
          continue;
        }
        const buf = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (const byte of buf) binary += String.fromCharCode(byte);
        await uploadFile({
          data: {
            parent: listing.path,
            name: file.name,
            contentBase64: btoa(binary),
          },
        });
      }
      toast.success(list.length === 1 ? "Uploaded" : `Uploaded ${list.length} files`);
      await openPath(listing.path);
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateFolder() {
    if (!listing || !folderName.trim()) return;
    setBusy(true);
    try {
      await createFolder({ data: { parent: listing.path, name: folderName.trim() } });
      setFolderOpen(false);
      setFolderName("");
      await openPath(listing.path);
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRename() {
    if (!selectedEntry || !renameValue.trim()) return;
    setBusy(true);
    try {
      const next = await renameEntry({ data: { path: selectedEntry.path, name: renameValue.trim() } });
      setRenameOpen(false);
      await openPath(listing?.path ?? path, { select: next.path });
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!selectedEntry) return;
    setBusy(true);
    try {
      await deleteEntry({ data: { path: selectedEntry.path } });
      setDeleteOpen(false);
      await openPath(listing?.path ?? path);
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "Backspace" && listing?.parent) {
      e.preventDefault();
      void openPath(listing.parent);
    }
    if (e.key === "Enter" && selectedEntry) {
      e.preventDefault();
      void activate(selectedEntry);
    }
    if ((e.key === "Delete" || e.key === "Backspace") && (e.metaKey || e.ctrlKey) && selectedEntry) {
      e.preventDefault();
      setDeleteOpen(true);
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (visible.length === 0) return;
      const idx = visible.findIndex((x) => x.path === selected);
      const next =
        e.key === "ArrowDown"
          ? visible[Math.min(visible.length - 1, (idx < 0 ? -1 : idx) + 1)]
          : visible[Math.max(0, (idx < 0 ? 1 : idx) - 1)];
      if (next) void inspect(next);
    }
  }

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <Loader2 className="size-6 animate-spin text-fg-subtle" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const ownerName = user.displayName || emailToUsername(user.primaryEmail);

  const nav = (
    <DriveNav
      drives={drives}
      current={listing?.path ?? path}
      onOpen={(p) => {
        setMobileNav(false);
        void openPath(p);
      }}
    />
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-bg text-fg" onKeyDown={onKeyDown} tabIndex={0}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 md:px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setMobileNav(true)}
          aria-label="Open drives"
        >
          <Menu className="size-4" />
        </Button>
        <div className="hidden items-center gap-2 md:flex">
          <HardDrive className="size-4 text-fg-muted" strokeWidth={1.7} />
          <span className="font-mono text-[11px] tracking-[0.16em] text-fg-subtle uppercase">
            Drivebay
          </span>
        </div>
        <Separator orientation="vertical" className="mx-1 hidden h-5 md:block" />
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <IconBtn label="Up" disabled={!listing?.parent} onClick={() => listing?.parent && void openPath(listing.parent)}>
            <ArrowUp />
          </IconBtn>
          <IconBtn label="Refresh" onClick={() => listing && void openPath(listing.path)}>
            <RefreshCw />
          </IconBtn>
          {pathEdit ? (
            <form
              className="min-w-0 flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                setPathEdit(false);
                if (pathDraft.trim()) void openPath(pathDraft.trim());
              }}
            >
              <Input
                autoFocus
                value={pathDraft}
                onChange={(e) => setPathDraft(e.target.value)}
                onBlur={() => setPathEdit(false)}
                className="h-8 font-mono text-xs"
                spellCheck={false}
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPathDraft(listing?.path ?? path);
                setPathEdit(true);
              }}
              className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden rounded-sm px-1.5 py-1 text-left hover:bg-bg-subtle"
            >
              {crumbs.map((c, i) => (
                <span key={c.path} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3 shrink-0 text-fg-subtle" />}
                  <span
                    className={cn(
                      "truncate font-mono text-xs",
                      i === crumbs.length - 1 ? "text-fg" : "text-fg-muted",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      void openPath(c.path);
                    }}
                  >
                    {c.label}
                  </span>
                </span>
              ))}
            </button>
          )}
        </div>
        <div className="relative hidden w-44 sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-0.5">
          <IconBtn label={showHidden ? "Hide hidden" : "Show hidden"} onClick={() => setShowHidden((v) => !v)}>
            {showHidden ? <Eye /> : <EyeOff />}
          </IconBtn>
          <IconBtn label="List" onClick={() => setView("list")}>
            <ListIcon className={view === "list" ? "text-fg" : undefined} />
          </IconBtn>
          <IconBtn label="Grid" onClick={() => setView("grid")}>
            <LayoutGrid className={view === "grid" ? "text-fg" : undefined} />
          </IconBtn>
        </div>
        <div className="hidden items-center gap-2 pl-1 md:flex">
          <span className="max-w-28 truncate text-xs text-fg-muted">{ownerName}</span>
          <Button variant="ghost" size="icon-sm" aria-label="Settings" onClick={() => void navigate({ to: "/settings" })}>
            <Settings className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void signOut("/login")}>
            <LogOut className="size-3.5" />
            Lock
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-56 shrink-0 overflow-hidden border-r border-border md:flex md:flex-col">
          {nav}
        </aside>

        <section
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) void handleUpload(e.dataTransfer.files);
          }}
        >
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
            <Button variant="ghost" size="sm" onClick={() => setFolderOpen(true)}>
              <FolderPlus className="size-3.5" />
              New folder
            </Button>
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-3.5" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) void handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={!selectedEntry}
              onClick={() => {
                if (!selectedEntry) return;
                setRenameValue(selectedEntry.name);
                setRenameOpen(true);
              }}
            >
              <Pencil className="size-3.5" />
              Rename
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!selectedEntry}
              className="text-danger hover:text-danger"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
            <div className="ml-auto hidden text-xs text-fg-subtle sm:block">
              {visible.length} {visible.length === 1 ? "item" : "items"}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {loading && !listing ? (
              <div className="grid h-full place-items-center text-fg-subtle">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : view === "list" ? (
              <FileTable
                entries={visible}
                selected={selected}
                onSelect={(e) => void inspect(e)}
                onOpen={(e) => void activate(e)}
              />
            ) : (
              <FileGrid
                entries={visible}
                selected={selected}
                onSelect={(e) => void inspect(e)}
                onOpen={(e) => void activate(e)}
              />
            )}
          </div>

          {dragging && (
            <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-lg border border-dashed border-border-strong bg-bg/70 text-sm text-fg">
              Drop files to upload
            </div>
          )}
        </section>

        <aside className="hidden w-80 shrink-0 border-l border-border xl:flex xl:flex-col">
          <PreviewPane
            entry={selectedEntry}
            preview={preview}
            previewUrl={previewUrl}
            busy={busy}
            onDownload={() => void downloadSelected()}
          />
        </aside>
      </div>

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="flex flex-col">
          <div className="flex items-center justify-between px-3 py-3">
            <span className="font-mono text-[11px] tracking-[0.16em] text-fg-subtle uppercase">
              Drives
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => setMobileNav(false)} aria-label="Close">
              <X className="size-4" />
            </Button>
          </div>
          {nav}
          <div className="mt-auto space-y-2 border-t border-border p-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setMobileNav(false);
                void navigate({ to: "/settings" });
              }}
            >
              <Settings className="size-3.5" />
              Settings
            </Button>
            <Button variant="outline" className="w-full" onClick={() => void signOut("/login")}>
              <LogOut className="size-3.5" />
              Lock
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={mobilePreview} onOpenChange={setMobilePreview}>
        <SheetContent side="bottom" className="flex max-h-[80dvh] flex-col xl:hidden">
          <PreviewPane
            entry={selectedEntry}
            preview={preview}
            previewUrl={previewUrl}
            busy={busy}
            onDownload={() => void downloadSelected()}
          />
        </SheetContent>
      </Sheet>

      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>Created in the current directory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreateFolder();
              }}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFolderOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy || !folderName.trim()} onClick={() => void handleCreateFolder()}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>Only the name changes — it stays in this folder.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleRename();
            }}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy || !renameValue.trim()} onClick={() => void handleRename()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedEntry?.name}?</DialogTitle>
            <DialogDescription>
              This cannot be undone
              {selectedEntry?.kind === "dir" ? " and removes everything inside." : "."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => void handleDelete()}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IconBtn({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function DriveNav({
  drives,
  current,
  onOpen,
}: {
  drives: Drive[];
  current: string;
  onOpen: (path: string) => void;
}) {
  const groups: { title: string; items: Drive[] }[] = [
    { title: "This machine", items: drives.filter((d) => d.kind === "volume" || d.kind === "system") },
    { title: "Places", items: drives.filter((d) => d.kind === "home" || d.kind === "project") },
  ].filter((g) => g.items.length > 0);

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-5 p-3">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-2 font-mono text-[10px] tracking-[0.16em] text-fg-subtle uppercase">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((drive) => {
                const active =
                  current === drive.path ||
                  current.startsWith(drive.path.endsWith("/") || drive.path.endsWith("\\") ? drive.path : `${drive.path}/`) ||
                  current.startsWith(`${drive.path}\\`);
                return (
                  <li key={drive.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(drive.path)}
                      className={cn(
                        "flex h-10 w-full items-center gap-2 rounded-sm px-2 text-left text-sm",
                        active ? "bg-bg-subtle text-fg" : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                      )}
                    >
                      {drive.kind === "home" ? (
                        <Home className="size-4 shrink-0" strokeWidth={1.7} />
                      ) : drive.kind === "project" ? (
                        <Columns2 className="size-4 shrink-0" strokeWidth={1.7} />
                      ) : (
                        <HardDrive className="size-4 shrink-0" strokeWidth={1.7} />
                      )}
                      <span className="truncate">{drive.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function FileTable({
  entries,
  selected,
  onSelect,
  onOpen,
}: {
  entries: FsEntry[];
  selected: string | null;
  onSelect: (entry: FsEntry) => void;
  onOpen: (entry: FsEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="grid h-full min-h-48 place-items-center px-6 text-center text-sm text-fg-muted">
        This folder is empty
      </div>
    );
  }
  return (
    <>
      <ul className="divide-y divide-border md:hidden">
        {entries.map((entry) => {
          const active = selected === entry.path;
          return (
            <li key={entry.path}>
              <button
                type="button"
                onClick={() => onOpen(entry)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 px-3 py-3 text-left",
                  active ? "bg-bg-subtle" : "active:bg-bg-elevated",
                )}
              >
                <FileGlyph
                  category={entry.category}
                  className={entry.kind === "dir" ? "text-fg" : "text-fg-muted"}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{entry.name}</span>
                  <span className="block font-mono text-[11px] text-fg-subtle">
                    {entry.kind === "dir" ? "Folder" : formatBytes(entry.size)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <table className="hidden w-full min-w-[28rem] text-left text-sm md:table">
        <thead className="sticky top-0 bg-bg text-[11px] tracking-wide text-fg-subtle uppercase">
          <tr className="border-b border-border">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="w-28 px-3 py-2 font-medium">Size</th>
            <th className="w-48 px-3 py-2 font-medium">Modified</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const active = selected === entry.path;
            return (
              <tr
                key={entry.path}
                onClick={() => onSelect(entry)}
                onDoubleClick={() => onOpen(entry)}
                className={cn(
                  "cursor-default border-b border-border/70",
                  active ? "bg-bg-subtle" : "hover:bg-bg-elevated",
                )}
              >
                <td className="px-3 py-2.5">
                  <span className="flex min-h-10 min-w-0 items-center gap-2">
                    <FileGlyph
                      category={entry.category}
                      className={entry.kind === "dir" ? "text-fg" : "text-fg-muted"}
                    />
                    <span className="truncate">{entry.name}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-fg-muted">
                  {entry.kind === "dir" ? "—" : formatBytes(entry.size)}
                </td>
                <td className="px-3 py-2.5 text-xs text-fg-muted">{formatWhen(entry.mtime)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function FileGrid({
  entries,
  selected,
  onSelect,
  onOpen,
}: {
  entries: FsEntry[];
  selected: string | null;
  onSelect: (entry: FsEntry) => void;
  onOpen: (entry: FsEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="grid h-full place-items-center px-6 text-center text-sm text-fg-muted">
        This folder is empty
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map((entry) => {
        const active = selected === entry.path;
        return (
          <li key={entry.path}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              onDoubleClick={() => onOpen(entry)}
              className={cn(
                "flex min-h-24 h-full w-full flex-col items-start gap-3 rounded-md border p-3 text-left",
                active ? "border-border-strong bg-bg-subtle" : "border-transparent bg-bg-elevated hover:border-border",
              )}
            >
              <FileGlyph
                category={entry.category}
                className={cn("size-5", entry.kind === "dir" ? "text-fg" : "text-fg-muted")}
              />
              <span className="line-clamp-2 w-full text-sm leading-snug">{entry.name}</span>
              <span className="font-mono text-[11px] text-fg-subtle">
                {entry.kind === "dir" ? "Folder" : formatBytes(entry.size)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PreviewPane({
  entry,
  preview,
  previewUrl,
  busy,
  onDownload,
}: {
  entry: FsEntry | null;
  preview: PreviewPayload | null;
  previewUrl: string | null;
  busy: boolean;
  onDownload: () => void;
}) {
  if (!entry) {
    return (
      <div className="grid flex-1 place-items-center px-6 py-10 text-center text-sm text-fg-muted">
        Select a file to inspect it
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="truncate text-sm font-medium">{entry.name}</p>
        <p className="mt-1 font-mono text-[11px] text-fg-subtle">
          {entry.kind === "dir" ? "Folder" : formatBytes(entry.size)}
          {entry.ext ? ` · ${entry.ext}` : ""}
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {entry.kind === "dir" ? (
            <p className="text-sm text-fg-muted">Double-click to open this folder.</p>
          ) : preview?.kind === "image" && previewUrl ? (
            <img
              src={previewUrl}
              alt={entry.name}
              className="max-h-72 w-full rounded-sm object-contain outline outline-1 -outline-offset-1 outline-fg/10"
            />
          ) : preview?.kind === "text" ? (
            <pre className="max-h-[28rem] overflow-auto rounded-sm bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg-muted">
              {preview.text}
              {preview.truncated ? "\n\n…truncated" : ""}
            </pre>
          ) : (
            <p className="text-sm text-fg-muted">No inline preview. Download to open it locally.</p>
          )}
        </div>
      </ScrollArea>
      {entry.kind !== "dir" && (
        <div className="border-t border-border p-3">
          <Button className="w-full" disabled={busy} onClick={onDownload}>
            {busy ? <Loader2 className="animate-spin" /> : <Download />}
            Download
          </Button>
        </div>
      )}
    </div>
  );
}
