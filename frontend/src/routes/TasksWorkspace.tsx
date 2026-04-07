import { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';
import { useGetTasksQuery } from '@/store/api/tasksApi';
import { useGetAlertsQuery } from '@/store/api/alertsApi';
import { useGetStreamsQuery } from '@/store/api/streamsApi';
import {
  MetricTile,
  SectionHeader,
  StatusPill,
  WorkspacePanel,
} from '@/components/workspace/WorkspacePrimitives';
import { AIFab, type AIFabAction } from '@/components/layout/AIFab';
import { cn } from '@/lib/utils';

interface WorkspaceTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  dueAt: string;
  sourceType: string;
  sourceId: string;
  summary: string;
}

function adaptApiTask(task: Record<string, unknown>): WorkspaceTask {
  return {
    id: String(task.id ?? ''),
    title: String(task.title ?? ''),
    status: String(task.status ?? '待执行'),
    priority: String(task.priority ?? '中'),
    assignee: String(task.assignee ?? ''),
    dueAt: task.due_date
      ? new Date(task.due_date as string).toLocaleDateString('zh-CN')
      : '—',
    sourceType: String(task.source_type ?? '人工'),
    sourceId: String(task.source_id ?? ''),
    summary: String(task.description ?? ''),
  };
}

export default function TasksWorkspace() {
  const { data: tasksResponse, isLoading: tasksLoading } = useGetTasksQuery({ page_size: 200 });
  const apiTasks: WorkspaceTask[] = (tasksResponse?.data?.items as unknown as Record<string, unknown>[])?.map(adaptApiTask) ?? [];

  const { data: alertsResponse } = useGetAlertsQuery({ page_size: 200 });
  const apiAlerts = (alertsResponse?.data?.items as unknown as Record<string, unknown>[]) ?? [];

  const { data: streamsResponse } = useGetStreamsQuery({ page_size: 200 });
  const apiStreams = (streamsResponse?.data?.items as unknown as Record<string, unknown>[]) ?? [];

  function getSourceSummary(sourceType: string, sourceId: string) {
    if (sourceType === '画面') {
      return String(apiStreams.find((s) => String(s.id) === sourceId)?.name ?? sourceId);
    }
    if (sourceType === '告警') {
      return String(apiAlerts.find((a) => String(a.id) === sourceId)?.title ?? sourceId);
    }
    return '人工发起';
  }

  const [selectedId, setSelectedId] = useState<string>('');
  const selectedTask = apiTasks.find((task) => task.id === selectedId) ?? apiTasks[0] ?? null;

  if (tasksLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-text-secondary">正在加载任务数据…</div>
      </div>
    );
  }

  // AIFab 操作
  const aiActions: AIFabAction[] = useMemo(
    () => [
      {
        label: '拆解当前任务',
        description: selectedTask ? selectedTask.title : undefined,
        tone: 'accent',
        onClick: () =>
          composeOpenClaw({
            prompt: `请拆解任务"${selectedTask?.title ?? ''}"并给出执行顺序。`,
            source: selectedTask?.title,
          }),
      },
      {
        label: '补全任务说明',
        onClick: () =>
          composeOpenClaw({
            prompt: `请补全任务"${selectedTask?.title ?? ''}"的执行说明。`,
            source: selectedTask?.title,
          }),
      },
      {
        label: '回填执行摘要',
        onClick: () =>
          composeOpenClaw({
            prompt: `请为任务"${selectedTask?.title ?? ''}"生成执行摘要。`,
            source: selectedTask?.title,
          }),
      },
    ],
    [selectedTask],
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="待执行" value={apiTasks.filter((task) => task.status === '待执行' || task.status === 'pending').length} helper="优先把高风险任务推进到执行状态" />
        <MetricTile label="进行中" value={apiTasks.filter((task) => task.status === '进行中' || task.status === 'in_progress').length} helper="与值班与运维组保持同步" />
        <MetricTile label="已完成" value={apiTasks.filter((task) => task.status === '已完成' || task.status === 'completed').length} helper="回填摘要后自动归档到事件链" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspacePanel className="min-h-0">
          <SectionHeader
            eyebrow="任务协同"
            title="执行链"
          />
          <div className="mt-4 space-y-3">
            {apiTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedId(task.id)}
                className={cn(
                  'w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-normal',
                  selectedTask?.id === task.id
                    ? 'border-accent/30 bg-accent/10'
                    : 'border-border bg-bg-primary/65 hover:bg-bg-light',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{task.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {task.assignee} · 截止 {task.dueAt}
                    </p>
                  </div>
                  <StatusPill tone={task.priority === '紧急' ? 'danger' : task.priority === '高' ? 'warning' : 'neutral'}>
                    {task.priority}
                  </StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{task.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone="neutral">{task.status}</StatusPill>
                  <StatusPill tone="neutral">{task.sourceType}</StatusPill>
                </div>
              </button>
            ))}
          </div>
        </WorkspacePanel>

        <aside className="min-h-0 flex flex-col gap-4">
          <WorkspacePanel>
            <SectionHeader
              title={selectedTask?.title ?? '暂无任务'}
              description={selectedTask?.summary ?? '请选择左侧任务。'}
            />
            {selectedTask ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone="neutral">{selectedTask.status}</StatusPill>
                  <StatusPill tone={selectedTask.priority === '紧急' ? 'danger' : 'warning'}>
                    {selectedTask.priority}
                  </StatusPill>
                </div>
                <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                  <p className="text-xs font-semibold tracking-[0.14em] text-text-tertiary">来源对象</p>
                  <p className="mt-2 text-sm leading-6 text-text-primary">
                    {getSourceSummary(selectedTask.sourceType, selectedTask.sourceId)}
                  </p>
                </div>
              </div>
            ) : null}
          </WorkspacePanel>

          <WorkspacePanel className="min-h-0 flex-1">
            <SectionHeader
              title="任务协同说明"
              description="智能协同负责把来源对象、任务目标与执行结果重新串起来，减少手工整理。"
            />
            <div className="mt-4 space-y-3">
              {[
                '补全执行步骤',
                '整理交班信息',
                '生成任务复盘',
              ].map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() =>
                    composeOpenClaw({
                      prompt: `${action}：${selectedTask?.title ?? '当前任务'}`,
                      source: selectedTask?.title,
                    })
                  }
                  className="w-full rounded-[18px] bg-bg-primary px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-light"
                >
                  {action}
                </button>
              ))}

              <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-text-primary">协同提示</span>
                </div>
                <p className="text-sm leading-6 text-text-secondary">
                  当前任务默认继承来源对象的上下文，不需要在多个页面重复录入背景信息。
                </p>
              </div>
            </div>
          </WorkspacePanel>
        </aside>
      </div>

      {/* AI 浮动操作按钮 */}
      <AIFab actions={aiActions} />
    </div>
  );
}
