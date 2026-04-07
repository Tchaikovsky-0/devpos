#!/usr/bin/env node

/**
 * 代码审查智能体测试脚本
 * 测试智能体的各项功能
 */

const CodeReviewExpert = require('./code-review.js');

// 创建一个测试文件
const testCode = `
// 测试代码文件
function calculateTotal(items) {
  let total = 0;
  
  // 使用 for...in 遍历数组（性能问题）
  for (let index in items) {
    total += items[index].price;
  }
  
  // 使用 eval（安全问题）
  const discount = eval('0.1');
  
  // console.log（最佳实践问题）
  console.log('总价:', total);
  
  // TODO: 需要优化算法
  return total * (1 - discount);
}

// 魔法数字（最佳实践问题）
const TAX_RATE = 0.08;

// 使用 innerHTML（安全问题）
document.getElementById('result').innerHTML = '计算完成';
`;

const fs = require('fs');
const path = require('path');

// 创建测试文件
const testFilePath = path.join(__dirname, 'test-file.js');
fs.writeFileSync(testFilePath, testCode);

console.log('🧪 开始测试代码审查智能体...\n');

async function runTests() {
  try {
    // 测试基础审查
    console.log('📝 测试基础审查...');
    const basicReviewer = new CodeReviewExpert({ level: 'basic' });
    const basicReport = await basicReviewer.review(testFilePath);
    console.log(basicReport);
    
    console.log('='.repeat(50) + '\n');
    
    // 测试标准审查
    console.log('🔒 测试标准审查...');
    const standardReviewer = new CodeReviewExpert({ level: 'standard' });
    const standardReport = await standardReviewer.review(testFilePath);
    console.log(standardReport);
    
    console.log('='.repeat(50) + '\n');
    
    // 测试全面审查
    console.log('🏗️ 测试全面审查...');
    const comprehensiveReviewer = new CodeReviewExpert({ level: 'comprehensive' });
    const comprehensiveReport = await comprehensiveReviewer.review(testFilePath);
    console.log(comprehensiveReport);
    
    console.log('✅ 测试完成！代码审查智能体工作正常。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

// 运行测试
runTests();