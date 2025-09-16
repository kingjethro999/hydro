/**
 * Write command - Generate documentation and files
 */

import fs from 'fs-extra';
import path from 'path';
import { BaseCommand } from './base';
import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';
import { ConfigManager } from '@/core/config';

import type { CommandOptions, HydroConfig } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

export class WriteCommand extends BaseCommand {
  constructor() {
    super('write', 'Generate documentation and files');
    this.setupWriteOptions();
  }

  /**
   * Setup write-specific options
   */
  private setupWriteOptions(): void {
    this.command
      .option('--readme', 'Generate comprehensive README.md')
      .option('--force', 'Force overwrite existing files')
      .option('--template <template>', 'Use specific template (minimal|comprehensive|api)', 'comprehensive')
      .option('--output <path>', 'Output path for generated files')
      .action(async (options: CommandOptions & { 
        readme?: boolean; 
        force?: boolean; 
        template?: string; 
        output?: string; 
      }) => {
        try {
          await this.execute(options);
        } catch (error) {
          logger.error('Write command failed', error as Error);
          process.exit(1);
        }
      });
  }

  /**
   * Execute the write command
   */
  protected async execute(options: CommandOptions & { 
    readme?: boolean; 
    force?: boolean; 
    template?: string; 
    output?: string; 
  }): Promise<void> {
    const config = await this.loadConfig();
    
    if (options.readme) {
      await this.generateReadme(config, options);
    } else {
      logger.info('No write operation specified. Use --readme to generate README.md');
    }
  }

  /**
   * Generate comprehensive README.md
   */
  private async generateReadme(
    config: HydroConfig, 
    options: CommandOptions & { force?: boolean; template?: string; output?: string; }
  ): Promise<void> {
    const spinner = logger.createSpinner('Analyzing codebase for README generation...');
    spinner.start();

    try {
      // Analyze codebase
      const scanner = new FileScanner();
      const scanResult = await scanner.scanFiles(process.cwd(), config.scan);
      
      // Analyze project structure and dependencies
      const projectAnalysis = await this.analyzeProject(scanResult.files);
      
      spinner.succeed('Codebase analysis complete');

      // Determine output path
      const outputPath = options.output || process.cwd();
      const readmePath = path.join(outputPath, 'README.md');
      const suggestedPath = path.join(outputPath, 'suggested_readme.md');

      // Check if README already exists
      const readmeExists = await fs.pathExists(readmePath);
      let targetPath = readmePath;

      if (readmeExists && !options.force) {
        // Check user preference in config
        const userPreference = config.write?.readmePreference;
        
        if (userPreference === 'suggested') {
          targetPath = suggestedPath;
          logger.info('Using suggested_readme.md based on previous preference');
        } else if (userPreference === 'overwrite') {
          targetPath = readmePath;
          logger.info('Overwriting existing README.md based on previous preference');
        } else {
          // Ask user for permission
          const shouldOverwrite = await this.askReadmePermission();
          
          if (shouldOverwrite) {
            targetPath = readmePath;
            // Save preference to config
            await this.saveReadmePreference(config, 'overwrite');
          } else {
            targetPath = suggestedPath;
            // Save preference to config
            await this.saveReadmePreference(config, 'suggested');
          }
        }
      }

      // Generate README content
      const readmeContent = await this.generateReadmeContent(projectAnalysis, options.template || 'comprehensive');
      
      // Write file
      await fs.writeFile(targetPath, readmeContent, 'utf8');
      
      logger.success(`README generated successfully: ${targetPath}`);
      
      if (targetPath === suggestedPath) {
        logger.info('To use this README, rename suggested_readme.md to README.md');
      }

    } catch (error) {
      spinner.fail('Failed to generate README');
      throw error;
    }
  }

  /**
   * Ask user for README edit permission
   */
  private async askReadmePermission(): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    const { choice } = await inquirer.default.prompt<{ choice: string }>([
      {
        type: 'list',
        name: 'choice',
        message: 'README.md already exists. What would you like to do?',
        choices: [
          { name: 'Edit existing README.md (recommended)', value: 'overwrite' },
          { name: 'Create suggested_readme.md', value: 'suggested' }
        ],
        default: 'overwrite'
      }
    ]);

    return choice === 'overwrite';
  }

  /**
   * Save README preference to config
   */
  private async saveReadmePreference(config: HydroConfig, preference: 'overwrite' | 'suggested'): Promise<void> {
    const configManager = ConfigManager.getInstance();
    
    await configManager.updateConfig({
      write: {
        ...config.write,
        readmePreference: preference
      }
    });
    
    logger.debug(`Saved README preference: ${preference}`);
  }

  /**
   * Analyze project structure and dependencies
   */
  private async analyzeProject(files: FileInfo[]): Promise<ProjectAnalysis> {
    const analysis: ProjectAnalysis = {
      languages: new Set(),
      frameworks: new Set(),
      dependencies: new Set(),
      entryPoints: [],
      testFiles: [],
      configFiles: [],
      documentationFiles: [],
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      structure: {},
      packageInfo: null
    };

    // Analyze each file
    for (const file of files) {
      if (file.language) {
        analysis.languages.add(file.language);
      }

      // Detect frameworks and libraries
      this.detectFrameworks(file, analysis);
      
      // Categorize files
      this.categorizeFile(file, analysis);
    }

    // Load package.json if exists
    await this.loadPackageInfo(analysis);

    return analysis;
  }

  /**
   * Detect frameworks and libraries from file content
   */
  private async detectFrameworks(file: FileInfo, analysis: ProjectAnalysis): Promise<void> {
    try {
      const content = await fs.readFile(file.path, 'utf8');
      
      // Framework detection patterns
      const patterns = {
        'react': /import.*from\s+['"]react['"]/i,
        'vue': /import.*from\s+['"]vue['"]/i,
        'angular': /import.*from\s+['"]@angular/i,
        'nextjs': /import.*from\s+['"]next['"]/i,
        'express': /import.*from\s+['"]express['"]/i,
        'fastify': /import.*from\s+['"]fastify['"]/i,
        'koa': /import.*from\s+['"]koa['"]/i,
        'jest': /import.*from\s+['"]jest['"]/i,
        'vitest': /import.*from\s+['"]vitest['"]/i,
        'mocha': /import.*from\s+['"]mocha['"]/i,
        'typescript': /import.*from\s+['"]typescript['"]/i,
        'webpack': /import.*from\s+['"]webpack['"]/i,
        'vite': /import.*from\s+['"]vite['"]/i,
        'eslint': /import.*from\s+['"]eslint['"]/i,
        'prettier': /import.*from\s+['"]prettier['"]/i
      };

      for (const [framework, pattern] of Object.entries(patterns)) {
        if (pattern.test(content)) {
          analysis.frameworks.add(framework);
        }
      }
    } catch (error) {
      // Skip files that can't be read
      logger.debug(`Could not read file for framework detection: ${file.path}`);
    }
  }

  /**
   * Categorize file based on path and name
   */
  private categorizeFile(file: FileInfo, analysis: ProjectAnalysis): void {
    const fileName = path.basename(file.path);
    const relativePath = file.relativePath;

    // Entry points
    if (fileName === 'index.js' || fileName === 'index.ts' || fileName === 'main.js' || fileName === 'main.ts') {
      analysis.entryPoints.push(relativePath);
    }

    // Test files
    if (fileName.includes('.test.') || fileName.includes('.spec.') || fileName.includes('__tests__')) {
      analysis.testFiles.push(relativePath);
    }

    // Config files
    if (fileName.match(/\.(json|yaml|yml|toml|ini|js|ts)$/) && 
        (fileName.includes('config') || fileName.includes('webpack') || fileName.includes('babel'))) {
      analysis.configFiles.push(relativePath);
    }

    // Documentation files
    if (fileName.match(/\.(md|txt|rst)$/i)) {
      analysis.documentationFiles.push(relativePath);
    }
  }

  /**
   * Load package.json information
   */
  private async loadPackageInfo(analysis: ProjectAnalysis): Promise<void> {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      
      analysis.packageInfo = {
        name: packageData.name || 'Unknown',
        version: packageData.version || '1.0.0',
        description: packageData.description || '',
        main: packageData.main || 'index.js',
        scripts: packageData.scripts || {},
        dependencies: Object.keys(packageData.dependencies || {}),
        devDependencies: Object.keys(packageData.devDependencies || {}),
        keywords: packageData.keywords || [],
        author: packageData.author || '',
        license: packageData.license || 'MIT'
      };
    } catch (error) {
      logger.debug('No package.json found or could not be read');
    }
  }

  /**
   * Generate README content based on analysis
   */
  private async generateReadmeContent(analysis: ProjectAnalysis, template: string): Promise<string> {
    if (template === 'minimal') {
      return this.generateMinimalReadme(analysis);
    } else {
      return this.generateComprehensiveReadme(analysis);
    }
  }

  /**
   * Generate minimal README
   */
  private generateMinimalReadme(analysis: ProjectAnalysis): string {
    const projectName = analysis.packageInfo?.name || 'Project';
    const description = analysis.packageInfo?.description || 'A software project';
    
    return `# ${projectName}

${description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

---
*Generated by Hydro on ${new Date().toISOString().split('T')[0]}*
`;
  }

  /**
   * Generate comprehensive README
   */
  private generateComprehensiveReadme(analysis: ProjectAnalysis): string {
    const projectName = analysis.packageInfo?.name || 'Project';
    const description = analysis.packageInfo?.description || 'A software project';
    const version = analysis.packageInfo?.version || '1.0.0';
    const license = analysis.packageInfo?.license || 'MIT';
    
    let content = `# ${projectName}

[![Version](https://img.shields.io/badge/version-${version}-blue.svg)](https://github.com/your-username/${projectName})
[![License](https://img.shields.io/badge/license-${license}-green.svg)](LICENSE)

${description}

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/your-username/${projectName}.git
cd ${projectName}

# Install dependencies
npm install
\`\`\`

## 📖 Usage

\`\`\`bash
# Start the application
npm start

# Run in development mode
npm run dev

# Build for production
npm run build
\`\`\`

## 🏗️ Project Structure

\`\`\`
${this.generateProjectStructure(analysis)}
\`\`\`

## 🛠️ Development

### Prerequisites

- Node.js ${this.getNodeVersion()}
- npm or yarn

### Available Scripts

${this.generateScriptsSection(analysis)}

### Code Quality

This project uses:
${this.generateQualityTools(analysis)}

## 🧪 Testing

\`\`\`bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ${license} License - see the [LICENSE](LICENSE) file for details.

---

*Generated by [Hydro](https://github.com/hydro-cli/hydro) on ${new Date().toISOString().split('T')[0]}*
`;

    return content;
  }

  /**
   * Generate project structure tree
   */
  private generateProjectStructure(_analysis: ProjectAnalysis): string {
    // This is a simplified version - in a real implementation,
    // you'd want to build an actual directory tree
    return `project/
├── src/
│   ├── components/
│   ├── utils/
│   └── index.js
├── tests/
├── docs/
├── package.json
└── README.md`;
  }

  /**
   * Generate scripts section
   */
  private generateScriptsSection(analysis: ProjectAnalysis): string {
    if (!analysis.packageInfo?.scripts) {
      return 'No scripts defined in package.json';
    }

    let scripts = '';
    for (const [script, command] of Object.entries(analysis.packageInfo.scripts)) {
      scripts += `- **${script}**: \`${command}\`\n`;
    }
    return scripts;
  }

  /**
   * Generate quality tools section
   */
  private generateQualityTools(analysis: ProjectAnalysis): string {
    const tools = [];
    
    if (analysis.frameworks.has('eslint')) tools.push('- ESLint for code linting');
    if (analysis.frameworks.has('prettier')) tools.push('- Prettier for code formatting');
    if (analysis.frameworks.has('jest') || analysis.frameworks.has('vitest')) tools.push('- Jest/Vitest for testing');
    if (analysis.frameworks.has('typescript')) tools.push('- TypeScript for type checking');
    
    return tools.length > 0 ? tools.join('\n') : '- Standard JavaScript/Node.js tools';
  }

  /**
   * Get Node.js version requirement
   */
  private getNodeVersion(): string {
    // This would typically read from .nvmrc or package.json engines
    return '>=16.0.0';
  }
}

// Types for project analysis
interface ProjectAnalysis {
  languages: Set<string>;
  frameworks: Set<string>;
  dependencies: Set<string>;
  entryPoints: string[];
  testFiles: string[];
  configFiles: string[];
  documentationFiles: string[];
  totalFiles: number;
  totalSize: number;
  structure: Record<string, unknown>;
  packageInfo: PackageInfo | null;
}

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  main: string;
  scripts: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
  keywords: string[];
  author: string;
  license: string;
}
