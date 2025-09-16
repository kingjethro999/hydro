/**
 * Plugin command - Manage Hydro plugins
 */

import { BaseCommand } from './base';
import { PluginManager } from '@/plugins/plugin-manager';
import { logger } from '@/core/logger';

import type { CommandOptions } from '@/types';

export class PluginCommand extends BaseCommand {
  private pluginManager = PluginManager.getInstance();

  constructor() {
    super('plugin', 'Manage Hydro plugins');
    
    this.command
      .option('--list', 'List all available plugins')
      .option('--install <package>', 'Install a plugin package')
      .option('--uninstall <plugin>', 'Uninstall a plugin')
      .option('--enable <plugin>', 'Enable a plugin')
      .option('--disable <plugin>', 'Disable a plugin')
      .option('--info <plugin>', 'Show plugin information')
      .option('--config <plugin>', 'Configure plugin settings')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      list?: boolean;
      install?: string;
      uninstall?: string;
      enable?: string;
      disable?: string;
      info?: string;
      config?: string;
    }
  ): Promise<void> {
    // Initialize plugin manager
    await this.pluginManager.initialize();

    if (options.list) {
      await this.listPlugins();
    } else if (options.install) {
      await this.installPlugin(options.install);
    } else if (options.uninstall) {
      await this.uninstallPlugin(options.uninstall);
    } else if (options.enable) {
      await this.enablePlugin(options.enable);
    } else if (options.disable) {
      await this.disablePlugin(options.disable);
    } else if (options.info) {
      await this.showPluginInfo(options.info);
    } else if (options.config) {
      await this.configurePlugin(options.config);
    } else {
      this.showHelp();
    }
  }

  /**
   * List all plugins
   */
  private async listPlugins(): Promise<void> {
    const spinner = logger.createSpinner('Loading plugins...');
    spinner.start();

    try {
      await this.pluginManager.loadPlugins();
      spinner.succeed('Plugins loaded');

      this.pluginManager.listPlugins();

      const allPlugins = this.pluginManager.getAllPlugins();
      const enabledPlugins = this.pluginManager.getEnabledPlugins();

      logger.raw(`\n📊 Summary:`);
      logger.raw(`  Total plugins: ${allPlugins.length}`);
      logger.raw(`  Enabled: ${enabledPlugins.length}`);
      logger.raw(`  Disabled: ${allPlugins.length - enabledPlugins.length}`);

    } catch (error) {
      spinner.fail('Failed to load plugins');
      throw error;
    }
  }

  /**
   * Install a plugin
   */
  private async installPlugin(packageName: string): Promise<void> {
    const spinner = logger.createSpinner(`Installing plugin: ${packageName}...`);
    spinner.start();

    try {
      const success = await this.pluginManager.installPlugin(packageName);
      
      if (success) {
        spinner.succeed(`Plugin ${packageName} installed successfully`);
        logger.info('Plugin is now available for use');
      } else {
        spinner.fail(`Failed to install plugin: ${packageName}`);
      }
    } catch (error) {
      spinner.fail('Plugin installation failed');
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  private async uninstallPlugin(pluginId: string): Promise<void> {
    const spinner = logger.createSpinner(`Uninstalling plugin: ${pluginId}...`);
    spinner.start();

    try {
      const success = await this.pluginManager.uninstallPlugin(pluginId);
      
      if (success) {
        spinner.succeed(`Plugin ${pluginId} uninstalled successfully`);
      } else {
        spinner.fail(`Plugin ${pluginId} not found`);
      }
    } catch (error) {
      spinner.fail('Plugin uninstallation failed');
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  private async enablePlugin(pluginId: string): Promise<void> {
    const spinner = logger.createSpinner(`Enabling plugin: ${pluginId}...`);
    spinner.start();

    try {
      const success = this.pluginManager.enablePlugin(pluginId);
      
      if (success) {
        spinner.succeed(`Plugin ${pluginId} enabled successfully`);
      } else {
        spinner.fail(`Plugin ${pluginId} not found`);
      }
    } catch (error) {
      spinner.fail('Failed to enable plugin');
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  private async disablePlugin(pluginId: string): Promise<void> {
    const spinner = logger.createSpinner(`Disabling plugin: ${pluginId}...`);
    spinner.start();

    try {
      const success = this.pluginManager.disablePlugin(pluginId);
      
      if (success) {
        spinner.succeed(`Plugin ${pluginId} disabled successfully`);
      } else {
        spinner.fail(`Plugin ${pluginId} not found`);
      }
    } catch (error) {
      spinner.fail('Failed to disable plugin');
      throw error;
    }
  }

  /**
   * Show plugin information
   */
  private async showPluginInfo(pluginId: string): Promise<void> {
    const spinner = logger.createSpinner(`Loading plugin info: ${pluginId}...`);
    spinner.start();

    try {
      const allPlugins = this.pluginManager.getAllPlugins();
      const plugin = allPlugins.find(p => p.id === pluginId);

      if (!plugin) {
        spinner.fail(`Plugin ${pluginId} not found`);
        return;
      }

      spinner.succeed('Plugin information loaded');

      logger.raw(`\n🔌 Plugin Information: ${plugin.name}`);
      logger.raw('─'.repeat(40));
      logger.raw(`ID: ${plugin.id}`);
      logger.raw(`Name: ${plugin.name}`);
      logger.raw(`Version: ${plugin.version}`);
      logger.raw(`Author: ${plugin.author}`);
      logger.raw(`Type: ${plugin.type}`);
      logger.raw(`Status: ${plugin.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      logger.raw(`Description: ${plugin.description}`);
      logger.raw(`Entry Point: ${plugin.entryPoint}`);

      if (plugin.dependencies && plugin.dependencies.length > 0) {
        logger.raw(`Dependencies: ${plugin.dependencies.join(', ')}`);
      }

      if (plugin.config) {
        logger.raw('\n⚙️  Configuration:');
        Object.entries(plugin.config).forEach(([key, value]) => {
          logger.raw(`  ${key}: ${JSON.stringify(value)}`);
        });
      }

    } catch (error) {
      spinner.fail('Failed to load plugin information');
      throw error;
    }
  }

  /**
   * Configure plugin settings
   */
  private async configurePlugin(pluginId: string): Promise<void> {
    const spinner = logger.createSpinner(`Configuring plugin: ${pluginId}...`);
    spinner.start();

    try {
      const allPlugins = this.pluginManager.getAllPlugins();
      const plugin = allPlugins.find(p => p.id === pluginId);

      if (!plugin) {
        spinner.fail(`Plugin ${pluginId} not found`);
        return;
      }

      spinner.succeed('Plugin configuration loaded');

      logger.raw(`\n⚙️  Configure Plugin: ${plugin.name}`);
      logger.raw('─'.repeat(35));

      // This would normally use inquirer to get user input
      // For now, we'll show current config and suggest manual editing
      const currentConfig = this.pluginManager.getPluginConfig(pluginId);
      
      if (currentConfig) {
        logger.raw('Current configuration:');
        Object.entries(currentConfig).forEach(([key, value]) => {
          logger.raw(`  ${key}: ${JSON.stringify(value)}`);
        });
      } else {
        logger.raw('No configuration found for this plugin');
      }

      logger.raw('\n💡 To configure this plugin:');
      logger.raw('1. Edit the plugin configuration in .hydro/plugins/');
      logger.raw('2. Or use the plugin\'s built-in configuration interface');
      logger.raw('3. Restart Hydro to apply changes');

    } catch (error) {
      spinner.fail('Failed to configure plugin');
      throw error;
    }
  }

  /**
   * Show help for plugin command
   */
  private showHelp(): void {
    logger.raw('\n🔌 Hydro Plugin Manager');
    logger.raw('─'.repeat(22));
    logger.raw('');
    logger.raw('Manage plugins to extend Hydro\'s functionality.');
    logger.raw('');
    logger.raw('Commands:');
    logger.raw('  --list                    List all available plugins');
    logger.raw('  --install <package>       Install a plugin package');
    logger.raw('  --uninstall <plugin>      Uninstall a plugin');
    logger.raw('  --enable <plugin>         Enable a plugin');
    logger.raw('  --disable <plugin>        Disable a plugin');
    logger.raw('  --info <plugin>           Show plugin information');
    logger.raw('  --config <plugin>         Configure plugin settings');
    logger.raw('');
    logger.raw('Examples:');
    logger.raw('  hydro plugin --list');
    logger.raw('  hydro plugin --install hydro-custom-analyzer');
    logger.raw('  hydro plugin --enable my-plugin');
    logger.raw('  hydro plugin --info my-plugin');
    logger.raw('  hydro plugin --config my-plugin');
    logger.raw('');
    logger.raw('Plugin Types:');
    logger.raw('  • analyzer    - Custom code analyzers');
    logger.raw('  • command     - Additional CLI commands');
    logger.raw('  • visualizer  - Custom visualization tools');
    logger.raw('  • generator   - Code generation templates');
  }
}
