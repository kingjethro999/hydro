/**
 * Init command - Initialize Hydro configuration
 */

import inquirer from 'inquirer';
import path from 'path';

import { BaseCommand } from './base';
import { ConfigManager } from '@/core/config';
import { logger } from '@/core/logger';

import type { CommandOptions, HydroConfig } from '@/types';

export class InitCommand extends BaseCommand {
  constructor() {
    super('init', 'Initialize Hydro configuration in the current project');
    
    this.command
      .option('-f, --force', 'Overwrite existing configuration', false)
      .option('--template <template>', 'Use configuration template (basic|advanced|minimal)')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(options: CommandOptions & { force?: boolean; template?: string }): Promise<void> {
    const configManager = ConfigManager.getInstance();
    const projectPath = process.cwd();
    const projectName = path.basename(projectPath);

    logger.info(`Initializing Hydro in ${projectName}...`);

    // Check if config already exists
    const configExists = await configManager.configExists();
    if (configExists && !options.force) {
      const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Configuration file already exists. Overwrite?',
          default: false,
        },
      ]);

      if (!overwrite) {
        logger.info('Initialization cancelled.');
        return;
      }
    }

    let config: HydroConfig;

    if (options.template) {
      config = await this.createFromTemplate(options.template, projectName);
    } else {
      config = await this.createInteractiveConfig(projectName);
    }

    // Save configuration
    await configManager.saveConfig(config);
    
    // Create initial directory structure
    await this.createDirectoryStructure(config);

    logger.success('Hydro configuration initialized successfully!');
    logger.info('\nNext steps:');
    logger.info('1. Review the generated hydro.yml file');
    logger.info('2. Run "hydro scan" to analyze your project');
    logger.info('3. Run "hydro analyze --cycles" to check for circular dependencies');
  }

  /**
   * Create configuration from template
   */
  private async createFromTemplate(template: string, projectName: string): Promise<HydroConfig> {
    const configManager = ConfigManager.getInstance();
    const baseConfig = await configManager.createDefaultConfig(process.cwd());

    switch (template.toLowerCase()) {
      case 'minimal':
        return {
          ...baseConfig,
          project: projectName,
          scan: {
            include: ['src'],
            exclude: ['node_modules', 'dist', '.git'],
          },
          rules: {
            complexity: {
              maxFunctionLines: 50,
            },
          },
          safety: {
            dryRunDefault: true,
            applyRequiresTests: false,
          },
        };

      case 'advanced':
        return {
          ...baseConfig,
          project: projectName,
          rules: {
            naming: {
              style: 'camelCase',
              exceptions: ['API_KEY', 'DB_URL'],
            },
            complexity: {
              maxFunctionLines: 120,
              maxCyclomaticComplexity: 10,
              maxParameterCount: 5,
            },
            sql: {
              dialect: 'postgres',
              maxQueryLength: 1000,
              allowRawQueries: false,
            },
            dependencies: {
              upgradeStrategy: 'safe',
              allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
            },
          },
          hooks: {
            preCommit: [
              'hydro fmt --check',
              'hydro analyze --cycles',
              'hydro sql-lint',
            ],
            ci: {
              provider: 'github',
              workflow: '.github/workflows/hydro-ci.yml',
            },
          },
        };

      case 'basic':
      default:
        return {
          ...baseConfig,
          project: projectName,
        };
    }
  }

  /**
   * Create configuration through interactive prompts
   */
  private async createInteractiveConfig(projectName: string): Promise<HydroConfig> {
    const configManager = ConfigManager.getInstance();
    const baseConfig = await configManager.createDefaultConfig(process.cwd());

    const answers = await inquirer.prompt<{
      projectName: string;
      languages: string[];
      includePaths: string;
      namingStyle: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
      maxFunctionLines: number;
      sqlDialect?: 'postgres' | 'mysql' | 'sqlite' | 'mssql';
      upgradeStrategy: 'safe' | 'latest' | 'conservative';
      setupHooks: boolean;
      ciProvider?: 'github' | 'gitlab' | 'circleci' | 'jenkins';
    }>([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: projectName,
      },
      {
        type: 'checkbox',
        name: 'languages',
        message: 'Select languages used in your project:',
        choices: [
          'javascript',
          'typescript',
          'python',
          'java',
          'go',
          'rust',
          'php',
          'ruby',
          'csharp',
          'sql',
        ],
        default: baseConfig.languages,
      },
      {
        type: 'input',
        name: 'includePaths',
        message: 'Paths to scan (comma-separated):',
        default: baseConfig.scan.include.join(', '),
      },
      {
        type: 'list',
        name: 'namingStyle',
        message: 'Preferred naming convention:',
        choices: ['camelCase', 'snake_case', 'PascalCase', 'kebab-case'],
        default: 'camelCase',
      },
      {
        type: 'number',
        name: 'maxFunctionLines',
        message: 'Maximum function length (lines):',
        default: 120,
        validate: (input: number) => input > 0 || 'Must be a positive number',
      },
      {
        type: 'list',
        name: 'sqlDialect',
        message: 'SQL dialect (if applicable):',
        choices: ['postgres', 'mysql', 'sqlite', 'mssql', 'none'],
        default: 'postgres',
        when: (answers) => answers.languages.includes('sql'),
      },
      {
        type: 'list',
        name: 'upgradeStrategy',
        message: 'Dependency upgrade strategy:',
        choices: [
          { name: 'Safe (patch versions only)', value: 'safe' },
          { name: 'Latest (all updates)', value: 'latest' },
          { name: 'Conservative (manual review)', value: 'conservative' },
        ],
        default: 'safe',
      },
      {
        type: 'confirm',
        name: 'setupHooks',
        message: 'Setup Git hooks for pre-commit checks?',
        default: true,
      },
      {
        type: 'list',
        name: 'ciProvider',
        message: 'CI/CD provider:',
        choices: ['github', 'gitlab', 'circleci', 'jenkins', 'none'],
        default: 'github',
        when: (answers) => answers.setupHooks,
      },
    ]);

    const config: HydroConfig = {
      ...baseConfig,
      project: answers.projectName,
      languages: answers.languages,
      scan: {
        ...baseConfig.scan,
        include: answers.includePaths.split(',').map(p => p.trim()),
      },
      rules: {
        naming: {
          style: answers.namingStyle,
        },
        complexity: {
          maxFunctionLines: answers.maxFunctionLines,
          maxCyclomaticComplexity: 10,
          maxParameterCount: 5,
        },
        ...(answers.sqlDialect && {
          sql: {
            dialect: answers.sqlDialect,
            allowRawQueries: false,
          },
        }),
        dependencies: {
          upgradeStrategy: answers.upgradeStrategy,
        },
      },
    };

    if (answers.setupHooks) {
      config.hooks = {
        preCommit: ['hydro fmt --check', 'hydro analyze --cycles'],
        ...(answers.ciProvider && {
          ci: {
            provider: answers.ciProvider,
          },
        }),
      };
    }

    return config;
  }

  /**
   * Create initial directory structure
   */
  private async createDirectoryStructure(config: HydroConfig): Promise<void> {
    const fs = await import('fs-extra');
    
    // Create output directories
    await fs.ensureDir(config.outputs.reports);
    if (config.outputs.codemods) {
      await fs.ensureDir(config.outputs.codemods);
    }

    // Create logs directory
    await fs.ensureDir('.hydro/logs');

    // Create gitignore entries
    const gitignorePath = '.gitignore';
    const hydroIgnoreEntries = [
      '',
      '# Hydro generated files',
      '.hydro/',
      'hydro-report.json',
      '*.dot',
    ];

    try {
      const existingGitignore = await fs.readFile(gitignorePath, 'utf8');
      if (!existingGitignore.includes('.hydro/')) {
        await fs.appendFile(gitignorePath, hydroIgnoreEntries.join('\n') + '\n');
      }
    } catch {
      // .gitignore doesn't exist, create it
      await fs.writeFile(gitignorePath, hydroIgnoreEntries.join('\n') + '\n');
    }

    // Create sample CI workflow if requested
    if (config.hooks?.ci?.provider === 'github') {
      await this.createGitHubWorkflow();
    }
  }

  /**
   * Create GitHub Actions workflow
   */
  private async createGitHubWorkflow(): Promise<void> {
    const fs = await import('fs-extra');
    const workflowPath = '.github/workflows/hydro-ci.yml';

    const workflow = `name: Hydro Code Quality Checks

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  hydro-analysis:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Hydro
        run: npm install -g hydro-cli
      
      - name: Run Hydro analysis
        run: |
          hydro scan --full --path src --format json > hydro-report.json
          hydro analyze --cycles --path src
      
      - name: Upload Hydro report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: hydro-report
          path: hydro-report.json
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            try {
              const report = JSON.parse(fs.readFileSync('hydro-report.json', 'utf8'));
              const comment = \`## 🔍 Hydro Analysis Results
              
              **Files analyzed:** \${report.summary.totalFiles}
              **Issues found:** \${report.summary.issueCount}
              **Tech debt score:** \${report.summary.techDebtScore}
              
              \${report.summary.issueCount > 0 ? '⚠️ Issues detected. Please review the full report.' : '✅ No issues detected!'}
              \`;
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            } catch (error) {
              console.log('Could not post comment:', error.message);
            }
`;

    await fs.ensureDir('.github/workflows');
    await fs.writeFile(workflowPath, workflow);
    logger.info('Created GitHub Actions workflow: .github/workflows/hydro-ci.yml');
  }
}
