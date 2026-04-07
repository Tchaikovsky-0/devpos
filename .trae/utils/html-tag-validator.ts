/**
 * HTML/JSX 标签闭合验证工具
 * 
 * 目的: 帮助 AI Agent 快速判断标签闭合方式，减少过度思考
 * 版本: v1.0.0
 * 更新日期: 2026-04-06
 * 
 * @example
 * ```typescript
 * import { validateTagClosing, getTagType, shouldSelfClose } from './html-tag-validator';
 * 
 * // 快速判断
 * const tagType = getTagType('Button');  // 'ui-component'
 * const needsClosing = shouldSelfClose('br');  // true
 * 
 * // 验证标签
 * const result = validateTagClosing('<Button />');  // { valid: true }
 * const result2 = validateTagClosing('<Button>');  // { valid: false, suggestion: '<Button />' }
 * ```
 */

export type TagType = 'void' | 'ui-component' | 'block' | 'fragment' | 'unknown';

/**
 * HTML Void Elements - 这些标签在 JSX 中必须自闭合
 */
export const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed',
  'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr'
] as const);

/**
 * React UI 组件库 - 巡检宝项目常用的 UI 组件
 */
export const UI_COMPONENTS = new Set([
  // shadcn/ui components
  'Button', 'Input', 'Card', 'CardContent', 'CardHeader', 'CardTitle', 'CardDescription', 'CardFooter',
  'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter',
  'AlertDialog', 'AlertDialogContent', 'AlertDialogHeader', 'AlertDialogFooter',
  'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger',
  'Badge', 'Avatar', 'AvatarImage', 'AvatarFallback',
  'Skeleton', 'Switch', 'Slider', 'Checkbox', 'RadioGroup', 'Progress',
  'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
  'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger',
  'Table', 'TableBody', 'TableCaption', 'TableCell', 'TableFooter', 'TableHead', 'TableHeader', 'TableRow',
  'ScrollArea', 'Separator', 'Sheet', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription',
  'Toast', 'Toaster', 'Tooltip', 'TooltipContent', 'TooltipProvider',
  'Popover', 'PopoverContent', 'PopoverTrigger',
  
  // lucide-react icons (常用图标)
  'Loader2', 'Bot', 'Send', 'Sparkles', 'X', 'Eye', 'EyeOff',
  'AlertTriangle', 'AlertCircle', 'Bell', 'BellOff', 'Check', 'CheckCircle',
  'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
  'Copy', 'Edit', 'Delete', 'Download', 'Upload', 'ExternalLink',
  'File', 'FileText', 'Folder', 'FolderOpen', 'Image', 'Video', 'Film',
  'Home', 'Settings', 'User', 'Users', 'Search', 'Menu', 'MoreVertical',
  'Play', 'Pause', 'SkipBack', 'SkipForward', 'Volume', 'Volume2',
  'Shield', 'Lock', 'Unlock', 'Key', 'Filter', 'SortAsc', 'SortDesc',
  'Zap', 'Layers', 'Grid', 'List', 'Maximize', 'Minimize', 'RefreshCw',
  'Star', 'Heart', 'ThumbsUp', 'MessageSquare', 'Mail', 'Phone',
  'MapPin', 'Calendar', 'Clock', 'Timer', 'Activity', 'TrendingUp', 'TrendingDown',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowsUpDown',
  'Plus', 'Minus', 'Multiply', 'Divide', 'Equals',
  'Wifi', 'WifiOff', 'Signal', 'Battery', 'BatteryCharging',
  
  // 巡检宝自定义组件
  'OpenClawPanel', 'OpenClawMessage', 'ContextActionStrip',
  'MetricTile', 'MetricTileTitle', 'MetricTileValue', 'MetricTileTrend',
  'StreamGrid', 'StreamList', 'VideoStreamPlayer', 'LayoutSwitcher',
  'AlertScrollingList', 'AlertNotification', 'AlertActionPanel',
  'DetectionHistory', 'YOLOOverlay', 'YOLOControls',
  'FileGrid', 'FilePreviewDialog', 'FileUploader', 'FolderTree', 'MediaDetailPanel',
  'BatchToolbar', 'CreateFolderDialog', 'MoveFileDialog',
  'ChartPanel', 'StatsCards', 'StorageGaugeChart', 'AlertTrendChart',
  'DashboardActivityTimeline', 'KPICard', 'KPIGrid',
  
  // React HTML elements (这些应该被视为 UI 组件)
  'Fragment',
] as const);

/**
 * HTML 块级元素 - 需要显式闭合
 */
export const BLOCK_ELEMENTS = new Set([
  'div', 'span', 'p', 'address',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hgroup',
  'blockquote', 'figure', 'figcaption',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'tbody', 'thead', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col',
  'form', 'fieldset', 'legend', 'label', 'input', 'button', 'select', 'textarea', 'optgroup', 'option',
  'details', 'summary', 'dialog',
  'section', 'article', 'aside', 'header', 'footer', 'nav', 'main', 'address',
  'template', 'slot',
] as const);

/**
 * React 特殊元素
 */
export const REACT_SPECIAL_ELEMENTS = new Set([
  'React.Fragment',
  'React.StrictMode',
  'React.Suspense',
  'React.Memo',
] as const);

/**
 * 获取标签类型
 * 
 * @param tagName - 标签名称 (如 'Button', 'div', 'br')
 * @returns 标签类型
 * 
 * @example
 * ```typescript
 * getTagType('br');        // 'void'
 * getTagType('Button');    // 'ui-component'
 * getTagType('div');      // 'block'
 * getTagType('Fragment');  // 'fragment'
 * getTagType('Custom');   // 'unknown'
 * ```
 */
export function getTagType(tagName: string): TagType {
  const normalizedName = tagName.trim();
  const lowerName = normalizedName.toLowerCase();
  
  // 检查 void elements
  if (VOID_ELEMENTS.has(lowerName as typeof VOID_ELEMENTS extends Set<infer T> ? T : never)) {
    return 'void';
  }
  
  // 检查 UI 组件
  if (UI_COMPONENTS.has(normalizedName as typeof UI_COMPONENTS extends Set<infer T> ? T : never)) {
    return 'ui-component';
  }
  
  // 检查块级元素
  if (BLOCK_ELEMENTS.has(lowerName as typeof BLOCK_ELEMENTS extends Set<infer T> ? T : never)) {
    return 'block';
  }
  
  // 检查 React 特殊元素
  if (REACT_SPECIAL_ELEMENTS.has(normalizedName)) {
    return 'fragment';
  }
  
  // 大写开头认为是 React 组件
  if (/^[A-Z]/.test(normalizedName) || normalizedName.includes('.')) {
    return 'ui-component';
  }
  
  // 未知类型
  return 'unknown';
}

/**
 * 判断标签是否应该自闭合
 * 
 * @param tagName - 标签名称
 * @param hasChildren - 是否有子元素
 * @returns 是否应该自闭合
 * 
 * @example
 * ```typescript
 * shouldSelfClose('br');        // true
 * shouldSelfClose('Button');    // true
 * shouldSelfClose('div');       // false
 * shouldSelfClose('Fragment');  // true
 * ```
 */
export function shouldSelfClose(tagName: string, hasChildren: boolean = false): boolean {
  const type = getTagType(tagName);
  
  switch (type) {
    case 'void':
      return true;  // Void elements 必须自闭合
    case 'ui-component':
      return !hasChildren;  // 组件无子元素时自闭合
    case 'fragment':
      return true;  // Fragment 使用自闭合形式
    case 'block':
      return false;  // 块级元素需要显式闭合
    case 'unknown':
      // 对于未知标签，有子元素时需要显式闭合，否则自闭合
      return !hasChildren;
    default:
      return false;
  }
}

/**
 * 验证标签闭合是否正确
 * 
 * @param tagString - 标签字符串 (如 '<Button />', '<div>content</div>')
 * @returns 验证结果
 * 
 * @example
 * ```typescript
 * validateTagClosing('<Button />');  // { valid: true }
 * validateTagClosing('<br />');      // { valid: true }
 * validateTagClosing('<div>');        // { valid: false, expected: 'closing tag', suggestion: '<div>...</div>' }
 * ```
 */
export function validateTagClosing(tagString: string): {
  valid: boolean;
  error?: string;
  suggestion?: string;
  tagName?: string;
} {
  // 移除空白
  const trimmed = tagString.trim();
  
  // 提取标签名
  const openTagMatch = trimmed.match(/^<([A-Za-z][A-Za-z0-9._]*|@[^\s/>]+)/);
  if (!openTagMatch) {
    return { valid: false, error: 'Invalid tag format', suggestion: 'Check tag syntax' };
  }
  
  const tagName = openTagMatch[1];
  const tagType = getTagType(tagName);
  
  // 检查自闭合标签
  const isSelfClosing = trimmed.endsWith('/>');
  const hasClosingTag = /<\/[A-Za-z][A-Za-z0-9._]*>\s*$/.test(trimmed);
  
  // Void elements 规则
  if (tagType === 'void') {
    if (!isSelfClosing) {
      return {
        valid: false,
        error: 'Void element must be self-closing in JSX',
        suggestion: `<${tagName} />`,
        tagName
      };
    }
    return { valid: true, tagName };
  }
  
  // Fragment 规则
  if (tagType === 'fragment') {
    if (isSelfClosing) {
      return { valid: true, tagName };
    }
    if (hasClosingTag) {
      return { valid: true, tagName };
    }
    return {
      valid: false,
      error: 'Fragment must be self-closing or have closing tag',
      suggestion: '<>...</> or <Fragment>...</Fragment>',
      tagName
    };
  }
  
  // UI 组件和块级元素规则
  if (isSelfClosing) {
    return { valid: true, tagName };
  }
  
  if (hasClosingTag) {
    return { valid: true, tagName };
  }
  
  // 未正确闭合
  const suggestedTag = tagType === 'ui-component' || tagType === 'unknown'
    ? `<${tagName} />`  // 组件推荐自闭合
    : `<${tagName}>...</${tagName}>`;  // 块级元素推荐显式闭合
  
  return {
    valid: false,
    error: 'Tag is not properly closed',
    suggestion: suggestedTag,
    tagName
  };
}

/**
 * 快速参考提示
 * 
 * @param tagName - 标签名称
 * @returns 快速参考提示
 * 
 * @example
 * ```typescript
 * getQuickHint('br');      // '必须自闭合: <br />'
 * getQuickHint('Button');  // '推荐自闭合: <Button />'
 * getQuickHint('div');    // '需要显式闭合: <div>...</div>'
 * ```
 */
export function getQuickHint(tagName: string): string {
  const type = getTagType(tagName);
  
  switch (type) {
    case 'void':
      return `必须自闭合: <${tagName} />`;
    case 'ui-component':
      return `推荐自闭合: <${tagName} />`;
    case 'block':
      return `需要显式闭合: <${tagName}>...</${tagName}>`;
    case 'fragment':
      return `Fragment: <>...</> 或 <Fragment>...</Fragment>`;
    default:
      return `未知标签 ${tagName}: 通常自闭合 <${tagName} />`;
  }
}

/**
 * 批量验证多个标签
 * 
 * @param tags - 标签字符串数组
 * @returns 验证结果数组
 */
export function validateMultipleTags(tags: string[]): Array<{
  tag: string;
  result: ReturnType<typeof validateTagClosing>;
  index: number;
}> {
  return tags.map((tag, index) => ({
    tag,
    result: validateTagClosing(tag),
    index
  }));
}

/**
 * 检查嵌套是否正确
 * 
 * @param html - HTML/JSX 字符串
 * @returns 嵌套是否正确
 */
export function checkNesting(html: string): {
  valid: boolean;
  errors: Array<{
    message: string;
    position: number;
  }>;
} {
  const errors: Array<{ message: string; position: number }> = [];
  const stack: Array<{ tag: string; position: number }> = [];
  
  // 移除注释
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // 匹配开始标签
  const tagPattern = /<(\/?)([A-Za-z][A-Za-z0-9._]*)[^>]*(?:\/?>)/g;
  let match;
  
  while ((match = tagPattern.exec(withoutComments)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    const position = match.index;
    
    // 跳过 void elements
    if (VOID_ELEMENTS.has(tagName.toLowerCase() as typeof VOID_ELEMENTS extends Set<infer T> ? T : never)) {
      continue;
    }
    
    // 跳过自闭合标签
    if (match[0].endsWith('/>')) {
      continue;
    }
    
    if (isClosing) {
      // 闭合标签
      if (stack.length === 0) {
        errors.push({
          message: `Unexpected closing tag </${tagName}>`,
          position
        });
      } else if (stack[stack.length - 1].tag !== tagName) {
        errors.push({
          message: `Mismatched closing tag: expected </${stack[stack.length - 1].tag}>, found </${tagName}>`,
          position
        });
      } else {
        stack.pop();
      }
    } else {
      // 开始标签
      stack.push({ tag: tagName, position });
    }
  }
  
  // 检查未闭合的标签
  if (stack.length > 0) {
    stack.forEach(({ tag, position }) => {
      errors.push({
        message: `Unclosed tag <${tag}>`,
        position
      });
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============== 导出所有工具函数 ==============

export default {
  // 类型
  VOID_ELEMENTS,
  UI_COMPONENTS,
  BLOCK_ELEMENTS,
  
  // 核心函数
  getTagType,
  shouldSelfClose,
  validateTagClosing,
  checkNesting,
  
  // 辅助函数
  getQuickHint,
  validateMultipleTags,
  
  // 类型导出
  TagType
};
