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
  MonitorPlay,
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
    id: 'monitor',
    label: '视频流监控',
    description: '视频流管理与 YOLO 检测',
    path: '/monitor',
    icon: MonitorPlay,
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
    description: '图片浏览与管理',
    path: '/gallery',
    icon: Image,
  },
  {
    id: 'alerts',
    label: '告警处置',
    description: '告警分析与处置',
    path: '/alerts',
    icon: Siren,
  },
  {
    id: 'assets',
    label: '设备资产',
    description: '设备管理与诊断',
    path: '/assets',
    icon: HardDrive,
  },
  {
    id: 'tasks',
    label: '任务协同',
    description: '任务管理与执行',
    path: '/tasks',
    icon: ClipboardList,
  },
  {
    id: 'openclaw',
    label: 'OpenClaw',
    description: 'AI 助手与自动化',
    path: '/openclaw',
    icon: Bot,
  },
  {
    id: 'system',
    label: '系统管理',
    description: '系统配置与管理',
    path: '/system',
    aliases: ['/settings', '/admin'],
    icon: ShieldCheck,
  },
];

function normalizePath(pathname: string) {
  if (!pathname) {
    return '/center';
  }

  if (pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function findModuleForPath(pathname: string): NavigationModule {
  const normalizedPath = normalizePath(pathname);

  return (
    navigationModules.find((module) => {
      const paths = [module.path, ...(module.aliases ?? [])];
      return paths.some((path) =>
        normalizedPath === path || normalizedPath.startsWith(`${path}/`),
      );
    }) ?? navigationModules[0]
  );
}
