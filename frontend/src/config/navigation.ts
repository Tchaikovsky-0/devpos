import type { LucideIcon } from 'lucide-react';
import {
  FolderKanban,
  Radar,
  ShieldCheck,
  Siren,
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
    description: '',
    path: '/center',
    aliases: ['/'],
    icon: Radar,
  },
  {
    id: 'media',
    label: '媒体库',
    description: '',
    path: '/media',
    aliases: ['/media-library', '/reports', '/gallery', '/tasks', '/assets'],
    icon: FolderKanban,
  },
  {
    id: 'alerts',
    label: '告警处置',
    description: '',
    path: '/alerts',
    icon: Siren,
  },
  {
    id: 'system',
    label: '系统管理',
    description: '',
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
