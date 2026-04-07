import React from 'react';
import { Video, Image, FileText, Music, File } from 'lucide-react';
import type { MediaItem } from '../../types/api/media';

/**
 * 格式化媒体文件日期（中文本地化显示）
 */
export function formatMediaDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * 根据文件类型返回对应图标
 */
export function getFileIcon(type: MediaItem['type']): React.ReactNode {
  switch (type) {
    case 'video':
      return <Video className="w-5 h-5 text-blue-400" />;
    case 'image':
      return <Image className="w-5 h-5 text-green-400" />;
    case 'audio':
      return <Music className="w-5 h-5 text-purple-400" />;
    case 'document':
      return <FileText className="w-5 h-5 text-orange-400" />;
    default:
      return <File className="w-5 h-5 text-text-secondary" />;
  }
}
