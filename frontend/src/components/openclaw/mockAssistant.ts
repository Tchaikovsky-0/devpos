export interface MockAssistantResponse {
  content: string;
  suggestions: string[];
  actions: Array<{ label: string; action: string }>;
}

const moduleNarratives: Record<string, { title: string; focus: string; next: string[] }> = {
  center: {
    title: '监控中枢',
    focus: '先判断当前画面风险，再追溯关联资料和告警。',
    next: ['研判当前焦点', '追溯关联资料', '发布值班任务'],
  },
  media: {
    title: '媒体库',
    focus: '先串联资料上下文，再决定是否生成说明或归档。',
    next: ['整理事件链', '生成取证说明', '加入报告草稿'],
  },
  alerts: {
    title: '告警处置',
    focus: '先确认根因和影响范围，再推进处置与升级。',
    next: ['分析根因', '生成处置建议', '补全交接摘要'],
  },
  tasks: {
    title: '任务协同',
    focus: '先拆解待办和来源对象，再安排执行与回填结果。',
    next: ['拆解当前任务', '补全任务说明', '回填执行摘要'],
  },
  assets: {
    title: '资产设备',
    focus: '先看健康与故障线索，再决定维护动作。',
    next: ['诊断当前设备', '预测维护窗口', '查询历史异常'],
  },
  openclaw: {
    title: '智能协同',
    focus: '先明确目标对象，再发起跨模块任务或自动化。',
    next: ['新建跨模块任务', '搜索知识资料', '调用自动化模板'],
  },
  system: {
    title: '系统管理',
    focus: '先确认治理边界，再解释策略和变更影响。',
    next: ['解释当前策略', '检查配置影响', '生成审计说明'],
  },
};

export function buildMockAssistantResponse(moduleId: string, prompt: string, source?: string): MockAssistantResponse {
  const narrative = moduleNarratives[moduleId] ?? moduleNarratives.openclaw;
  const sourcePrefix = source ? `来源对象：${source}。\n` : '';

  return {
    content:
      `已接收任务：“${prompt}”。\n\n` +
      `${sourcePrefix}` +
      `当前处于${narrative.title}，建议遵循这条链路：${narrative.focus}\n\n` +
      `我会优先把关联画面、资料、告警和任务对象串起来，再给出下一步动作，避免用户在多个页面来回切换。`,
    suggestions: narrative.next,
    actions: [
      { label: '继续细化', action: `继续细化：${prompt}` },
      { label: '生成摘要', action: `生成摘要：${prompt}` },
    ],
  };
}

