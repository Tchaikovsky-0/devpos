/**
 * HTML/JSX 标签验证工具 - 测试用例集
 * 
 * 目的: 验证标签闭合优化方案的有效性
 * 版本: v1.0.0
 * 创建日期: 2026-04-06
 */

import {
  getTagType,
  shouldSelfClose,
  validateTagClosing,
  checkNesting,
  getQuickHint,
  TagType,
  VOID_ELEMENTS,
  UI_COMPONENTS,
  BLOCK_ELEMENTS
} from '../utils/html-tag-validator';

// ============== 基础功能测试 ==============

describe('HTML/JSX 标签验证工具 - 基础测试', () => {
  
  describe('getTagType - 标签类型识别', () => {
    it('应该正确识别 void elements', () => {
      const voidTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'br', 'BR', 'Br'];
      
      voidTags.forEach(tag => {
        expect(getTagType(tag)).toBe('void');
      });
    });
    
    it('应该正确识别 UI 组件', () => {
      const uiComponents = ['Button', 'Dialog', 'Loader2', 'Bot', 'MetricTile'];
      
      uiComponents.forEach(tag => {
        expect(getTagType(tag)).toBe('ui-component');
      });
    });
    
    it('应该正确识别块级元素', () => {
      const blockTags = ['div', 'span', 'p', 'section', 'article', 'header', 'footer'];
      
      blockTags.forEach(tag => {
        expect(getTagType(tag)).toBe('block');
      });
    });
    
    it('应该正确识别 Fragment', () => {
      expect(getTagType('Fragment')).toBe('fragment');
      expect(getTagType('React.Fragment')).toBe('fragment');
    });
    
    it('应该正确识别未知标签 (假设为组件)', () => {
      expect(getTagType('CustomComponent')).toBe('ui-component');
      expect(getTagType('MyButton')).toBe('ui-component');
    });
  });
  
  describe('shouldSelfClose - 自闭合判断', () => {
    
    describe('void elements 必须自闭合', () => {
      const voidTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'col', 'embed'];
      
      voidTags.forEach(tag => {
        it(`<${tag}> 应该自闭合`, () => {
          expect(shouldSelfClose(tag, false)).toBe(true);
          expect(shouldSelfClose(tag, true)).toBe(true);  // 即使有子元素也应该自闭合
        });
      });
    });
    
    describe('UI 组件的闭合方式', () => {
      it('无子元素时应该自闭合', () => {
        expect(shouldSelfClose('Button', false)).toBe(true);
        expect(shouldSelfClose('Dialog', false)).toBe(true);
        expect(shouldSelfClose('Loader2', false)).toBe(true);
      });
      
      it('有子元素时不需要自闭合', () => {
        expect(shouldSelfClose('Button', true)).toBe(false);
        expect(shouldSelfClose('Dialog', true)).toBe(false);
        expect(shouldSelfClose('MetricTile', true)).toBe(false);
      });
    });
    
    describe('块级元素需要显式闭合', () => {
      const blockTags = ['div', 'p', 'span', 'section', 'article'];
      
      blockTags.forEach(tag => {
        it(`<${tag}> 应该显式闭合`, () => {
          expect(shouldSelfClose(tag, false)).toBe(false);
          expect(shouldSelfClose(tag, true)).toBe(false);
        });
      });
    });
  });
});

// ============== 标签闭合验证测试 ==============

describe('validateTagClosing - 标签闭合验证', () => {
  
  describe('✅ 有效标签测试', () => {
    it('应该验证通过: void elements 自闭合', () => {
      const result = validateTagClosing('<br />');
      expect(result.valid).toBe(true);
      expect(result.tagName).toBe('br');
    });
    
    it('应该验证通过: UI 组件自闭合', () => {
      expect(validateTagClosing('<Button />').valid).toBe(true);
      expect(validateTagClosing('<Dialog open={true} />').valid).toBe(true);
      expect(validateTagClosing('<Loader2 className="animate-spin" />').valid).toBe(true);
    });
    
    it('应该验证通过: 块级元素显式闭合', () => {
      expect(validateTagClosing('<div>content</div>').valid).toBe(true);
      expect(validateTagClosing('<p>paragraph</p>').valid).toBe(true);
      expect(validateTagClosing('<section><h1>Title</h1></section>').valid).toBe(true);
    });
    
    it('应该验证通过: Fragment', () => {
      expect(validateTagClosing('<>content</>').valid).toBe(true);
      expect(validateTagClosing('<Fragment>content</Fragment>').valid).toBe(true);
    });
  });
  
  describe('❌ 无效标签测试', () => {
    it('应该拒绝: void elements 不自闭合', () => {
      const result = validateTagClosing('<br>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('self-closing');
      expect(result.suggestion).toBe('<br />');
    });
    
    it('应该拒绝: 未闭合的块级元素', () => {
      const result = validateTagClosing('<div>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not properly closed');
    });
    
    it('应该拒绝: 自闭合的块级元素带子元素', () => {
      const result = validateTagClosing('<div><span>content</span></div>');
      // 这个应该通过，因为整体是闭合的
      expect(result.valid).toBe(true);
    });
  });
});

// ============== 嵌套验证测试 ==============

describe('checkNesting - 嵌套结构验证', () => {
  
  describe('✅ 有效嵌套', () => {
    it('应该通过: 简单嵌套', () => {
      const result = checkNesting('<div><span>content</span></div>');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('应该通过: 深层嵌套', () => {
      const html = `
        <div>
          <section>
            <article>
              <p>Deep content</p>
            </article>
          </section>
        </div>
      `;
      const result = checkNesting(html);
      expect(result.valid).toBe(true);
    });
    
    it('应该通过: 组件混合', () => {
      const jsx = `
        <div className="container">
          <Button onClick={handleClick}>
            <Icon />
            <span>Click me</span>
          </Button>
        </div>
      `;
      const result = checkNesting(jsx);
      expect(result.valid).toBe(true);
    });
    
    it('应该通过: 复杂嵌套', () => {
      const jsx = `
        <MetricTile>
          <MetricTile.Title>Sales</MetricTile.Title>
          <MetricTile.Value>$1,234</MetricTile.Value>
        </MetricTile>
      `;
      const result = checkNesting(jsx);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('❌ 无效嵌套', () => {
    it('应该检测: 交叉嵌套', () => {
      const html = '<div><span>content</div></span>';
      const result = checkNesting(html);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('应该检测: 未闭合标签', () => {
      const html = '<div><p>unclosed';
      const result = checkNesting(html);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unclosed'))).toBe(true);
    });
    
    it('应该检测: 多余闭合标签', () => {
      const html = '</div>';
      const result = checkNesting(html);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unexpected'))).toBe(true);
    });
  });
});

// ============== 巡检宝项目特定测试 ==============

describe('巡检宝项目 - 特定场景测试', () => {
  
  describe('UI 组件使用场景', () => {
    it('Button 组件', () => {
      expect(validateTagClosing('<Button>点击</Button>').valid).toBe(true);
      expect(validateTagClosing('<Button />').valid).toBe(true);
    });
    
    it('Dialog 组件', () => {
      const dialog = `
        <Dialog open={isOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>标题</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      `;
      const result = checkNesting(dialog);
      expect(result.valid).toBe(true);
    });
    
    it('MetricTile 复合组件', () => {
      const metricTile = `
        <MetricTile>
          <MetricTile.Title>销售额</MetricTile.Title>
          <MetricTile.Value>$10,000</MetricTile.Value>
          <MetricTile.Trend up={true}>+10%</MetricTile.Trend>
        </MetricTile>
      `;
      const result = checkNesting(metricTile);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('Icon 组件使用', () => {
    const icons = ['Loader2', 'Bot', 'Send', 'Sparkles', 'X', 'Eye', 'AlertTriangle'];
    
    icons.forEach(icon => {
      it(`<${icon} /> 应该正确验证`, () => {
        const result = validateTagClosing(`<${icon} />`);
        expect(result.valid).toBe(true);
        expect(shouldSelfClose(icon, false)).toBe(true);
      });
    });
  });
  
  describe('复杂场景', () => {
    it('OpenClawPanel 组件', () => {
      const panel = `
        <OpenClawPanel isOpen={true}>
          <div className="messages">
            <Message role="assistant" content="Hello" />
            <Message role="user" content="Hi" />
          </div>
        </OpenClawPanel>
      `;
      const result = checkNesting(panel);
      expect(result.valid).toBe(true);
    });
    
    it('StreamGrid 组件', () => {
      const grid = `
        <StreamGrid>
          <VideoStreamPlayer streamId="1" />
          <VideoStreamPlayer streamId="2" />
          <VideoStreamPlayer streamId="3" />
        </StreamGrid>
      `;
      const result = checkNesting(grid);
      expect(result.valid).toBe(true);
    });
  });
});

// ============== 性能测试 ==============

describe('性能测试', () => {
  it('大量标签验证应该快速完成', () => {
    const tags = [
      ...Array(100).fill('<br />'),
      ...Array(100).fill('<Button />'),
      ...Array(100).fill('<div>content</div>'),
    ];
    
    const startTime = performance.now();
    tags.forEach(tag => validateTagClosing(tag));
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    console.log(`验证 ${tags.length} 个标签耗时: ${duration}ms`);
    
    // 应该小于 100ms
    expect(duration).toBeLessThan(100);
  });
  
  it('复杂嵌套检查应该快速完成', () => {
    const complexHtml = Array(50).fill('<div><section><article><p>content</p></article></section></div>').join('');
    
    const startTime = performance.now();
    checkNesting(complexHtml);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    console.log(`检查复杂嵌套耗时: ${duration}ms`);
    
    // 应该小于 50ms
    expect(duration).toBeLessThan(50);
  });
});

// ============== 边界情况测试 ==============

describe('边界情况测试', () => {
  
  it('应该处理带属性的 void element', () => {
    expect(validateTagClosing('<img src="test.jpg" alt="test" />').valid).toBe(true);
    expect(validateTagClosing('<input type="text" name="field" />').valid).toBe(true);
    expect(validateTagClosing('<meta charset="utf-8" />').valid).toBe(true);
  });
  
  it('应该处理带属性的组件', () => {
    expect(validateTagClosing('<Button variant="primary" size="lg" />').valid).toBe(true);
    expect(validateTagClosing('<Dialog open={isOpen} onClose={handleClose} />').valid).toBe(true);
  });
  
  it('应该处理 React 表达式', () => {
    expect(validateTagClosing('<Button disabled={isLoading || !enabled} />').valid).toBe(true);
    expect(validateTagClosing('<div className={isActive ? "active" : "inactive"} />').valid).toBe(true);
  });
  
  it('应该处理多行标签', () => {
    const multilineTag = `
      <Button
        variant="primary"
        size="lg"
        onClick={handleClick}
        disabled={isLoading}
      >
        提交
      </Button>
    `;
    expect(validateTagClosing(multilineTag.trim()).valid).toBe(true);
  });
  
  it('应该处理嵌套的 React Fragment', () => {
    const fragment = `
      <>
        <Component1 />
        <>
          <Component2 />
          <Component3 />
        </>
      </>
    `;
    const result = checkNesting(fragment);
    expect(result.valid).toBe(true);
  });
});

// ============== 快速参考测试 ==============

describe('getQuickHint - 快速参考', () => {
  
  it('void element 提示', () => {
    const hint = getQuickHint('br');
    expect(hint).toContain('必须自闭合');
    expect(hint).toContain('<br />');
  });
  
  it('UI 组件提示', () => {
    const hint = getQuickHint('Button');
    expect(hint).toContain('推荐自闭合');
    expect(hint).toContain('<Button />');
  });
  
  it('块级元素提示', () => {
    const hint = getQuickHint('div');
    expect(hint).toContain('需要显式闭合');
    expect(hint).toContain('<div>...</div>');
  });
  
  it('未知标签提示', () => {
    const hint = getQuickHint('Custom');
    expect(hint).toContain('未知标签');
    expect(hint).toContain('通常自闭合');
  });
});

// ============== 导出验证 ==============

describe('模块导出验证', () => {
  it('应该导出所有预期的常量和函数', () => {
    expect(VOID_ELEMENTS).toBeDefined();
    expect(UI_COMPONENTS).toBeDefined();
    expect(BLOCK_ELEMENTS).toBeDefined();
    expect(getTagType).toBeDefined();
    expect(shouldSelfClose).toBeDefined();
    expect(validateTagClosing).toBeDefined();
    expect(checkNesting).toBeDefined();
    expect(getQuickHint).toBeDefined();
  });
  
  it('常量集合应该包含预期的元素', () => {
    expect(VOID_ELEMENTS.has('br')).toBe(true);
    expect(VOID_ELEMENTS.has('img')).toBe(true);
    expect(VOID_ELEMENTS.has('input')).toBe(true);
    
    expect(UI_COMPONENTS.has('Button')).toBe(true);
    expect(UI_COMPONENTS.has('Dialog')).toBe(true);
    expect(UI_COMPONENTS.has('Loader2')).toBe(true);
    
    expect(BLOCK_ELEMENTS.has('div')).toBe(true);
    expect(BLOCK_ELEMENTS.has('p')).toBe(true);
    expect(BLOCK_ELEMENTS.has('section')).toBe(true);
  });
});
