/**
 * OpenClaw 上下文感知系统
 * 
 * 核心理念：让 AI 理解用户当前的工作环境，
 * 提供智能、无缝的协同体验
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

/**
 * 上下文对象类型定义
 */
export type ContextObjectType = 
  | 'stream'      // 视频流
  | 'alert'       // 告警
  | 'task'        // 任务
  | 'asset'       // 资产设备
  | 'media'       // 媒体文件
  | 'report'      // 报告
  | 'workspace'   // 工作区
  | null;

/**
 * 上下文对象接口
 */
export interface ContextObject {
  id: string;
  type: ContextObjectType;
  name: string;
  metadata: Record<string, unknown>;
  relatedIds?: string[];
}

/**
 * OpenClaw 上下文接口
 */
export interface OpenClawContextValue {
  // 当前模块
  currentModule: string;
  setCurrentModule: (module: string) => void;

  // 当前对象
  currentObject: ContextObject | null;
  setCurrentObject: (object: ContextObject | null) => void;

  // 关联对象
  relatedObjects: ContextObject[];
  addRelatedObject: (object: ContextObject) => void;
  removeRelatedObject: (id: string) => void;
  clearRelatedObjects: () => void;

  // 上下文历史（用于跨模块传递）
  contextHistory: ContextObject[];
  pushToHistory: (object: ContextObject) => void;
  restoreFromHistory: (index: number) => void;

  // 快捷操作
  quickActions: QuickAction[];
  addQuickAction: (action: QuickAction) => void;
  removeQuickAction: (id: string) => void;

  // 面板状态
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;

  // 上下文描述
  contextSummary: string;
  getContextDescription: () => string;
}

/**
 * 快捷操作接口
 */
export interface QuickAction {
  id: string;
  label: string;
  icon?: ReactNode;
  prompt: string;
  tone?: 'accent' | 'neutral' | 'warning';
  enabled?: boolean;
  onClick?: () => void;
}

/**
 * 创建初始上下文
 */
function createInitialContext(): OpenClawContextValue {
  return {
    currentModule: 'center',
    setCurrentModule: () => {},
    currentObject: null,
    setCurrentObject: () => {},
    relatedObjects: [],
    addRelatedObject: () => {},
    removeRelatedObject: () => {},
    clearRelatedObjects: () => {},
    contextHistory: [],
    pushToHistory: () => {},
    restoreFromHistory: () => {},
    quickActions: [],
    addQuickAction: () => {},
    removeQuickAction: () => {},
    isPanelOpen: false,
    setIsPanelOpen: () => {},
    contextSummary: '',
    getContextDescription: () => '',
  };
}

// 创建 Context
const OpenClawContext = createContext<OpenClawContextValue>(createInitialContext());

/**
 * OpenClaw Provider 组件
 * 
 * @param children - 子组件
 * 
 * 使用示例：
 * ```tsx
 * <OpenClawProvider>
 *   <App />
 * </OpenClawProvider>
 * ```
 */
export function OpenClawProvider({ children }: { children: ReactNode }) {
  const [currentModule, setCurrentModule] = useState('center');
  const [currentObject, setCurrentObject] = useState<ContextObject | null>(null);
  const [relatedObjects, setRelatedObjects] = useState<ContextObject[]>([]);
  const [contextHistory, setContextHistory] = useState<ContextObject[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // 添加关联对象
  const addRelatedObject = useCallback((object: ContextObject) => {
    setRelatedObjects((prev) => {
      // 避免重复添加
      if (prev.some((obj) => obj.id === object.id)) {
        return prev;
      }
      // 限制最多 10 个关联对象
      return [...prev.slice(-9), object];
    });
  }, []);

  // 移除关联对象
  const removeRelatedObject = useCallback((id: string) => {
    setRelatedObjects((prev) => prev.filter((obj) => obj.id !== id));
  }, []);

  // 清空调关联对象
  const clearRelatedObjects = useCallback(() => {
    setRelatedObjects([]);
  }, []);

  // 推入历史记录
  const pushToHistory = useCallback((object: ContextObject) => {
    setContextHistory((prev) => {
      // 避免重复
      if (prev[prev.length - 1]?.id === object.id) {
        return prev;
      }
      // 限制历史记录最多 20 条
      return [...prev.slice(-19), object];
    });
  }, []);

  // 从历史记录恢复
  const restoreFromHistory = useCallback((index: number) => {
    const target = contextHistory[index];
    if (target) {
      setCurrentObject(target);
      // 清除该索引之后的历史
      setContextHistory((prev) => prev.slice(0, index + 1));
    }
  }, [contextHistory]);

  // 添加快捷操作
  const addQuickAction = useCallback((action: QuickAction) => {
    setQuickActions((prev) => {
      if (prev.some((a) => a.id === action.id)) {
        return prev.map((a) => (a.id === action.id ? action : a));
      }
      return [...prev, action];
    });
  }, []);

  // 移除快捷操作
  const removeQuickAction = useCallback((id: string) => {
    setQuickActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // 生成上下文描述
  const contextSummary = useMemo(() => {
    const parts: string[] = [];

    if (currentModule) {
      const moduleNames: Record<string, string> = {
        center: '监控大屏',
        media: '媒体库',
        gallery: '航拍图库',
        alerts: '告警处置',
        tasks: '任务协同',
        assets: '资产设备',
        openclaw: '智能协同',
        system: '系统管理',
      };
      parts.push(`当前在 ${moduleNames[currentModule] || currentModule}`);
    }

    if (currentObject) {
      parts.push(`正在查看 ${currentObject.name}`);
    }

    if (relatedObjects.length > 0) {
      parts.push(`关联 ${relatedObjects.length} 个对象`);
    }

    return parts.join('，') || '暂无上下文';
  }, [currentModule, currentObject, relatedObjects]);

  // 获取完整的上下文描述
  const getContextDescription = useCallback(() => {
    const descriptions: string[] = [];

    if (currentObject) {
      const typeNames: Record<string, string> = {
        stream: '视频流',
        alert: '告警',
        task: '任务',
        asset: '资产',
        media: '媒体',
        report: '报告',
        workspace: '工作区',
        null: '未知对象',
      };

      const objectType = currentObject.type ?? 'null';
      descriptions.push(`当前对象：${typeNames[objectType] || objectType}「${currentObject.name}」`);

      // 添加元数据描述
      if (currentObject.metadata && typeof currentObject.metadata === 'object') {
        const metaEntries = Object.entries(currentObject.metadata)
          .filter(([, value]) => value !== undefined && value !== null)
          .slice(0, 3) // 最多显示 3 个
          .map(([key, value]) => `${key}: ${value}`);

        if (metaEntries.length > 0) {
          descriptions.push(`详细信息：${metaEntries.join('，')}`);
        }
      }
    }

    if (relatedObjects.length > 0) {
      const relatedSummary = relatedObjects
        .slice(0, 3)
        .map((obj) => `${obj.name}`)
        .join('、');

      descriptions.push(`关联对象：${relatedSummary}${relatedObjects.length > 3 ? `等${relatedObjects.length}个` : ''}`);
    }

    return descriptions.join('\n') || '暂无上下文信息';
  }, [currentObject, relatedObjects]);

  // 当设置当前对象时，自动推入历史
  const handleSetCurrentObject = useCallback((object: ContextObject | null) => {
    if (object && object.id !== currentObject?.id) {
      pushToHistory(object);
    }
    setCurrentObject(object);
  }, [currentObject, pushToHistory]);

  const value = useMemo<OpenClawContextValue>(() => ({
    currentModule,
    setCurrentModule,
    currentObject,
    setCurrentObject: handleSetCurrentObject,
    relatedObjects,
    addRelatedObject,
    removeRelatedObject,
    clearRelatedObjects,
    contextHistory,
    pushToHistory,
    restoreFromHistory,
    quickActions,
    addQuickAction,
    removeQuickAction,
    isPanelOpen,
    setIsPanelOpen,
    contextSummary,
    getContextDescription,
  }), [
    currentModule,
    currentObject,
    handleSetCurrentObject,
    relatedObjects,
    addRelatedObject,
    removeRelatedObject,
    clearRelatedObjects,
    contextHistory,
    pushToHistory,
    restoreFromHistory,
    quickActions,
    addQuickAction,
    removeQuickAction,
    isPanelOpen,
    contextSummary,
    getContextDescription,
  ]);

  return (
    <OpenClawContext.Provider value={value}>
      {children}
    </OpenClawContext.Provider>
  );
}

/**
 * useOpenClawContext Hook
 * 
 * 在组件中使用上下文：
 * ```tsx
 * function MyComponent() {
 *   const { currentObject, setCurrentObject } = useOpenClawContext();
 *   
 *   return <div>当前对象: {currentObject?.name}</div>;
 * }
 * ```
 */
export function useOpenClawContext() {
  const context = useContext(OpenClawContext);
  
  if (!context) {
    console.warn('useOpenClawContext 必须在 OpenClawProvider 内使用');
    return createInitialContext();
  }
  
  return context;
}

/**
 * useContextObject Hook
 * 
 * 专门用于管理当前上下文对象的 Hook
 * 提供类型安全的设置方法
 */
export function useContextObject() {
  const { 
    currentObject, 
    setCurrentObject,
    relatedObjects,
    addRelatedObject,
    removeRelatedObject,
  } = useOpenClawContext();

  // 设置视频流上下文
  const setStreamContext = useCallback((
    id: string,
    name: string,
    metadata?: Record<string, unknown>
  ) => {
    setCurrentObject({
      id,
      type: 'stream',
      name,
      metadata: metadata || {},
    });
  }, [setCurrentObject]);

  // 设置告警上下文
  const setAlertContext = useCallback((
    id: string,
    name: string,
    metadata?: Record<string, unknown>
  ) => {
    setCurrentObject({
      id,
      type: 'alert',
      name,
      metadata: metadata || {},
    });
  }, [setCurrentObject]);

  // 设置任务上下文
  const setTaskContext = useCallback((
    id: string,
    name: string,
    metadata?: Record<string, unknown>
  ) => {
    setCurrentObject({
      id,
      type: 'task',
      name,
      metadata: metadata || {},
    });
  }, [setCurrentObject]);

  // 设置资产上下文
  const setAssetContext = useCallback((
    id: string,
    name: string,
    metadata?: Record<string, unknown>
  ) => {
    setCurrentObject({
      id,
      type: 'asset',
      name,
      metadata: metadata || {},
    });
  }, [setCurrentObject]);

  // 清空上下文
  const clearContext = useCallback(() => {
    setCurrentObject(null);
  }, [setCurrentObject]);

  return {
    currentObject,
    relatedObjects,
    setStreamContext,
    setAlertContext,
    setTaskContext,
    setAssetContext,
    clearContext,
    addRelatedObject,
    removeRelatedObject,
  };
}

export default OpenClawContext;
