import React, { useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onUpload: (files: FileList) => void;
  uploading?: boolean;
  multiple?: boolean;
  accept?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  uploading = false,
  multiple = true,
  accept,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files);
      }
    },
    [onUpload],
  );

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer',
        isDragging
          ? 'border-accent bg-accent/5'
          : 'border-border hover:border-accent/50 hover:bg-bg-hover',
        uploading && 'pointer-events-none opacity-50',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
      />
      <Upload className={cn('mx-auto h-8 w-8 mb-2', isDragging ? 'text-accent' : 'text-text-tertiary')} />
      <p className="text-sm font-medium text-text-primary">
        {uploading ? '上传中...' : '拖拽文件到这里，或点击选择文件'}
      </p>
      <p className="mt-1 text-xs text-text-tertiary">支持图片、视频、文档，单文件最大 100MB</p>
    </div>
  );
};
