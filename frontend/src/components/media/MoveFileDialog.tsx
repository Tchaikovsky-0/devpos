import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FolderItem } from '@/store/api/mediaApi';

interface MoveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderItem[];
  selectedTargetId: number | null;
  onSelectTarget: (id: number | null) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const MoveFileDialog: React.FC<MoveFileDialogProps> = ({
  open,
  onOpenChange,
  folders,
  selectedTargetId,
  onSelectTarget,
  onConfirm,
  loading = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>移动到文件夹</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 max-h-60 overflow-y-auto space-y-1">
          <button
            className={cn(
              'flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm transition-colors',
              selectedTargetId === null ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-hover',
            )}
            onClick={() => onSelectTarget(null)}
          >
            <Folder className="h-4 w-4" />
            <span>根目录</span>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={cn(
                'flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm transition-colors',
                selectedTargetId === folder.id ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-hover',
              )}
              onClick={() => onSelectTarget(folder.id)}
            >
              <Folder className="h-4 w-4" />
              <span>{folder.name}</span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onConfirm} loading={loading}>确认移动</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
