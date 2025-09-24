/**
 * Configuration management for Hydro
 */

import { cosmiconfigSync } from 'cosmiconfig';
import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';

import type { HydroConfig } from '@/types';

// Zod schema for configuration validation
const HydroConfigSchema = z.object({
  project: z.string(),
  languages: z.array(z.string()),
  scan: z.object({
    include: z.array(z.string()),
    exclude: z.array(z.string()),
    maxFileSize: z.number().optional().or(z.undefined()),
    followSymlinks: z.boolean().optional().or(z.undefined()),
  }),
  rules: z.object({
    naming: z.object({
      style: z.enum(['camelCase', 'snake_case', 'PascalCase', 'kebab-case']),
      exceptions: z.array(z.string()).optional(),
    }).optional(),
    complexity: z.object({
      maxFunctionLines: z.number(),
      maxCyclomaticComplexity: z.number().optional(),
      maxParameterCount: z.number().optional(),
    }).optional(),
    sql: z.object({
      dialect: z.enum(['postgres', 'mysql', 'sqlite', 'mssql']),
      maxQueryLength: z.number().optional(),
      allowRawQueries: z.boolean().optional(),
    }).optional(),
    dependencies: z.object({
      upgradeStrategy: z.enum(['safe', 'latest', 'conservative']),
      allowedLicenses: z.array(z.string()).optional(),
      blockedPackages: z.array(z.string()).optional(),
    }).optional(),
  }),
  outputs: z.object({
    reports: z.string(),
    codemods: z.string().optional(),
    format: z.enum(['json', 'yaml', 'csv']).optional(),
  }),
  safety: z.object({
    dryRunDefault: z.boolean(),
    applyRequiresTests: z.boolean(),
    backupBeforeChanges: z.boolean().optional(),
    maxFilesPerOperation: z.number().optional(),
  }),
  hooks: z.object({
    preCommit: z.array(z.string()).optional(),
    ci: z.object({
      provider: z.enum(['github', 'gitlab', 'circleci', 'jenkins']),
      workflow: z.string().optional(),
    }).optional(),
  }).optional(),
});

export class ConfigManager {
  private static instance: ConfigManager;
  private config: HydroConfig | null = null;
  private configPath: string | null = null;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from various sources
   */
  public async loadConfig(searchFrom?: string): Promise<HydroConfig> {
    const explorer = cosmiconfigSync('hydro');
    const searchPath = searchFrom || process.cwd();
    
    const result = explorer.search(searchPath);
    
    if (result) {
      this.configPath = result.filepath;
      const validatedConfig = HydroConfigSchema.parse(result.config) as HydroConfig;
      this.config = validatedConfig;
      return validatedConfig;
    }

    // If no config found, create a default one
    return this.createDefaultConfig(searchPath);
  }

  /**
   * Get current configuration
   */
  public getConfig(): HydroConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Create a default configuration file
   */
  public async createDefaultConfig(projectPath: string): Promise<HydroConfig> {
    const defaultConfig: HydroConfig = {
      project: path.basename(projectPath),
      languages: this.detectLanguages(projectPath),
      scan: {
        include: ['src', 'lib', 'app'],
        exclude: [
          'node_modules',
          'dist',
          'build',
          '.git',
          '.hydro',
          'coverage',
          'test-results',
        ],
        maxFileSize: 1024 * 1024, // 1MB
        followSymlinks: false,
      },
      rules: {
        naming: {
          style: 'camelCase',
        },
        complexity: {
          maxFunctionLines: 120,
          maxCyclomaticComplexity: 10,
          maxParameterCount: 5,
        },
        dependencies: {
          upgradeStrategy: 'safe',
        },
      },
      outputs: {
        reports: '.hydro/reports',
        codemods: '.hydro/codemods',
        format: 'json',
      },
      safety: {
        dryRunDefault: true,
        applyRequiresTests: true,
        backupBeforeChanges: true,
        maxFilesPerOperation: 100,
      },
      hooks: {
        preCommit: ['hydro fmt --check', 'hydro analyze --cycles'],
      },
    };

    this.config = defaultConfig;
    return defaultConfig;
  }

  /**
   * Save configuration to file
   */
  public async saveConfig(config: HydroConfig, filePath?: string): Promise<void> {
    const configPath = filePath || path.join(process.cwd(), 'hydro.yml');
    const yaml = await import('yaml');
    
    const configContent = yaml.stringify(config, {
      indent: 2,
      lineWidth: 80,
      minContentWidth: 20,
    });

    await fs.writeFile(configPath, configContent, 'utf8');
    this.configPath = configPath;
    this.config = config;
  }

  /**
   * Update specific configuration values
   */
  public async updateConfig(updates: Partial<HydroConfig>): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    this.config = { ...this.config, ...updates };
    
    if (this.configPath) {
      await this.saveConfig(this.config, this.configPath);
    }
  }

  /**
   * Validate configuration against schema
   */
  public validateConfig(config: unknown): HydroConfig {
    return HydroConfigSchema.parse(config) as HydroConfig;
  }

  /**
   * Auto-detect programming languages in the project
   */
  private detectLanguages(projectPath: string): string[] {
    const languages: string[] = [];
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.sql': 'sql',
    };

    try {
      const files = fs.readdirSync(projectPath, { recursive: true });
      const extensions = new Set<string>();

      for (const file of files) {
        if (typeof file === 'string') {
          const ext = path.extname(file).toLowerCase();
          const language = languageMap[ext];
          if (language) {
            extensions.add(language);
          }
        }
      }

      languages.push(...Array.from(extensions));
    } catch (error) {
      // Fallback to common languages if directory reading fails
      languages.push('javascript', 'typescript');
    }

    return languages.length > 0 ? languages : ['javascript'];
  }

  /**
   * Get configuration file path
   */
  public getConfigPath(): string | null {
    return this.configPath;
  }

  /**
   * Check if configuration file exists
   */
  public async configExists(searchPath?: string): Promise<boolean> {
    const explorer = cosmiconfigSync('hydro');
    const result = explorer.search(searchPath || process.cwd());
    return result !== null;
  }
}
