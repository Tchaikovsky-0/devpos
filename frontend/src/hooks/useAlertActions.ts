import { useCallback } from 'react';
import {
  useUpdateAlertMutation,
  useResolveAlertMutation,
  useAcknowledgeAlertMutation,
} from '../store/api/alertsApi';

export type AlertActionType = 'acknowledge' | 'ignore' | 'resolve';

interface UseAlertActionsParams {
  selectedId: string | null;
  selectNext: () => void;
}

interface UseAlertActionsReturn {
  handleAction: (action: AlertActionType) => Promise<void>;
}

/**
 * useAlertActions — 告警操作 Hook
 * 使用 RTK Query mutations 执行 acknowledge / ignore / resolve 操作
 * RTK Query 的 invalidatesTags 会自动刷新列表缓存
 */
export function useAlertActions({
  selectedId,
  selectNext,
}: UseAlertActionsParams): UseAlertActionsReturn {
  const [updateAlert] = useUpdateAlertMutation();
  const [resolveAlert] = useResolveAlertMutation();
  const [acknowledgeAlert] = useAcknowledgeAlertMutation();

  const handleAction = useCallback(async (action: AlertActionType): Promise<void> => {
    if (!selectedId) return;

    try {
      switch (action) {
        case 'acknowledge':
          await acknowledgeAlert(selectedId).unwrap();
          break;
        case 'resolve':
          await resolveAlert(selectedId).unwrap();
          break;
        case 'ignore':
          await updateAlert({
            id: selectedId,
            data: { status: 'false_alarm', acknowledged: true },
          }).unwrap();
          break;
      }
    } catch (err) {
      console.error('更新告警状态失败:', err);
      // RTK Query 会自动处理缓存失效和重新请求，无需手动回滚
    }

    // 自动选择下一个
    selectNext();
  }, [selectedId, selectNext, updateAlert, resolveAlert, acknowledgeAlert]);

  return { handleAction };
}
