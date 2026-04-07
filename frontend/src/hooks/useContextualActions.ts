/**
 * OpenClaw 智能操作建议系统
 * 
 * 根据当前上下文自动生成智能操作建议
 */

import { useMemo } from 'react';
import { useOpenClawContext } from '@/store/contexts/OpenClawContext';
import type { QuickAction } from '@/store/contexts/OpenClawContext';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';

/**
 * 操作建议类型
 */
export type ActionTone = 'accent' | 'neutral' | 'warning' | 'success' | 'danger';

/**
 * 操作建议接口
 */
export interface ContextualAction {
  id: string;
  label: string;
  prompt: string;
  tone?: ActionTone;
  enabled?: boolean;
  category?: 'analysis' | 'creation' | 'navigation' | 'execution';
  shortcut?: string;
}

/**
 * 生成视频流相关的操作建议
 */
function generateStreamActions(
  _streamId: string,
  streamName: string,
  metadata?: Record<string, unknown>
): ContextualAction[] {
  const location = metadata?.location as string || '未知位置';
  const status = metadata?.status as string || 'unknown';

  return [
    {
      id: 'stream-analyze',
      label: '研判当前画面',
      prompt: `请先研判视频流「${streamName}」(${location})的当前画面，并解释需要优先关注的风险。`,
      tone: 'accent',
      category: 'analysis',
    },
    {
      id: 'stream-alerts',
      label: '查看告警上下文',
      prompt: `请分析视频流「${streamName}」的告警情况，检查是否有需要优先处理的紧急告警。`,
      tone: status === 'warning' ? 'warning' : 'neutral',
      category: 'analysis',
    },
    {
      id: 'stream-record',
      label: '调取关联录像',
      prompt: `请搜索视频流「${streamName}」最近的录像片段，查找相关事件记录。`,
      tone: 'neutral',
      category: 'navigation',
    },
    {
      id: 'stream-task',
      label: '创建巡检任务',
      prompt: `请为视频流「${streamName}」创建一个定时巡检任务，设置合适的巡检频率和关注点。`,
      tone: 'neutral',
      category: 'creation',
    },
  ];
}

/**
 * 生成告警相关的操作建议
 */
function generateAlertActions(
  _alertId: string,
  alertTitle: string,
  metadata?: Record<string, unknown>
): ContextualAction[] {
  const level = metadata?.level as string || '一般';
  const status = metadata?.status as string || '待处置';
  const location = metadata?.location as string || '未知位置';

  return [
    {
      id: 'alert-analyze',
      label: '分析告警根因',
      prompt: `请分析告警「${alertTitle}」(等级: ${level}, 位置: ${location})的根因，并提供处置建议。`,
      tone: level === '紧急' || level === '高危' ? 'danger' : 'warning',
      category: 'analysis',
    },
    {
      id: 'alert-handle',
      label: '生成处置建议',
      prompt: `请为告警「${alertTitle}」生成一套详细的处置建议，包括操作步骤和注意事项。`,
      tone: 'accent',
      category: 'analysis',
    },
    {
      id: 'alert-handover',
      label: '补全交接摘要',
      prompt: `请为告警「${alertTitle}」生成交接摘要，方便后续人员快速了解情况并继续处置。`,
      tone: 'neutral',
      category: 'creation',
    },
    {
      id: 'alert-link',
      label: '关联任务处置',
      prompt: `请为告警「${alertTitle}」创建一个处置任务，并关联到相关视频流进行持续跟踪。`,
      tone: status === '待处置' ? 'warning' : 'neutral',
      category: 'creation',
    },
  ];
}

/**
 * 生成任务相关的操作建议
 */
function generateTaskActions(
  _taskId: string,
  taskName: string,
  metadata?: Record<string, unknown>
): ContextualAction[] {
  const status = metadata?.status as string || '待执行';
  const assignee = metadata?.assignee as string || '未分配';

  return [
    {
      id: 'task-analyze',
      label: '分析任务优先级',
      prompt: `请分析任务「${taskName}」(状态: ${status}, 负责人: ${assignee})的执行优先级和资源需求。`,
      tone: 'accent',
      category: 'analysis',
    },
    {
      id: 'task-detail',
      label: '补全任务说明',
      prompt: `请为任务「${taskName}」补全详细的执行说明，包括具体步骤和验收标准。`,
      tone: 'neutral',
      category: 'creation',
    },
    {
      id: 'task-summary',
      label: '回填执行摘要',
      prompt: `请为已完成的任务「${taskName}」生成执行摘要，总结完成情况和发现的问题。`,
      tone: status === '已完成' ? 'success' : 'neutral',
      category: 'execution',
    },
  ];
}

/**
 * 生成资产相关的操作建议
 */
function generateAssetActions(
  _assetId: string,
  assetName: string,
  metadata?: Record<string, unknown>
): ContextualAction[] {
  const status = metadata?.status as string || 'unknown';
  const health = metadata?.health as number || 0;

  return [
    {
      id: 'asset-diagnosis',
      label: '诊断当前设备',
      prompt: `请诊断设备「${assetName}」(状态: ${status}, 健康度: ${health}%)的当前状态，识别潜在风险。`,
      tone: health < 60 ? 'danger' : health < 85 ? 'warning' : 'accent',
      category: 'analysis',
    },
    {
      id: 'asset-predict',
      label: '预测维护窗口',
      prompt: `请为设备「${assetName}」预测下一个维护窗口，提供维护建议和备件清单。`,
      tone: 'neutral',
      category: 'analysis',
    },
    {
      id: 'asset-qa',
      label: '生成运维问答',
      prompt: `请围绕设备「${assetName}」的运维场景生成一组问答，用于培训或知识积累。`,
      tone: 'neutral',
      category: 'creation',
    },
  ];
}

/**
 * useContextualActions Hook
 * 
 * 根据当前上下文自动生成操作建议
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const actions = useContextualActions();
 *   
 *   return (
 *     <div>
 *       {actions.map(action => (
 *         <button onClick={() => composeOpenClaw({ prompt: action.prompt })}>
 *           {action.label}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useContextualActions(): ContextualAction[] {
  const { currentObject } = useOpenClawContext();

  return useMemo(() => {
    if (!currentObject) {
      return [];
    }

    const { id, type, name, metadata } = currentObject;

    switch (type) {
      case 'stream':
        return generateStreamActions(id, name, metadata);
      
      case 'alert':
        return generateAlertActions(id, name, metadata);
      
      case 'task':
        return generateTaskActions(id, name, metadata);
      
      case 'asset':
        return generateAssetActions(id, name, metadata);
      
      default:
        return [];
    }
  }, [currentObject]);
}

/**
 * useQuickActions Hook
 * 
 * 获取当前模块的快捷操作建议
 */
export function useQuickActions(): ContextualAction[] {
  const { currentModule } = useOpenClawContext();

  return useMemo(() => {
    const baseActions: Record<string, ContextualAction[]> = {
      center: [
        {
          id: 'quick-analyze-all',
          label: '分析全局态势',
          prompt: '请分析当前监控全局态势，识别主要风险点和异常区域。',
          tone: 'accent',
          category: 'analysis',
        },
        {
          id: 'quick-alerts',
          label: '汇总待处理告警',
          prompt: '请汇总当前所有待处理的告警，按优先级排序并提供处置建议。',
          tone: 'warning',
          category: 'navigation',
        },
      ],
      media: [
        {
          id: 'quick-search',
          label: '智能搜索资料',
          prompt: '请帮我搜索今天的的新增资料，查找与当前关注事件相关的内容。',
          tone: 'accent',
          category: 'navigation',
        },
        {
          id: 'quick-organize',
          label: '整理事件链路',
          prompt: '请整理当前选中事件的完整资料链路，生成取证说明。',
          tone: 'neutral',
          category: 'creation',
        },
      ],
      alerts: [
        {
          id: 'quick-analyze-batch',
          label: '批量分析告警',
          prompt: '请批量分析当前告警列表，识别共性根因和系统性风险。',
          tone: 'accent',
          category: 'analysis',
        },
        {
          id: 'quick-handover',
          label: '生成交接摘要',
          prompt: '请生成今日告警处置的交接摘要，方便下一班人员快速了解情况。',
          tone: 'neutral',
          category: 'creation',
        },
      ],
      tasks: [
        {
          id: 'quick-dispatch',
          label: '拆解当前待办',
          prompt: '请拆解当前选中的复杂任务为可执行的子任务，并设置优先级。',
          tone: 'accent',
          category: 'execution',
        },
        {
          id: 'quick-summary',
          label: '回填执行摘要',
          prompt: '请为已完成的任务回填执行摘要，总结关键发现和建议。',
          tone: 'neutral',
          category: 'execution',
        },
      ],
      assets: [
        {
          id: 'quick-diagnosis',
          label: '诊断当前设备',
          prompt: '请诊断当前选中设备的运行状态，预测可能的故障时间窗口。',
          tone: 'accent',
          category: 'analysis',
        },
        {
          id: 'quick-maintenance',
          label: '规划维护计划',
          prompt: '请基于设备健康度预测结果，规划近期维护计划。',
          tone: 'neutral',
          category: 'creation',
        },
      ],
      system: [
        {
          id: 'quick-config',
          label: '解释当前策略',
          prompt: '请解释当前系统配置策略对监控效果的影响。',
          tone: 'neutral',
          category: 'analysis',
        },
        {
          id: 'quick-audit',
          label: '生成审计说明',
          prompt: '请生成近期系统变更的审计说明，用于合规记录。',
          tone: 'neutral',
          category: 'creation',
        },
      ],
    };

    return baseActions[currentModule] || [];
  }, [currentModule]);
}

/**
 * 将 ContextualAction 转换为 QuickAction
 */
export function contextualToQuickAction(
  action: ContextualAction,
  onClick?: () => void
): QuickAction {
  return {
    id: action.id,
    label: action.label,
    prompt: action.prompt,
    tone: action.tone as 'accent' | 'neutral' | 'warning',
    enabled: action.enabled !== false,
    onClick: onClick || (() => composeOpenClaw({ prompt: action.prompt })),
  };
}

/**
 * 执行操作建议
 */
export function executeAction(action: ContextualAction | QuickAction) {
  const prompt = 'prompt' in action ? action.prompt : '';
  composeOpenClaw({ prompt });
}
