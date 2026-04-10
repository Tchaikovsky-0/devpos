import type { LucideIcon } from 'lucide-react';
import {
  FolderKanban,
  Radar,
  ShieldCheck,
  Siren,
  Bot,
  ClipboardList,
  HardDrive,
  Image,
} from 'lucide-react';

export interface NavigationModule {
  id: string;
  label: string;
  description: string;
  path: string;
  aliases?: string[];
  icon: LucideIcon;
}

export const navigationModules: NavigationModule[] = [
  {
    id: 'center',
    label: '监控大屏',
    description: '实时视频监控与态势感知',
    path: '/center',
    aliases: ['/dashboard', '/'],
    icon: Radar,
  },
  {
    id: 'media',
    label: '媒体库',
    description: '文件存储、标注与取证',
    path: '/media',
    aliases: ['/media-library'],
    icon: FolderKanban,
  },
  {
    id: 'gallery',
    label: '图片库',
    description: '图片