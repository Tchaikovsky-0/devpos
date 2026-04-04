import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  ClipboardList,
  FolderKanban,
  Radar,
  ServerCog,
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
    label: '监控中枢',
    description: '视频值守、异常研判、资料追溯与任务发布。',
    path: '/center',
    aliases: ['/', '/monitor', '/dashboard'],
    icon: Radar,
  },
  {
    id: 'media',
    label: '媒体库',
    description: '资料目录、取证回看、报告归档与权限管理。',
    path: '/media',
    aliases: ['/media-library', '/gallery', '/reports'],
    icon: FolderKanban,
  },
  {
    id: 'alerts',
    label: '告警处置',
    description: '事件优先级、处置链、升级建议与交接摘要。',
    path: '/alerts',
    icon: Siren,
  },
  {
    id: 'tasks',
    label: '任务协同',
    description: '人工任务与智能派单统一进入同一条执行链。',
    path: '/tasks',
    icon: ClipboardList,
  },
  {
    id: 'assets',
    label: '资产设备',
    description: '设备台账、健康度、诊断结果与维护窗口。',
    path: '/assets',
    aliases: ['/sensors'],
    icon: ServerCog,
  },
  {
    id: 'openclaw',
    label: '智能协同',
    description: '跨模块任务、知识检索、自动化模板与历史编排。',
    path: '/openclaw',
    aliases: ['/ai', '/command'],
    icon: Bot,
  },
  {
    id: 'system',
    label: '系统管理',
    description: '用户权限、策略治理、AI 配置与审计说明。',
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

