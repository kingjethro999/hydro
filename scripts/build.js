#!/usr/bin/env node

/**
 * Build script for Hydro
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function main() {
  console.log('🔨 Building Hydro...');
  
  try {
    // Clean previous build
    console.log('🧹 Cleaning previous build...');
    await fs.remove('dist');
    
    // TypeScript compilation
    console.log('📦 Compiling TypeScript...');
    execSync('tsc', { stdio: 'inherit' });
    
    // Make CLI executable
    console.log('🔧 Making CLI executable...');
    const cliPath = path.join(__dirname, '../dist/cli/index.js');
    if (await fs.pathExists(cliPath)) {
      await fs.chmod(cliPath, '755');
    }
    
    // Copy package.json to dist for npm publishing
    console.log('📄 Copying package.json...');
    const packageJson = await fs.readJson('package.json');
    
    // Update main and bin paths for published package
    packageJson.main = 'index.js';
    packageJson.bin.hydro = 'cli/index.js';
    
    await fs.writeJson('dist/package.json', packageJson, { spaces: 2 });
    
    // Copy other necessary files
    console.log('📋 Copying additional files...');
    const filesToCopy = ['README.md', 'LICENSE'];
    
    for (const file of filesToCopy) {
      if (await fs.pathExists(file)) {
        await fs.copy(file, path.join('dist', file));
      }
    }
    
    console.log('✅ Build complete!');
    console.log('\n📦 Package contents:');
    
    // List build output
    const distContents = await fs.readdir('dist');
    distContents.forEach(item => {
      console.log(`   ${item}`);
    });
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
