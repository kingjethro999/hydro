/**
 * Plugin manager for extensible analyzers and commands
 */

import fs from 'fs-extra';
import path from 'path';

import { logger } from '@/core/logger';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'analyzer' | 'command' | 'visualizer' | 'generator';
  entryPoint: string;
  dependencies?: string[];
  config?: PluginConfig;
  enabled: boolean;
}

export interface PluginConfig {
  [key: string]: any;
}

export interface PluginContext {
  projectPath: string;
  config: any;
  files: any[];
  logger: typeof logger;
}

export interface AnalyzerPlugin extends Plugin {
  type: 'analyzer';
  analyze: (context: PluginContext) => Promise<any[]>;
  calculateMetrics?: (context: PluginContext) => Promise<any>;
}

export interface CommandPlugin extends Plugin {
  type: 'command';
  command: string;
  description: string;
  options: PluginOption[];
  execute: (context: PluginContext, options: any) => Promise<void>;
}

export interface VisualizerPlugin extends Plugin {
  type: 'visualizer';
  generate: (context: PluginContext, data: any) => Promise<string>;
  supportedFormats: string[];
}

export interface GeneratorPlugin extends Plugin {
  type: 'generator';
  generate: (context: PluginContext, options: any) => Promise<string[]>;
  templates: string[];
}

export interface PluginOption {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

export class PluginManager {
  private static instance: PluginManager;
  private plugins = new Map<string, Plugin>();
  private pluginDir = '.hydro/plugins';
  private enabledPlugins = new Set<string>();

  private constructor() {}

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Initialize plugin manager
   */
  public async initialize(): Promise<void> {
    try {
      await fs.ensureDir(this.pluginDir);
      await this.loadPlugins();
      logger.info(`Plugin manager initialized with ${this.plugins.size} plugins`);
    } catch (error) {
      logger.error('Failed to initialize plugin manager', error as Error);
    }
  }

  /**
   * Load all plugins from the plugins directory
   */
  public async loadPlugins(): Promise<void> {
    try {
      const pluginFiles = await fs.readdir(this.pluginDir);
      
      for (const file of pluginFiles) {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          try {
            const pluginPath = path.join(this.pluginDir, file);
            const plugin = await this.loadPlugin(pluginPath);
            if (plugin) {
              this.plugins.set(plugin.id, plugin);
              logger.debug(`Loaded plugin: ${plugin.name} v${plugin.version}`);
            }
          } catch (error) {
            logger.debug(`Failed to load plugin ${file}: ${error}`);
          }
        }
      }
    } catch (error) {
      logger.debug('No plugins directory found or could not read plugins');
    }
  }

  /**
   * Load a single plugin
   */
  private async loadPlugin(pluginPath: string): Promise<Plugin | null> {
    try {
      const pluginModule = await import(pluginPath);
      const plugin = pluginModule.default || pluginModule;
      
      if (!this.validatePlugin(plugin)) {
        logger.warn(`Invalid plugin at ${pluginPath}`);
        return null;
      }

      return {
        ...plugin,
        enabled: true
      };
    } catch (error) {
      logger.debug(`Failed to load plugin at ${pluginPath}: ${error}`);
      return null;
    }
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: any): boolean {
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'type', 'entryPoint'];
    
    for (const field of requiredFields) {
      if (!plugin[field]) {
        return false;
      }
    }

    if (!['analyzer', 'command', 'visualizer', 'generator'].includes(plugin.type)) {
      return false;
    }

    return true;
  }

  /**
   * Register a plugin
   */
  public registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.id, plugin);
    logger.info(`Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Get all plugins
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by type
   */
  public getPluginsByType(type: Plugin['type']): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.type === type);
  }

  /**
   * Get enabled plugins
   */
  public getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.enabled);
  }

  /**
   * Enable a plugin
   */
  public enablePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = true;
      this.enabledPlugins.add(pluginId);
      logger.info(`Enabled plugin: ${plugin.name}`);
      return true;
    }
    return false;
  }

  /**
   * Disable a plugin
   */
  public disablePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
      this.enabledPlugins.delete(pluginId);
      logger.info(`Disabled plugin: ${plugin.name}`);
      return true;
    }
    return false;
  }

  /**
   * Execute an analyzer plugin
   */
  public async executeAnalyzer(
    pluginId: string,
    context: PluginContext
  ): Promise<any[]> {
    const plugin = this.plugins.get(pluginId) as AnalyzerPlugin;
    if (!plugin || plugin.type !== 'analyzer' || !plugin.enabled) {
      throw new Error(`Analyzer plugin ${pluginId} not found or disabled`);
    }

    try {
      const results = await plugin.analyze(context);
      logger.debug(`Analyzer plugin ${plugin.name} executed successfully`);
      return results;
    } catch (error) {
      logger.error(`Analyzer plugin ${plugin.name} failed`, error as Error);
      throw error;
    }
  }

  /**
   * Execute a command plugin
   */
  public async executeCommand(
    pluginId: string,
    context: PluginContext,
    options: any
  ): Promise<void> {
    const plugin = this.plugins.get(pluginId) as CommandPlugin;
    if (!plugin || plugin.type !== 'command' || !plugin.enabled) {
      throw new Error(`Command plugin ${pluginId} not found or disabled`);
    }

    try {
      await plugin.execute(context, options);
      logger.debug(`Command plugin ${plugin.name} executed successfully`);
    } catch (error) {
      logger.error(`Command plugin ${plugin.name} failed`, error as Error);
      throw error;
    }
  }

  /**
   * Execute a visualizer plugin
   */
  public async executeVisualizer(
    pluginId: string,
    context: PluginContext,
    data: any
  ): Promise<string> {
    const plugin = this.plugins.get(pluginId) as VisualizerPlugin;
    if (!plugin || plugin.type !== 'visualizer' || !plugin.enabled) {
      throw new Error(`Visualizer plugin ${pluginId} not found or disabled`);
    }

    try {
      const result = await plugin.generate(context, data);
      logger.debug(`Visualizer plugin ${plugin.name} executed successfully`);
      return result;
    } catch (error) {
      logger.error(`Visualizer plugin ${plugin.name} failed`, error as Error);
      throw error;
    }
  }

  /**
   * Execute a generator plugin
   */
  public async executeGenerator(
    pluginId: string,
    context: PluginContext,
    options: any
  ): Promise<string[]> {
    const plugin = this.plugins.get(pluginId) as GeneratorPlugin;
    if (!plugin || plugin.type !== 'generator' || !plugin.enabled) {
      throw new Error(`Generator plugin ${pluginId} not found or disabled`);
    }

    try {
      const results = await plugin.generate(context, options);
      logger.debug(`Generator plugin ${plugin.name} executed successfully`);
      return results;
    } catch (error) {
      logger.error(`Generator plugin ${plugin.name} failed`, error as Error);
      throw error;
    }
  }

  /**
   * Get plugin configuration
   */
  public getPluginConfig(pluginId: string): PluginConfig | undefined {
    const plugin = this.plugins.get(pluginId);
    return plugin?.config;
  }

  /**
   * Update plugin configuration
   */
  public updatePluginConfig(pluginId: string, config: PluginConfig): boolean {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.config = { ...plugin.config, ...config };
      logger.info(`Updated configuration for plugin: ${plugin.name}`);
      return true;
    }
    return false;
  }

  /**
   * Install a plugin from a package
   */
  public async installPlugin(packageName: string): Promise<boolean> {
    try {
      // This would normally install from npm or other package managers
      logger.info(`Installing plugin: ${packageName}`);
      
      // For now, just simulate installation
      const mockPlugin: Plugin = {
        id: packageName,
        name: packageName,
        version: '1.0.0',
        description: `Installed plugin: ${packageName}`,
        author: 'Unknown',
        type: 'analyzer',
        entryPoint: `node_modules/${packageName}/index.js`,
        enabled: true
      };

      this.registerPlugin(mockPlugin);
      return true;
    } catch (error) {
      logger.error(`Failed to install plugin ${packageName}`, error as Error);
      return false;
    }
  }

  /**
   * Uninstall a plugin
   */
  public async uninstallPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      this.plugins.delete(pluginId);
      this.enabledPlugins.delete(pluginId);
      logger.info(`Uninstalled plugin: ${plugin.name}`);
      return true;
    }
    return false;
  }

  /**
   * List all available plugins
   */
  public listPlugins(): void {
    logger.raw('\n🔌 Available Plugins:');
    logger.raw('─'.repeat(20));

    if (this.plugins.size === 0) {
      logger.raw('No plugins installed');
      return;
    }

    const pluginsByType = this.groupPluginsByType();
    
    Object.entries(pluginsByType).forEach(([type, plugins]) => {
      logger.raw(`\n${type.toUpperCase()} (${plugins.length}):`);
      plugins.forEach(plugin => {
        const status = plugin.enabled ? '✅' : '❌';
        logger.raw(`  ${status} ${plugin.name} v${plugin.version} - ${plugin.description}`);
      });
    });
  }

  /**
   * Group plugins by type
   */
  private groupPluginsByType(): Record<string, Plugin[]> {
    const grouped: Record<string, Plugin[]> = {};
    
    for (const plugin of this.plugins.values()) {
      if (!grouped[plugin.type]) {
        grouped[plugin.type] = [];
      }
      const typeGroup = grouped[plugin.type];
      if (typeGroup) {
        typeGroup.push(plugin);
      }
    }

    return grouped;
  }
}
