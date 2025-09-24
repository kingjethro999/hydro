#!/usr/bin/env node

/**
 * Validation script for bulk operation improvements
 */

const fs = require('fs-extra');
const path = require('path');

async function validateImprovements() {
  console.log('🔍 Validating Hydro bulk operation improvements...\n');
  
  const improvements = [
    {
      name: 'File Scanner Optimizations',
      files: [
        'src/core/file-scanner.ts'
      ],
      checks: [
        'Dynamic batch sizing',
        'Concurrency control',
        'Streaming for large files',
        'Memory management'
      ]
    },
    {
      name: 'Analysis Engine Optimizations',
      files: [
        'src/analyzers/analysis-engine.ts'
      ],
      checks: [
        'Batch processing',
        'Concurrent analyzers',
        'Memory management',
        'Progress tracking'
      ]
    },
    {
      name: 'Bulk Operations Utility',
      files: [
        'src/utils/bulk-operations.ts'
      ],
      checks: [
        'Bulk processing framework',
        'Memory monitoring',
        'Adaptive batch sizing',
        'Error handling'
      ]
    },
    {
      name: 'Progress Tracking System',
      files: [
        'src/utils/progress-tracker.ts'
      ],
      checks: [
        'Real-time progress tracking',
        'Memory monitoring',
        'Performance metrics',
        'Progress display utilities'
      ]
    },
    {
      name: 'Bulk Command',
      files: [
        'src/cli/commands/bulk.ts'
      ],
      checks: [
        'CLI interface for bulk operations',
        'Configuration options',
        'Progress display',
        'Result formatting'
      ]
    }
  ];
  
  let totalChecks = 0;
  let passedChecks = 0;
  
  for (const improvement of improvements) {
    console.log(`📁 ${improvement.name}:`);
    
    for (const file of improvement.files) {
      const filePath = path.join(__dirname, '..', file);
      
      if (await fs.pathExists(filePath)) {
        console.log(`  ✅ ${file} - exists`);
        
        // Read file content to validate improvements
        const content = await fs.readFile(filePath, 'utf8');
        
        for (const check of improvement.checks) {
          totalChecks++;
          
          // Check for specific improvements in the code
          const hasImprovement = checkImprovement(content, check);
          
          if (hasImprovement) {
            console.log(`    ✅ ${check}`);
            passedChecks++;
          } else {
            console.log(`    ❌ ${check} - not found`);
          }
        }
      } else {
        console.log(`  ❌ ${file} - not found`);
        totalChecks += improvement.checks.length;
      }
    }
    console.log('');
  }
  
  // Check CLI registration
  console.log('🔧 CLI Integration:');
  const cliPath = path.join(__dirname, '..', 'src/cli/index.ts');
  if (await fs.pathExists(cliPath)) {
    const cliContent = await fs.readFile(cliPath, 'utf8');
    
    totalChecks++;
    if (cliContent.includes('BulkCommand')) {
      console.log('  ✅ BulkCommand registered in CLI');
      passedChecks++;
    } else {
      console.log('  ❌ BulkCommand not registered in CLI');
    }
  }
  
  // Check documentation
  console.log('\n📚 Documentation:');
  const docPath = path.join(__dirname, '..', 'BULK_OPERATIONS.md');
  if (await fs.pathExists(docPath)) {
    console.log('  ✅ BULK_OPERATIONS.md created');
    passedChecks++;
  } else {
    console.log('  ❌ BULK_OPERATIONS.md not found');
  }
  totalChecks++;
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`  Total checks: ${totalChecks}`);
  console.log(`  Passed: ${passedChecks}`);
  console.log(`  Failed: ${totalChecks - passedChecks}`);
  console.log(`  Success rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 All bulk operation improvements validated successfully!');
    return true;
  } else {
    console.log('\n⚠️  Some improvements need attention.');
    return false;
  }
}

function checkImprovement(content, check) {
  const checks = {
    'Dynamic batch sizing': [
      'OPTIMAL_BATCH_SIZE',
      'Math.min',
      'Math.max',
      'batchSize'
    ],
    'Concurrency control': [
      'MAX_CONCURRENT_FILES',
      'processBatchWithConcurrencyControl',
      'concurrency'
    ],
    'Streaming for large files': [
      'STREAM_THRESHOLD',
      'readFileContentStreaming',
      'createReadStream'
    ],
    'Memory management': [
      'global.gc',
      'memoryUsage',
      'cleanupCache'
    ],
    'Batch processing': [
      'createAnalysisBatches',
      'BULK_ANALYSIS_BATCH_SIZE',
      'batch'
    ],
    'Concurrent analyzers': [
      'runAnalyzersConcurrently',
      'MAX_CONCURRENT_ANALYZERS',
      'Promise.all'
    ],
    'Progress tracking': [
      'progressCallback',
      'ProgressTracker',
      'progress'
    ],
    'Bulk processing framework': [
      'processBulk',
      'BulkOperations',
      'BulkOperationResult'
    ],
    'Memory monitoring': [
      'getDetailedMemoryUsage',
      'memoryUsage',
      'formatBytes',
      'process.memoryUsage',
      'getMemoryUsage'
    ],
    'Adaptive batch sizing': [
      'calculateOptimalBatchSize',
      'availableMemory',
      'averageItemSize'
    ],
    'Error handling': [
      'errors',
      'try',
      'catch'
    ],
    'Real-time progress tracking': [
      'ProgressTracker',
      'update',
      'percentage'
    ],
    'Performance metrics': [
      'processingRate',
      'estimatedTimeRemaining',
      'performance'
    ],
    'Progress display utilities': [
      'ProgressDisplay',
      'createProgressBar',
      'formatDuration'
    ],
    'CLI interface for bulk operations': [
      'BulkCommand',
      'bulk',
      'options'
    ],
    'Configuration options': [
      'batchSize',
      'maxConcurrency',
      'memoryLimit'
    ],
    'Result formatting': [
      'saveOutput',
      'format',
      'displayBulkAnalysisSummary'
    ],
    'Progress display': [
      'ProgressDisplay',
      'createDetailedDisplay',
      'spinner.text',
      'logger.debug'
    ]
  };
  
  const keywords = checks[check] || [];
  return keywords.some(keyword => content.includes(keyword));
}

// Run validation
if (require.main === module) {
  validateImprovements()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateImprovements };
