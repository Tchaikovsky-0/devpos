/**
 * 应用加载状态管理Hook
 * 
 * 管理应用初始化流程：
 * 1. 主题初始化
 * 2. 用户认证检查
 * 3. 基础数据加载（租户配置、告警数据等）
 * 4. 进度跟踪
 * 
 * 注意：此hook设计为"尽力加载"模式，即使API请求失败也会完成加载
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGetTenantConfigQuery } from '@/store/api/tenantConfigApi';
import { useGetAlertsQuery } from '@/store/api/alertsApi';
import { useGetStreamsQuery } from '@/store/api/streamsApi';

interface LoadingStage {
  id: string;
  label: string;
  weight: number;
}

const LOADING_STAGES: LoadingStage[] = [
  { id: 'theme', label: '正在加载主题...', weight: 10 },
  { id: 'auth', label: '正在验证身份...', weight: 20 },
  { id: 'tenant', label: '正在加载租户配置...', weight: 25 },
  { id: 'alerts', label: '正在同步告警数据...', weight: 25 },
  { id: 'streams', label: '正在初始化视频流...', weight: 20 },
];

// 最大加载时间（毫秒），超过此时间强制完成加载
const MAX_LOADING_TIME = 5000;

interface UseAppLoaderReturn {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 当前加载进度 0-100 */
  progress: number;
  /** 当前状态文本 */
  statusText: string;
  /** 是否加载出错 */
  hasError: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 重试加载 */
  retry: () => void;
}

/**
 * 应用加载状态管理
 * 
 * @example
 * const { isLoading, progress, statusText } = useAppLoader();
 * 
 * return (
 *   <>
 *     <SplashScreen 
 *       isLoading={isLoading} 
 *       progress={progress}
 *       statusText={statusText}
 *     />
 *     {!isLoading && <App />}
 *   </>
 * );
 */
export const useAppLoader = (): UseAppLoaderReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('正在启动巡检宝...');
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const currentStageRef = useRef(0);
  const completedStagesRef = useRef<Set<string>>(new Set());
  const startTimeRef = useRef(Date.now());
  const forceCompleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // RTK Query hooks - 使用skip选项控制查询时机，并设置轮询超时
  const [skipQueries, setSkipQueries] = useState(false);
  
  const { 
    isLoading: isTenantLoading, 
    isError: isTenantError,
    error: tenantError,
    refetch: refetchTenant 
  } = useGetTenantConfigQuery(undefined, {
    skip: skipQueries,
    pollingInterval: 0,
  });
  
  const { 
    isLoading: isAlertsLoading,
    isError: isAlertsError,
    error: alertsError,
    refetch: refetchAlerts 
  } = useGetAlertsQuery({ page_size: 200 }, {
    skip: skipQueries,
    pollingInterval: 0,
  });
  
  const {
    isLoading: isStreamsLoading,
    isError: isStreamsError,
    error: streamsError,
    refetch: refetchStreams
  } = useGetStreamsQuery(undefined, {
    skip: skipQueries,
    pollingInterval: 0,
  });

  // 计算当前进度
  const calculateProgress = useCallback(() => {
    const completedWeight = Array.from(completedStagesRef.current).reduce((sum, stageId) => {
      const stage = LOADING_STAGES.find(s => s.id === stageId);
      return sum + (stage?.weight || 0);
    }, 0);
    
    // 当前阶段的进度
    const currentStage = LOADING_STAGES[currentStageRef.current];
    if (currentStage && !completedStagesRef.current.has(currentStage.id)) {
      const stageProgress = getStageProgress(currentStage.id);
      return Math.min(99, completedWeight + currentStage.weight * stageProgress);
    }
    
    return Math.min(99, completedWeight);
  }, []);

  // 获取各阶段加载进度
  const getStageProgress = (stageId: string): number => {
    switch (stageId) {
      case 'theme':
        return 1; // 主题立即完成
      case 'auth':
        return 1; // 认证检查立即完成（由路由守卫处理）
      case 'tenant':
        return isTenantLoading ? 0.5 : 1;
      case 'alerts':
        return isAlertsLoading ? 0.5 : 1;
      case 'streams':
        return isStreamsLoading ? 0.5 : 1;
      default:
        return 0;
    }
  };

  // 更新状态文本
  const updateStatusText = useCallback(() => {
    const currentStage = LOADING_STAGES[currentStageRef.current];
    if (currentStage) {
      setStatusText(currentStage.label);
    }
  }, []);

  // 强制完成定时器 - 防止API请求卡住导致无法进入主界面
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    forceCompleteTimerRef.current = setTimeout(() => {
      console.log('[useAppLoader] 强制完成加载（超时）');
      // 标记所有阶段完成
      LOADING_STAGES.forEach(stage => {
        completedStagesRef.current.add(stage.id);
      });
      currentStageRef.current = LOADING_STAGES.length;
      setProgress(100);
      setStatusText('加载完成');
      setIsLoading(false);
    }, MAX_LOADING_TIME);

    return () => {
      if (forceCompleteTimerRef.current) {
        clearTimeout(forceCompleteTimerRef.current);
      }
    };
  }, []);

  // 检查阶段完成状态
  useEffect(() => {
    // 如果已经强制完成，不再处理
    if (!isLoading && completedStagesRef.current.size === LOADING_STAGES.length) {
      return;
    }

    const checkStages = () => {
      // 主题阶段
      if (!completedStagesRef.current.has('theme')) {
        completedStagesRef.current.add('theme');
        currentStageRef.current = 1;
      }

      // 认证阶段（简化处理，实际由路由守卫处理）
      if (!completedStagesRef.current.has('auth')) {
        completedStagesRef.current.add('auth');
        currentStageRef.current = 2;
      }

      // 租户配置阶段（如果出错也视为完成）
      if ((!isTenantLoading || isTenantError) && !completedStagesRef.current.has('tenant')) {
        completedStagesRef.current.add('tenant');
        currentStageRef.current = 3;
      }

      // 告警数据阶段（如果出错也视为完成）
      if ((!isAlertsLoading || isAlertsError) && !completedStagesRef.current.has('alerts')) {
        completedStagesRef.current.add('alerts');
        currentStageRef.current = 4;
      }

      // 视频流阶段（如果出错也视为完成）
      if ((!isStreamsLoading || isStreamsError) && !completedStagesRef.current.has('streams')) {
        completedStagesRef.current.add('streams');
        currentStageRef.current = 5;
      }

      // 更新进度和状态文本
      setProgress(calculateProgress());
      updateStatusText();

      // 检查是否全部完成
      if (completedStagesRef.current.size === LOADING_STAGES.length) {
        // 清除强制完成定时器
        if (forceCompleteTimerRef.current) {
          clearTimeout(forceCompleteTimerRef.current);
          forceCompleteTimerRef.current = null;
        }
        
        // 延迟一点完成，让用户看到100%
        setTimeout(() => {
          setProgress(100);
          setStatusText('加载完成');
          setTimeout(() => {
            setIsLoading(false);
          }, 300);
        }, 200);
      }
    };

    checkStages();
  }, [isTenantLoading, isAlertsLoading, isStreamsLoading, isTenantError, isAlertsError, isStreamsError, calculateProgress, updateStatusText, isLoading]);

  // 错误处理 - 仅记录错误，不阻止加载流程
  useEffect(() => {
    if (isTenantError || isAlertsError || isStreamsError) {
      console.warn('[useAppLoader] API请求出错:', { 
        tenant: isTenantError ? tenantError : null, 
        alerts: isAlertsError ? alertsError : null, 
        streams: isStreamsError ? streamsError : null 
      });
      // 不设置hasError，让加载流程继续
      // 实际错误处理由各个页面组件自行处理
    }
  }, [isTenantError, isAlertsError, isStreamsError, tenantError, alertsError, streamsError]);

  // 重试函数
  const retry = useCallback(() => {
    setHasError(false);
    setError(null);
    setIsLoading(true);
    setProgress(0);
    setStatusText('正在启动巡检宝...');
    currentStageRef.current = 0;
    completedStagesRef.current.clear();
    startTimeRef.current = Date.now();
    setSkipQueries(false);
    
    // 重新设置强制完成定时器
    if (forceCompleteTimerRef.current) {
      clearTimeout(forceCompleteTimerRef.current);
    }
    forceCompleteTimerRef.current = setTimeout(() => {
      console.log('[useAppLoader] 强制完成加载（超时）');
      LOADING_STAGES.forEach(stage => {
        completedStagesRef.current.add(stage.id);
      });
      currentStageRef.current = LOADING_STAGES.length;
      setProgress(100);
      setStatusText('加载完成');
      setIsLoading(false);
    }, MAX_LOADING_TIME);
    
    // 重新获取数据
    refetchTenant();
    refetchAlerts();
    refetchStreams();
  }, [refetchTenant, refetchAlerts, refetchStreams]);

  return {
    isLoading,
    progress,
    statusText,
    hasError,
    error,
    retry,
  };
};

export default useAppLoader;
