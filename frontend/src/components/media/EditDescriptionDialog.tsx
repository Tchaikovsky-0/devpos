import React, { useState, useCallback } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { useUpdateMediaMutation } from '@/store/api/mediaApi';

interface MediaItem {
  id: number;
  original_name: string;
  description?: string;
}

interface EditDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: MediaItem | null;
}

export const EditDescriptionDialog: React.FC<EditDescriptionDialogProps> = ({
  open,
  onOpenChange,
  file,
}) => {
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [updateMediaApi] = useUpdateMediaMutation();

  React.useEffect(() => {
    if (file) {
      setDescription(file.description ?? '');
    }
  }, [file]);

  const handleSave = useCallback(async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      await updateMediaApi({ id: file.id, body: { description: description.trim() || undefined } }).unwrap();
      onOpenChange(false);
    } catch {
      // silently fail - dialog stays open
    } finally {
      setIsSaving(false);
    }
  }, [file, description, updateMediaApi, onOpenChange]);

  const handleClose = () => {
    setDescription('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            编辑文件描述
          </AlertDialogTitle>
        </AlertDialogHeader>

        {file && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">{file.original_name}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">描述内容</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入文件描述（选填）"
                rows={3}
                maxLength={500}
                className={cn(
                  'w-full rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary',
                  'placeholder:text-text-tertiary outline-none transition-colors resize-none',
                  'focus:border-accent/40',
                )}
              />
              <p className="text-xs text-text-tertiary text-right">{description.length}/500</p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>取消</AlertDialogCancel>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
