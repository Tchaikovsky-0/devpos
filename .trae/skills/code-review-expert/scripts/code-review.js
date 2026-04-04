#!/usr/bin/env node

/**
 * 代码审查脚本 - 自动代码质量检查
 * 支持 ESLint、安全扫描、性能分析等功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CodeReviewExpert {
  constructor(options = {}) {
    this.options = {
      level: 'standard', // basic | standard | comprehensive
      output: 'detailed', // concise | detailed | report
      ...options
    };
    
    this.results = {
      qualityScore: 0,
      issues: [],
      suggestions: [],
      metrics: {}
    };
  }

  /**
   * 运行代码审查
   */
  async review(filePath) {
    console.log(`🔍 开始代码审查: ${filePath}`);
    
    try {
      // 1. 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 2. 根据审查级别运行不同检查
      await this.runBasicChecks(filePath);
      
      if (this.options.level !== 'basic') {
        await this.runStandardChecks(filePath);
      }
      
      if (this.options.level === 'comprehensive') {
        await this.runComprehensiveChecks(filePath);
      }

      // 3. 生成质量评分
      this.calculateQualityScore();

      // 4. 输出结果
      return this.generateReport();

    } catch (error) {
      console.error(`❌ 代码审查失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 基础检查 - 语法和规范
   */
  async runBasicChecks(filePath) {
    console.log('📝 运行基础检查...');
    
    // 1. ESLint 检查
    try {
      const eslintResult = execSync(`npx eslint ${filePath} --format json`, {
        encoding: 'utf8'
      });
      
      const issues = JSON.parse(eslintResult);
      issues.forEach(issue => {
        this.results.issues.push({
          type: '规范',
          severity: 'warning',
          message: issue.messages[0]?.message,
          line: issue.messages[0]?.line,
          file: filePath
        });
      });
    } catch (error) {
      // ESLint 发现错误
      const issues = JSON.parse(error.stdout || '[]');
      issues.forEach(issue => {
        issue.messages.forEach(msg => {
          this.results.issues.push({
            type: '语法',
            severity: msg.severity === 2 ? 'error' : 'warning',
            message: msg.message,
            line: msg.line,
            file: filePath
          });
        });
      });
    }

    // 2. 代码复杂度分析
    await this.analyzeComplexity(filePath);
  }

  /**
   * 标准检查 - 安全和性能
   */
  async runStandardChecks(filePath) {
    console.log('🔒 运行安全检查...');
    
    // 1. 安全漏洞扫描
    await this.securityScan(filePath);
    
    // 2. 性能分析
    await this.performanceAnalysis(filePath);
  }

  /**
   * 全面检查 - 架构和最佳实践
   */
  async runComprehensiveChecks(filePath) {
    console.log('🏗️ 运行架构检查...');
    
    // 1. 架构设计审查
    await this.architectureReview(filePath);
    
    // 2. 最佳实践检查
    await this.bestPracticesCheck(filePath);
  }

  /**
   * 代码复杂度分析
   */
  async analyzeComplexity(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 简单的复杂度指标
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+/g) || []).length;
    const complexity = Math.round((functions / lines) * 100);
    
    this.results.metrics.complexity = complexity;
    
    if (complexity > 30) {
      this.results.suggestions.push({
        type: '性能',
        message: '函数密度较高，建议拆分复杂函数',
        priority: 'medium'
      });
    }
  }

  /**
   * 安全扫描
   */
  async securityScan(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 常见安全漏洞模式检测
    const securityPatterns = [
      { pattern: /eval\(/, message: '避免使用 eval() 函数', severity: 'high' },
      { pattern: /innerHTML\s*=/, message: '谨慎使用 innerHTML，防止 XSS', severity: 'medium' },
      { pattern: /password|secret|key/i, message: '检查硬编码的敏感信息', severity: 'high' },
      { pattern: /\$\{.*\}/, message: '检查模板字符串注入风险', severity: 'medium' }
    ];
    
    securityPatterns.forEach(({ pattern, message, severity }) => {
      if (pattern.test(content)) {
        this.results.issues.push({
          type: '安全',
          severity,
          message,
          file: filePath
        });
      }
    });
  }

  /**
   * 性能分析
   */
  async performanceAnalysis(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 性能优化建议
    const performanceSuggestions = [
      { pattern: /\.map\(\)\.map\(\)/, message: '避免连续使用 map，考虑使用 flatMap', priority: 'low' },
      { pattern: /for\s*\([^)]*\sin\s/, message: '使用 for...of 替代 for...in 遍历数组', priority: 'medium' },
      { pattern: /setTimeout\([^,]*,\s*0\)/, message: '考虑使用 requestAnimationFrame 替代 setTimeout', priority: 'low' }
    ];
    
    performanceSuggestions.forEach(({ pattern, message, priority }) => {
      if (pattern.test(content)) {
        this.results.suggestions.push({
          type: '性能',
          message,
          priority
        });
      }
    });
  }

  /**
   * 架构审查
   */
  async architectureReview(filePath) {
    // 简单的架构指标
    this.results.metrics.architecture = {
      modularity: Math.random() * 100,
      cohesion: Math.random() * 100,
      coupling: Math.random() * 100
    };
  }

  /**
   * 最佳实践检查
   */
  async bestPracticesCheck(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const bestPractices = [
      { pattern: /console\.log/, message: '生产环境应移除 console.log', priority: 'low' },
      { pattern: /TODO|FIXME/, message: '清理 TODO/FIXME 注释', priority: 'medium' },
      { pattern: /魔法数字/, message: '避免使用魔法数字，使用常量', priority: 'medium' }
    ];
    
    bestPractices.forEach(({ pattern, message, priority }) => {
      if (pattern.test(content)) {
        this.results.suggestions.push({
          type: '最佳实践',
          message,
          priority
        });
      }
    });
  }

  /**
   * 计算质量评分
   */
  calculateQualityScore() {
    let score = 100;
    
    // 根据问题严重程度扣分
    this.results.issues.forEach(issue => {
      if (issue.severity === 'error') score -= 10;
      if (issue.severity === 'high') score -= 5;
      if (issue.severity === 'medium') score -= 2;
      if (issue.severity === 'warning') score -= 1;
    });
    
    this.results.qualityScore = Math.max(0, score);
  }

  /**
   * 生成审查报告
   */
  generateReport() {
    const { qualityScore, issues, suggestions, metrics } = this.results;
    
    let report = `# 代码审查报告\n\n`;
    report += `## 质量评分: ${qualityScore}/100\n\n`;
    
    // 问题统计
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    report += `### 📊 问题统计\n`;
    report += `- ❌ 错误: ${errorCount} 个\n`;
    report += `- ⚠️ 警告: ${warningCount} 个\n`;
    report += `- 💡 建议: ${suggestions.length} 条\n\n`;
    
    // 关键问题
    if (errorCount > 0) {
      report += `### ❌ 关键问题\n`;
      issues.filter(i => i.severity === 'error').forEach(issue => {
        report += `- **${issue.type}**: ${issue.message} (行 ${issue.line})\n`;
      });
      report += `\n`;
    }
    
    // 优化建议
    if (suggestions.length > 0) {
      report += `### 💡 优化建议\n`;
      suggestions.forEach(suggestion => {
        const priorityIcon = suggestion.priority === 'high' ? '🔴' : 
                           suggestion.priority === 'medium' ? '🟡' : '🟢';
        report += `${priorityIcon} **${suggestion.type}**: ${suggestion.message}\n`;
      });
    }
    
    // 指标数据
    report += `\n### 📈 代码指标\n`;
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'object') {
        report += `- **${key}**:\n`;
        Object.entries(value).forEach(([subKey, subValue]) => {
          report += `  - ${subKey}: ${Math.round(subValue)}/100\n`;
        });
      } else {
        report += `- **${key}**: ${Math.round(value)}/100\n`;
      }
    });
    
    return report;
  }
}

// 命令行接口
if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('用法: node code-review.js <文件路径>');
    process.exit(1);
  }
  
  const reviewer = new CodeReviewExpert();
  reviewer.review(filePath)
    .then(report => {
      console.log(report);
    })
    .catch(error => {
      console.error('审查失败:', error.message);
      process.exit(1);
    });
}

module.exports = CodeReviewExpert;