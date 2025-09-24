/**
 * CodeMap command - Generate visual dependency and architecture maps
 */

import path from 'path';

import { BaseCommand } from './base';
import { FileScanner } from '@/core/file-scanner';
import { DependencyAnalyzer } from '@/analyzers/dependency-analyzer';
import { logger } from '@/core/logger';

import type { CommandOptions } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

export class CodeMapCommand extends BaseCommand {
  constructor() {
    super('codemap', 'Generate visual maps of code structure and dependencies');
    
    this.command
      .option('--type <type>', 'Map type: dependencies|complexity|hotspots|all', 'dependencies')
      .option('--depth <number>', 'Maximum depth for dependency traversal', '5')
      .option('--min-size <bytes>', 'Minimum file size to include in hotspots', '1000')
      .option('--include-external', 'Include external dependencies in map', false)
      .option('--output-format <format>', 'Output format: dot|json|html', 'dot')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      type?: string;
      depth?: string;
      minSize?: string;
      includeExternal?: boolean;
      outputFormat?: string;
    }
  ): Promise<void> {
    const config = await this.loadConfig();
    const targetPath = this.getTargetPath(options);
    const outputDir = await this.ensureOutputDir(config);

    const mapType = options.type || 'dependencies';
    const outputFormat = options.outputFormat || 'dot';

    logger.info(`Generating ${mapType} map for: ${targetPath}`);

    const scanner = new FileScanner();
    const scanResult = await scanner.scanFiles(targetPath, config.scan);

    if (scanResult.totalFiles === 0) {
      logger.warn('No files found to map.');
      return;
    }

    switch (mapType) {
      case 'dependencies':
        await this.generateDependencyMap(scanResult.files, outputDir, outputFormat, options);
        break;
      case 'complexity':
        await this.generateComplexityMap(scanResult.files, outputDir, outputFormat, options);
        break;
      case 'hotspots':
        await this.generateHotspotsMap(scanResult.files, outputDir, outputFormat, options);
        break;
      case 'all':
        await this.generateDependencyMap(scanResult.files, outputDir, outputFormat, options);
        await this.generateComplexityMap(scanResult.files, outputDir, outputFormat, options);
        await this.generateHotspotsMap(scanResult.files, outputDir, outputFormat, options);
        break;
      default:
        throw new Error(`Unknown map type: ${mapType}`);
    }

    logger.success('Code map generation complete!');
    this.displayUsageInstructions(outputFormat, outputDir);
  }

  /**
   * Generate dependency map
   */
  private async generateDependencyMap(
    files: FileInfo[],
    outputDir: string,
    format: string,
    options: CommandOptions
  ): Promise<void> {
    const spinner = logger.createSpinner('Generating dependency map...');
    spinner.start();

    try {
      const analyzer = new DependencyAnalyzer();
      const codeFiles = files.filter(f => this.isAnalyzableFile(f));
      
      if (format === 'dot') {
        const dotPath = path.join(outputDir, 'dependency-map.dot');
        await analyzer.exportDependencyGraph(codeFiles, dotPath);
        spinner.succeed(`Dependency map saved to: ${dotPath}`);
      } else if (format === 'json') {
        const dependencyData = await this.buildDependencyData(codeFiles, options);
        const jsonPath = await this.saveOutput(
          dependencyData,
          'dependency-map',
          'json',
          outputDir
        );
        spinner.succeed(`Dependency data saved to: ${jsonPath}`);
      } else if (format === 'html') {
        const htmlPath = await this.generateInteractiveMap(codeFiles, outputDir, 'dependencies');
        spinner.succeed(`Interactive dependency map saved to: ${htmlPath}`);
      }
    } catch (error) {
      spinner.fail('Dependency map generation failed');
      throw error;
    }
  }

  /**
   * Generate complexity map
   */
  private async generateComplexityMap(
    files: FileInfo[],
    outputDir: string,
    format: string,
    options: CommandOptions
  ): Promise<void> {
    const spinner = logger.createSpinner('Generating complexity map...');
    spinner.start();

    try {
      const { ComplexityAnalyzer } = await import('@/analyzers/complexity-analyzer');
      const analyzer = new ComplexityAnalyzer();
      const codeFiles = files.filter(f => this.isAnalyzableFile(f));
      
      const issues = await analyzer.analyze(codeFiles, { maxFunctionLines: 50 });
      const complexityData = this.buildComplexityData(codeFiles, issues);

      if (format === 'dot') {
        const dotContent = this.generateComplexityDot(complexityData);
        const dotPath = path.join(outputDir, 'complexity-map.dot');
        const fs = await import('fs-extra');
        await fs.writeFile(dotPath, dotContent);
        spinner.succeed(`Complexity map saved to: ${dotPath}`);
      } else if (format === 'json') {
        const jsonPath = await this.saveOutput(
          complexityData,
          'complexity-map',
          'json',
          outputDir
        );
        spinner.succeed(`Complexity data saved to: ${jsonPath}`);
      } else if (format === 'html') {
        const htmlPath = await this.generateInteractiveMap(codeFiles, outputDir, 'complexity', complexityData);
        spinner.succeed(`Interactive complexity map saved to: ${htmlPath}`);
      }
    } catch (error) {
      spinner.fail('Complexity map generation failed');
      throw error;
    }
  }

  /**
   * Generate hotspots map
   */
  private async generateHotspotsMap(
    files: FileInfo[],
    outputDir: string,
    format: string,
    options: CommandOptions & { minSize?: string }
  ): Promise<void> {
    const spinner = logger.createSpinner('Generating hotspots map...');
    spinner.start();

    try {
      const minSize = parseInt(options.minSize || '1000', 10);
      const scanner = new FileScanner();
      
      // Find large files
      const largeFiles = scanner.filterByMinSize(files, minSize);
      const sortedFiles = scanner.sortBySize(largeFiles);
      
      const hotspotsData = {
        timestamp: new Date(),
        criteria: { minSize },
        hotspots: sortedFiles.slice(0, 50).map(file => ({
          file: file.relativePath,
          size: file.size,
          language: file.language,
          lastModified: file.lastModified,
          sizeCategory: this.categorizeSizeFile(file.size),
        })),
      };

      if (format === 'dot') {
        const dotContent = this.generateHotspotsDot(hotspotsData);
        const dotPath = path.join(outputDir, 'hotspots-map.dot');
        const fs = await import('fs-extra');
        await fs.writeFile(dotPath, dotContent);
        spinner.succeed(`Hotspots map saved to: ${dotPath}`);
      } else if (format === 'json') {
        const jsonPath = await this.saveOutput(
          hotspotsData,
          'hotspots-map',
          'json',
          outputDir
        );
        spinner.succeed(`Hotspots data saved to: ${jsonPath}`);
      } else if (format === 'html') {
        const htmlPath = await this.generateInteractiveMap(files, outputDir, 'hotspots', hotspotsData);
        spinner.succeed(`Interactive hotspots map saved to: ${htmlPath}`);
      }
    } catch (error) {
      spinner.fail('Hotspots map generation failed');
      throw error;
    }
  }

  /**
   * Build dependency data structure
   */
  private async buildDependencyData(files: FileInfo[], options: CommandOptions & { depth?: string; includeExternal?: boolean }): Promise<Record<string, unknown>> {
    // const analyzer = new DependencyAnalyzer();
    const maxDepth = parseInt(options.depth || '5', 10);
    
    // This would need to be implemented in the DependencyAnalyzer
    // For now, return a simplified structure
    return {
      timestamp: new Date(),
      options: { maxDepth, includeExternal: options.includeExternal },
      nodes: files.map(file => ({
        id: file.relativePath,
        name: path.basename(file.path),
        size: file.size,
        language: file.language,
      })),
      edges: [], // Would be populated by dependency analysis
    };
  }

  /**
   * Build complexity data structure
   */
  private buildComplexityData(files: FileInfo[], issues: unknown[]): Record<string, unknown> {
    const complexityByFile = issues.reduce((acc: Record<string, { issues: number; maxSeverity: string }>, issue: unknown) => {
      const issueObj = issue as Record<string, unknown>;
      const filePath = issueObj.file as string;
      const severity = issueObj.severity as string;
      
      if (!acc[filePath]) {
        acc[filePath] = { issues: 0, maxSeverity: 'low' };
      }
      const fileData = acc[filePath];
      if (fileData) {
        fileData.issues++;
        if (this.severityLevel(severity) > this.severityLevel(fileData.maxSeverity)) {
          fileData.maxSeverity = severity;
        }
      }
      return acc;
    }, {} as Record<string, { issues: number; maxSeverity: string }>);

    return {
      timestamp: new Date(),
      files: files.map(file => ({
        path: file.relativePath,
        size: file.size,
        language: file.language,
        complexity: complexityByFile[file.relativePath] || { issues: 0, maxSeverity: 'low' },
      })),
    };
  }

  /**
   * Generate DOT content for complexity visualization
   */
  private generateComplexityDot(data: Record<string, unknown>): string {
    let dot = 'digraph Complexity {\n';
    dot += '  rankdir=TB;\n';
    dot += '  node [shape=box, style=filled];\n\n';

    const files = data.files as Array<{ path: string; complexity: { issues: number } }>;
    for (const file of files) {
      const fileName = path.basename(file.path);
      const complexity = file.complexity.issues;
      const color = this.getComplexityColor(complexity);
      const label = `${fileName}\\n${complexity} issues`;
      
      dot += `  "${fileName}" [label="${label}", fillcolor="${color}"];\n`;
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Generate DOT content for hotspots visualization
   */
  private generateHotspotsDot(data: Record<string, unknown>): string {
    let dot = 'digraph Hotspots {\n';
    dot += '  rankdir=TB;\n';
    dot += '  node [shape=circle, style=filled];\n\n';

    const hotspots = data.hotspots as Array<{ file: string; size: number; sizeCategory: string }>;
    for (const hotspot of hotspots) {
      const fileName = path.basename(hotspot.file);
      const sizeKB = Math.round(hotspot.size / 1024);
      const color = this.getSizeColor(hotspot.sizeCategory);
      const label = `${fileName}\\n${sizeKB}KB`;
      
      dot += `  "${fileName}" [label="${label}", fillcolor="${color}"];\n`;
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Generate interactive HTML map
   */
  private async generateInteractiveMap(
    files: FileInfo[],
    outputDir: string,
    type: string,
    data?: Record<string, unknown>
  ): Promise<string> {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Hydro ${type.charAt(0).toUpperCase() + type.slice(1)} Map</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .node { stroke: #fff; stroke-width: 2px; }
        .link { stroke: #999; stroke-opacity: 0.6; }
        .tooltip { position: absolute; padding: 10px; background: rgba(0,0,0,0.8); color: white; border-radius: 5px; pointer-events: none; }
    </style>
</head>
<body>
    <h1>Hydro ${type.charAt(0).toUpperCase() + type.slice(1)} Map</h1>
    <div id="visualization"></div>
    <script>
        const data = ${JSON.stringify(data || { nodes: [], edges: [] })};
        // D3.js visualization code would go here
        console.log('Map data:', data);
    </script>
</body>
</html>`;

    const htmlPath = path.join(outputDir, `${type}-map.html`);
    const fs = await import('fs-extra');
    await fs.writeFile(htmlPath, htmlContent);
    return htmlPath;
  }

  /**
   * Get complexity color for visualization
   */
  private getComplexityColor(issueCount: number): string {
    if (issueCount === 0) return 'lightgreen';
    if (issueCount <= 2) return 'yellow';
    if (issueCount <= 5) return 'orange';
    return 'red';
  }

  /**
   * Get size color for visualization
   */
  private getSizeColor(category: string): string {
    switch (category) {
      case 'small': return 'lightblue';
      case 'medium': return 'yellow';
      case 'large': return 'orange';
      case 'huge': return 'red';
      default: return 'gray';
    }
  }

  /**
   * Categorize file by size
   */
  private categorizeSizeFile(size: number): string {
    if (size < 5000) return 'small';
    if (size < 20000) return 'medium';
    if (size < 50000) return 'large';
    return 'huge';
  }

  /**
   * Get numeric severity level
   */
  private severityLevel(severity: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity as keyof typeof levels] || 1;
  }

  /**
   * Check if file can be analyzed
   */
  private isAnalyzableFile(file: FileInfo): boolean {
    const analyzableLanguages = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust'
    ];
    return file.language ? analyzableLanguages.includes(file.language) : false;
  }

  /**
   * Display usage instructions for generated maps
   */
  private displayUsageInstructions(format: string, outputDir: string): void {
    logger.raw('\n📖 Usage Instructions:');
    logger.raw('─'.repeat(20));

    if (format === 'dot') {
      logger.raw('To generate PNG images from DOT files:');
      logger.raw(`  cd ${outputDir}`);
      logger.raw('  dot -Tpng dependency-map.dot -o dependency-map.png');
      logger.raw('  dot -Tpng complexity-map.dot -o complexity-map.png');
      logger.raw('  dot -Tpng hotspots-map.dot -o hotspots-map.png');
      logger.raw('\nTo generate SVG (scalable):');
      logger.raw('  dot -Tsvg dependency-map.dot -o dependency-map.svg');
    } else if (format === 'html') {
      logger.raw('Open the HTML files in your browser to view interactive maps:');
      logger.raw(`  file://${path.resolve(outputDir)}/dependencies-map.html`);
      logger.raw(`  file://${path.resolve(outputDir)}/complexity-map.html`);
      logger.raw(`  file://${path.resolve(outputDir)}/hotspots-map.html`);
    } else if (format === 'json') {
      logger.raw('JSON files can be used with external visualization tools or custom scripts.');
    }

    logger.raw('\n💡 Tips:');
    logger.raw('• Use --include-external to show external dependencies');
    logger.raw('• Adjust --min-size to focus on larger files in hotspots');
    logger.raw('• Try different --output-format options (dot, json, html)');
  }
}
