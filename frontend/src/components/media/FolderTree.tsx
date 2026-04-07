import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Pencil,
  MoreHorizontal,
  HardDrive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FolderItem } from '@/types/api/media';

interface TreeNode {
  folder: FolderItem;
  children: TreeNode[];
}

interface FolderTreeProps {
  folders: FolderItem[];
  selectedFolderId: number | null;
  onSelect: (folderId: number | null) => void;
  onCreateFolder: (parentId: number | null) => void;
  onDeleteFolder: (id: number) => void;
  onRenameFolder: (id: number, name: string) => void;
  /** folder_id -> file count mapping */
  fileCounts?: Record<number, number>;
  /** Callback when dragging a file over a folder */
  onDragEnter?: (folderId: number) => void;
  /** Callback when dragging a file leaves a folder */
  onDragLeave?: (folderId: number) => void;
  /** Callback when dropping a file on a folder */
  onDrop?: (folderId: number) => void;
  /** Whether a drag operation is in progress */
  isDraggingFile?: boolean;
}

function buildTree(folders: FolderItem[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  folders.forEach((f) => map.set(f.id, { folder: f, children: [] }));
  folders.forEach((f) => {
    const node = map.get(f.id)!;
    if (f.parent_id && map.has(f.parent_id)) {
      map.get(f.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ---------------------------------------------------------------------------
// Context Menu
// ---------------------------------------------------------------------------

interface ContextMenuState {
  folderId: number;
  x: number;
  y: number;
}

const FolderContextMenu: React.FC<{
  folderId: number;
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCreateSubfolder: () => void;
}> = ({ x, y, onClose, onRename, onDelete, onCreateSubfolder }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[140px] rounded-lg border border-border bg-bg-surface shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      <button
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
        onClick={() => { onCreateSubfolder(); onClose(); }}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>新建子文件夹</span>
      </button>
      <button
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
        onClick={() => { onRename(); onClose(); }}
      >
        <Pencil className="h-3.5 w-3.5" />
        <span>重命名</span>
      </button>
      <div className="my-1 h-px bg-border" />
      <button
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-error hover:bg-error/10 transition-colors"
        onClick={() => { onDelete(); onClose(); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>删除</span>
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Folder Node
// ---------------------------------------------------------------------------

interface FolderNodeProps {
  node: TreeNode;
  depth: number;
  selectedFolderId: number | null;
  onSelect: (folderId: number | null) => void;
  onDeleteFolder: (id: number) => void;
  onRenameFolder: (id: number, name: string) => void;
  onCreateFolder: (parentId: number | null) => void;
  fileCounts?: Record<number, number>;
  isDraggingFile?: boolean;
  onDragEnter?: (folderId: number) => void;
  onDragLeave?: (folderId: number) => void;
  onDrop?: (folderId: number) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  node,
  depth,
  selectedFolderId,
  onSelect,
  onDeleteFolder,
  onRenameFolder,
  onCreateFolder,
  fileCounts,
  isDraggingFile,
  onDragEnter,
  onDragLeave,
  onDrop,
}) => {
  const [expanded, setExpanded] = useState(depth === 0);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.folder.name);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isSelected = selectedFolderId === node.folder.id;
  const hasChildren = node.children.length > 0;
  const fileCount = fileCounts?.[node.folder.id] ?? 0;

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.folder.name) {
      onRenameFolder(node.folder.id, trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, node.folder.id, node.folder.name, onRenameFolder]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ folderId: node.folder.id, x: e.clientX, y: e.clientY });
  }, [node.folder.id]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isDraggingFile) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isDraggingFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (isDraggingFile) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
      onDragEnter?.(node.folder.id);
    }
  }, [isDraggingFile, node.folder.id, onDragEnter]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (isDraggingFile) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      onDragLeave?.(node.folder.id);
    }
  }, [isDraggingFile, node.folder.id, onDragLeave]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (isDraggingFile) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      onDrop?.(node.folder.id);
    }
  }, [isDraggingFile, node.folder.id, onDrop]);

  return (
    <div>
      <div
        className={cn(
          'group relative flex items-center gap-1 rounded-md cursor-pointer text-sm transition-all select-none',
          isSelected
            ? 'bg-accent/10 text-accent'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
          isDragOver && isDraggingFile && 'ring-2 ring-accent/50 bg-accent/5',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: '8px' }}
        onClick={() => onSelect(node.folder.id)}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag indicator */}
        {isDraggingFile && (
          <div className={cn(
            'absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-colors',
            isDragOver ? 'bg-accent' : 'bg-transparent',
          )} />
        )}

        {/* Expand/Collapse chevron - always shown for folders */}
        <button
          className="shrink-0 p-0.5 hover:text-text-primary"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Folder icon */}
        {isSelected ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-accent" />
        ) : (
          <Folder className="h-4 w-4 shrink-0" />
        )}

        {/* Folder name or rename input */}
        {isRenaming ? (
          <input
            className="flex-1 bg-transparent border-b border-accent text-sm outline-none px-1 min-w-0 text-text-primary"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setRenameValue(node.folder.name);
                setIsRenaming(false);
              }
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-xs font-medium text-left">
            {node.folder.name}
            {fileCount > 0 && (
              <span className="ml-1.5 text-[10px] text-text-tertiary font-normal">
                ({fileCount})
              </span>
            )}
          </span>
        )}

        {/* Inline action buttons (visible on hover) */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            className="p-0.5 rounded hover:bg-bg-tertiary"
            onClick={(e) => { e.stopPropagation(); onCreateFolder(node.folder.id); }}
            title="新建子文件夹"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            className="p-0.5 rounded hover:bg-bg-tertiary"
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
              setRenameValue(node.folder.name);
            }}
            title="重命名"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            className="p-0.5 rounded hover:bg-bg-tertiary text-error"
            onClick={(e) => { e.stopPropagation(); onDeleteFolder(node.folder.id); }}
            title="删除文件夹"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            className="p-0.5 rounded hover:bg-bg-tertiary"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({ folderId: node.folder.id, x: e.clientX, y: e.clientY });
            }}
            title="更多操作"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && contextMenu.folderId === node.folder.id && (
        <FolderContextMenu
          folderId={contextMenu.folderId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={() => {
            setIsRenaming(true);
            setRenameValue(node.folder.name);
          }}
          onDelete={() => onDeleteFolder(node.folder.id)}
          onCreateSubfolder={() => onCreateFolder(node.folder.id)}
        />
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderNode
              key={child.folder.id}
              node={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onDeleteFolder={onDeleteFolder}
              onRenameFolder={onRenameFolder}
              onCreateFolder={onCreateFolder}
              fileCounts={fileCounts}
              isDraggingFile={isDraggingFile}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FolderTree
// ---------------------------------------------------------------------------

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  onSelect,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  fileCounts,
  isDraggingFile,
  onDragEnter,
  onDragLeave,
  onDrop,
}) => {
  const tree = useMemo(() => buildTree(folders), [folders]);

  // Total file count across all folders
  const totalCount = useMemo(() => {
    return Object.values(fileCounts ?? {}).reduce((sum, c) => sum + c, 0);
  }, [fileCounts]);

  return (
    <div className="py-2">
      {/* All Files root item */}
      <button
        className={cn(
          'flex items-center gap-2 w-full rounded-md cursor-pointer px-3 py-1.5 text-sm transition-colors mb-1 select-none',
          selectedFolderId === null
            ? 'bg-accent/10 text-accent'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
        )}
        onClick={() => onSelect(null)}
      >
        <HardDrive className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium flex-1 text-left">全部文件</span>
        {totalCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-tertiary text-text-tertiary font-medium">
            {totalCount > 999 ? '999+' : totalCount}
          </span>
        )}
      </button>

      {/* Folder tree */}
      {tree.map((node) => (
        <FolderNode
          key={node.folder.id}
          node={node}
          depth={0}
          selectedFolderId={selectedFolderId}
          onSelect={onSelect}
          onDeleteFolder={onDeleteFolder}
          onRenameFolder={onRenameFolder}
          onCreateFolder={onCreateFolder}
          fileCounts={fileCounts}
          isDraggingFile={isDraggingFile}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
};
