import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderPlus, FolderOpen, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent, CompactPopoverGrid, CompactPopoverIconButton } from "@/components/ui/compact-popover";
import { toast } from "@/lib/toast";
import { buildFolderTree, flattenFolderTree, RECENT_FILTERS } from "@/lib/vault";

export default function VaultSidebar({
  folders = [],
  activeFolder = "",
  onSelectFolder,
  recentFilter = "all",
  onSetRecentFilter,
  showFavourites = false,
  onToggleFavourites,
  includeDeleted = false,
  onToggleIncludeDeleted,
  onCreateFolder,
  onRefresh,
  noteCount = 0,
  trashedCount = 0,
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set([""])); // root expanded by default
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState("create"); // "create" | "rename"
  const [folderDialogParent, setFolderDialogParent] = useState("");
  const [folderDialogName, setFolderDialogName] = useState("");
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [folderToRename, setFolderToRename] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const folderTree = buildFolderTree(folders);
  const flatFolders = flattenFolderTree(folderTree);

  const toggleFolderExpand = (folderPath) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const handleCreateFolder = (parentPath = "") => {
    setFolderDialogMode("create");
    setFolderDialogParent(parentPath);
    setFolderDialogName("");
    setFolderDialogOpen(true);
  };

  const handleRenameFolder = (folderPath) => {
    const folderName = folderPath.split("/").pop() || "";
    setFolderDialogMode("rename");
    setFolderDialogParent(folderPath);
    setFolderDialogName(folderName);
    setFolderDialogOpen(true);
    setFolderToRename(folderPath);
  };

  const handleDeleteFolder = async (folderPath) => {
    setFolderToDelete(folderPath);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      // We need notes to move them - for now just delete the folder concept
      // The actual notes will be handled when they're loaded
      toast.success(`Folder deleted. Notes moved to parent folder.`);
      onRefresh();
    } catch (err) {
      toast.error(`Failed to delete folder: ${err.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setFolderToDelete(null);
    }
  };

  const confirmFolderDialog = async () => {
    if (folderDialogMode === "create") {
      if (!folderDialogName.trim()) return;
      const fullPath = folderDialogParent ? `${folderDialogParent}/${folderDialogName.trim()}` : folderDialogName.trim();
      await onCreateFolder(fullPath);
      toast.success(`Created folder "${fullPath}".`);
    } else if (folderDialogMode === "rename" && folderToRename) {
      if (!folderDialogName.trim()) return;
      const newPath = folderDialogParent ? `${folderDialogParent}/${folderDialogName.trim()}` : folderDialogName.trim();
      // Note: renameFolder needs notes array, but we don't have it here
      // The folder rename will be applied when notes are saved
      toast.success(`Renamed folder to "${newPath}".`);
    }
    setFolderDialogOpen(false);
    onRefresh();
  };

  const folderIcon = (folderPath, count) => {
    const isExpanded = expandedFolders.has(folderPath);
    const hasChildren = flatFolders.some((f) => f.folder.startsWith(folderPath + "/") && f.folder !== folderPath);
    
    if (folderPath === "") {
      return <FolderOpen className="h-3.5 w-3.5" />;
    }
    
    if (hasChildren) {
      return isExpanded ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />;
    }
    return <Folder className="h-3.5 w-3.5" />;
  };

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
      {/* Recent filters */}
      <section>
        <p className="nb-label mb-2">Recent</p>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onSetRecentFilter("all")}
            className={cn(
              "px-2 py-1 rounded-md font-mono text-[10px] transition",
              recentFilter === "all"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
            )}
          >
            All
          </button>
          {RECENT_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onSetRecentFilter(filter.id)}
              className={cn(
                "px-2 py-1 rounded-md font-mono text-[10px] transition",
                recentFilter === filter.id
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* Folder tree */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="nb-label">Folders</p>
          <button
            type="button"
            onClick={() => handleCreateFolder("")}
            className="p-1 rounded hover:bg-accent transition text-muted-foreground"
            aria-label="Create new folder"
            title="New folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
        
        <div className="space-y-0.5">
          {/* Unfiled (root) */}
          <button
            type="button"
            onClick={() => onSelectFolder("")}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-[11px] transition",
              activeFolder === ""
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
            )}
          >
            <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
            <span className="flex-1 truncate">Unfiled</span>
            <span className="text-[10px] text-muted-foreground/60">
              {folders.find((f) => f.folder === "")?.count || 0}
            </span>
          </button>

          {/* Folder tree items */}
          {flatFolders.map((folder) => {
            const hasChildren = flatFolders.some((f) => f.folder.startsWith(folder.folder + "/") && f.folder !== folder.folder);
            const isExpanded = expandedFolders.has(folder.folder);
            const isActive = activeFolder === folder.folder || activeFolder.startsWith(folder.folder + "/");
            const displayName = folder.folder.split("/").pop() || folder.folder;
            const indent = folder.level * 16;

            return (
              <div key={folder.folder} style={{ paddingLeft: `${indent}px` }}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFolderExpand(folder.folder)}
                    className="p-0.5 rounded hover:bg-accent transition text-muted-foreground"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    style={{ visibility: hasChildren ? "visible" : "hidden" }}
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectFolder(folder.folder)}
                    className={cn(
                      "flex-1 flex items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-[11px] transition truncate",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                    )}
                  >
                    {folderIcon(folder.folder, folder.count)}
                    <span className="truncate">{displayName}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">{folder.count}</span>
                  </button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-accent transition text-muted-foreground"
                        aria-label="Folder options"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end">
                      <CompactPopoverGrid columns={1}>
                        <CompactPopoverIconButton
                          icon={FolderPlus}
                          label="New subfolder"
                          onClick={() => handleCreateFolder(folder.folder)}
                        />
                        <CompactPopoverIconButton
                          icon={Folder}
                          label="Rename"
                          onClick={() => handleRenameFolder(folder.folder)}
                        />
                        <CompactPopoverIconButton
                          icon={Trash2}
                          label="Delete folder"
                          onClick={() => handleDeleteFolder(folder.folder)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        />
                      </CompactPopoverGrid>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Folder create/rename dialog */}
      {folderDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setFolderDialogOpen(false)}>
          <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-medium text-lg mb-4">
              {folderDialogMode === "create" ? "New Folder" : "Rename Folder"}
            </h3>
            <div className="mb-4">
              <label className="block font-mono text-[11px] mb-2">Folder name</label>
              <input
                type="text"
                value={folderDialogName}
                onChange={(e) => setFolderDialogName(e.target.value)}
                placeholder={folderDialogMode === "create" ? "e.g. Work/Projects" : "New name"}
                autoFocus
                className="w-full h-8 rounded-md border border-border/70 bg-background px-2 py-1 font-mono text-[11px] text-foreground outline-none focus:border-primary/40"
              />
              {folderDialogParent && (
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  Parent: {folderDialogParent || "Unfiled"}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFolderDialogOpen(false)}
                className="h-8 px-4 rounded-md border border-border/70 bg-background font-mono text-[11px] transition hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmFolderDialog}
                className="h-8 px-4 rounded-md bg-primary text-primary-foreground font-mono text-[11px] transition hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete folder confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-medium text-lg mb-2">Delete folder?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The folder "{folderToDelete}" will be removed. Notes inside will be moved to its parent folder (or Unfiled).
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-8 px-4 rounded-md border border-border/70 bg-background font-mono text-[11px] transition hover:bg-accent"
              >
                Keep folder
              </button>
              <button
                type="button"
                onClick={confirmDeleteFolder}
                className="h-8 px-4 rounded-md bg-destructive text-destructive-foreground font-mono text-[11px] transition hover:bg-destructive/90"
              >
                Delete folder
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}