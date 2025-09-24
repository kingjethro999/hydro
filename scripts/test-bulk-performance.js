#!/usr/bin/env node

/**
 * Test script for bulk operation performance improvements
 */

const { Hydro } = require('../dist/index');
const fs = require('fs-extra');
const path = require('path');

async function createTestProject() {
  const testDir = path.join(__dirname, 'test-bulk-project');
  await fs.ensureDir(testDir);
  
  // Create a large number of test files
  const fileCount = 1000;
  const filesPerDir = 50;
  const dirCount = Math.ceil(fileCount / filesPerDir);
  
  console.log(`Creating test project with ${fileCount} files in ${dirCount} directories...`);
  
  for (let dirIndex = 0; dirIndex < dirCount; dirIndex++) {
    const dirPath = path.join(testDir, `src${dirIndex}`);
    await fs.ensureDir(dirPath);
    
    const filesInThisDir = Math.min(filesPerDir, fileCount - (dirIndex * filesPerDir));
    
    for (let fileIndex = 0; fileIndex < filesInThisDir; fileIndex++) {
      const fileName = `test${fileIndex}.js`;
      const filePath = path.join(dirPath, fileName);
      
      // Create a moderately complex JavaScript file
      const content = `
// Test file ${fileName}
const fs = require('fs');
const path = require('path');

class TestClass${fileIndex} {
  constructor(options = {}) {
    this.options = options;
    this.data = [];
    this.initialized = false;
  }

  async initialize() {
    try {
      await this.loadData();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Initialization failed:', error);
      return false;
    }
  }

  async loadData() {
    // Simulate data loading
    for (let i = 0; i < 100; i++) {
      this.data.push({
        id: i,
        name: \`item-\${i}\`,
        value: Math.random() * 1000,
        timestamp: new Date()
      });
    }
  }

  processData() {
    if (!this.initialized) {
      throw new Error('Not initialized');
    }

    return this.data
      .filter(item => item.value > 500)
      .map(item => ({
        ...item,
        processed: true,
        score: item.value * 0.1
      }))
      .sort((a, b) => b.score - a.score);
  }

  async saveResults(results) {
    const outputPath = path.join(__dirname, \`output-\${Date.now()}.json\`);
    await fs.writeJson(outputPath, results, { spaces: 2 });
    return outputPath;
  }
}

function complexFunction${fileIndex}(input) {
  if (!input) {
    return null;
  }

  const result = [];
  
  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    
    if (item.type === 'special') {
      result.push({
        ...item,
        processed: true,
        metadata: {
          processedAt: new Date(),
          processor: 'complexFunction${fileIndex}',
          version: '1.0.0'
        }
      });
    } else if (item.type === 'normal') {
      result.push({
        ...item,
        processed: true,
        metadata: {
          processedAt: new Date(),
          processor: 'complexFunction${fileIndex}',
          version: '1.0.0'
        }
      });
    } else {
      // Handle unknown types
      console.warn('Unknown item type:', item.type);
    }
  }

  return result;
}

module.exports = {
  TestClass${fileIndex},
  complexFunction${fileIndex}
};
`;
      
      await fs.writeFile(filePath, content);
    }
  }
  
  // Create package.json
  const packageJson = {
    name: 'test-bulk-project',
    version: '1.0.0',
    description: 'Test project for bulk operations',
    main: 'index.js',
    scripts: {
      test: 'echo "No tests specified"'
    },
    dependencies: {
      'fs-extra': '^10.0.0'
    }
  };
  
  await fs.writeJson(path.join(testDir, 'package.json'), packageJson, { spaces: 2 });
  
  console.log(`Test project created at: ${testDir}`);
  return testDir;
}

async function testBulkPerformance() {
  console.log('🚀 Testing Hydro bulk operation performance...\n');
  
  // Create test project
  const testDir = await createTestProject();
  
  try {
    // Initialize Hydro
    const hydro = new Hydro();
    await hydro.initialize();
    
    // Test 1: Basic scan
    console.log('📁 Test 1: Basic file scanning...');
    const scanStart = Date.now();
    const scanResult = await hydro.analyze({
      path: testDir,
      comprehensive: false,
      threshold: 1
    });
    const scanDuration = Date.now() - scanStart;
    
    console.log(`✅ Scan completed in ${scanDuration}ms`);
    console.log(`   Files processed: ${scanResult.summary.totalFiles}`);
    console.log(`   Issues found: ${scanResult.summary.issueCount}`);
    console.log(`   Processing rate: ${(scanResult.summary.totalFiles / (scanDuration / 1000)).toFixed(1)} files/sec\n`);
    
    // Test 2: Comprehensive analysis
    console.log('🔍 Test 2: Comprehensive analysis...');
    const analysisStart = Date.now();
    const analysisResult = await hydro.analyze({
      path: testDir,
      comprehensive: true,
      threshold: 1
    });
    const analysisDuration = Date.now() - analysisStart;
    
    console.log(`✅ Analysis completed in ${analysisDuration}ms`);
    console.log(`   Files processed: ${analysisResult.summary.totalFiles}`);
    console.log(`   Issues found: ${analysisResult.summary.issueCount}`);
    console.log(`   Processing rate: ${(analysisResult.summary.totalFiles / (analysisDuration / 1000)).toFixed(1)} files/sec\n`);
    
    // Test 3: Memory usage monitoring
    console.log('💾 Test 3: Memory usage monitoring...');
    const memoryUsage = process.memoryUsage();
    console.log(`   Heap used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`);
    console.log(`   Heap total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`);
    console.log(`   External: ${(memoryUsage.external / 1024 / 1024).toFixed(1)} MB\n`);
    
    // Test 4: Performance comparison
    console.log('⚡ Performance Summary:');
    console.log(`   File scanning: ${scanDuration}ms (${(scanResult.summary.totalFiles / (scanDuration / 1000)).toFixed(1)} files/sec)`);
    console.log(`   Full analysis: ${analysisDuration}ms (${(analysisResult.summary.totalFiles / (analysisDuration / 1000)).toFixed(1)} files/sec)`);
    console.log(`   Total time: ${scanDuration + analysisDuration}ms`);
    console.log(`   Memory efficiency: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB for ${scanResult.summary.totalFiles} files\n`);
    
    // Test 5: Issue breakdown
    console.log('📊 Issue Analysis:');
    const issuesByType = analysisResult.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(issuesByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} issues`);
    });
    
    console.log('\n✅ Bulk operation performance test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test project...');
    await fs.remove(testDir);
    console.log('✅ Cleanup completed');
  }
}

// Run the test
if (require.main === module) {
  testBulkPerformance().catch(console.error);
}

module.exports = { testBulkPerformance, createTestProject };
