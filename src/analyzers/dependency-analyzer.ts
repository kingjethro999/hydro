/**
 * Dependency analyzer for detecting circular dependencies and dependency issues
 */

import fs from 'fs-extra';
import path from 'path';

import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { Issue, DependencyRules, DependencyMetrics } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

interface DependencyNode {
  file: string;
  imports: string[];
  exports: string[];
}

interface CircularPath {
  cycle: string[];
  severity: 'low' | 'medium' | 'high';
}

export class DependencyAnalyzer {
  private fileScanner = new FileScanner();

  /**
   * Analyze files for dependency issues
   */
  public async analyze(
    files: FileInfo[],
    rules?: DependencyRules
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    const codeFiles = files.filter(f => this.isAnalyzableFile(f));

    logger.debug(`Analyzing dependencies for ${codeFiles.length} files`);

    // Build dependency graph
    const dependencyGraph = await this.buildDependencyGraph(codeFiles);
    
    // Find circular dependencies
    const circularDeps = this.findCircularDependencies(dependencyGraph);
    
    for (const circular of circularDeps) {
      issues.push({
        id: `circular-dep-${circular.cycle.join('->')}`,
        type: 'circular-dependency',
        severity: circular.severity,
        category: 'architecture',
        title: 'Circular dependency detected',
        description: `Circular dependency: ${circular.cycle.join(' → ')}`,
        file: circular.cycle[0] || 'unknown',
        suggestion: 'Refactor to remove circular dependency by extracting shared code or inverting dependencies',
        autoFixable: false,
      });
    }

    // Analyze package.json if it exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageIssues = await this.analyzePackageJson(packageJsonPath, rules);
      issues.push(...packageIssues);
    }

    return issues;
  }

  /**
   * Build dependency graph from files
   */
  private async buildDependencyGraph(files: FileInfo[]): Promise<Map<string, DependencyNode>> {
    const graph = new Map<string, DependencyNode>();

    for (const file of files) {
      try {
        const content = await this.fileScanner.readFileContent(file.path);
        const node = this.parseFileDependencies(file, content);
        graph.set(file.relativePath, node);
      } catch (error) {
        logger.debug(`Failed to parse dependencies for ${file.path}: ${error}`);
      }
    }

    return graph;
  }

  /**
   * Parse imports and exports from a file
   */
  private parseFileDependencies(file: FileInfo, content: string): DependencyNode {
    const imports: string[] = [];
    const exports: string[] = [];

    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Parse imports based on language
      if (file.language === 'javascript' || file.language === 'typescript') {
        // ES6 imports
        const es6ImportMatch = trimmedLine.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/);
        if (es6ImportMatch && es6ImportMatch[1]) {
          imports.push(this.resolveImportPath(es6ImportMatch[1], file.path));
          continue;
        }

        // CommonJS require
        const requireMatch = trimmedLine.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (requireMatch && requireMatch[1]) {
          imports.push(this.resolveImportPath(requireMatch[1], file.path));
          continue;
        }

        // Dynamic imports
        const dynamicImportMatch = trimmedLine.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (dynamicImportMatch && dynamicImportMatch[1]) {
          imports.push(this.resolveImportPath(dynamicImportMatch[1], file.path));
          continue;
        }

        // Exports
        if (trimmedLine.startsWith('export')) {
          exports.push(trimmedLine);
        }
      } else if (file.language === 'python') {
        // Python imports
        const pythonImportMatch = trimmedLine.match(/^(?:from\s+(\S+)\s+)?import\s+(.+)/);
        if (pythonImportMatch) {
          const moduleName = pythonImportMatch[1] || (pythonImportMatch[2] ? pythonImportMatch[2].split(',')[0]?.trim() || '' : '');
          if (moduleName) {
            imports.push(moduleName);
          }
          continue;
        }
      } else if (file.language === 'java') {
        // Java imports
        const javaImportMatch = trimmedLine.match(/^import\s+(?:static\s+)?([^;]+);/);
        if (javaImportMatch && javaImportMatch[1]) {
          imports.push(javaImportMatch[1]);
          continue;
        }
      }
    }

    return {
      file: file.relativePath,
      imports: [...new Set(imports)], // Remove duplicates
      exports,
    };
  }

  /**
   * Resolve import path to relative file path
   */
  private resolveImportPath(importPath: string, fromFile: string): string {
    // Skip external packages (not starting with . or /)
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return importPath;
    }

    try {
      const fromDir = path.dirname(fromFile);
      const resolvedPath = path.resolve(fromDir, importPath);
      const relativePath = path.relative(process.cwd(), resolvedPath);
      
      // Try common extensions if file doesn't exist
      const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json'];
      for (const ext of extensions) {
        const pathWithExt = `${relativePath}${ext}`;
        if (fs.existsSync(pathWithExt)) {
          return pathWithExt;
        }
      }

      // Try index files
      for (const ext of extensions) {
        const indexPath = path.join(relativePath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }

      return relativePath;
    } catch {
      return importPath;
    }
  }

  /**
   * Find circular dependencies using DFS
   */
  private findCircularDependencies(graph: Map<string, DependencyNode>): CircularPath[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: CircularPath[] = [];

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          const cycle = [...path.slice(cycleStart), node];
          const severity = this.calculateCycleSeverity(cycle, graph);
          cycles.push({ cycle, severity });
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const dependencies = graph.get(node);
      if (dependencies) {
        for (const dep of dependencies.imports) {
          if (graph.has(dep)) {
            dfs(dep, [...path]);
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const [file] of graph) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    return cycles;
  }

  /**
   * Calculate severity of a circular dependency
   */
  private calculateCycleSeverity(cycle: string[], graph: Map<string, DependencyNode>): 'low' | 'medium' | 'high' {
    const cycleLength = cycle.length - 1; // Subtract 1 because last element is repeated
    
    // Check for deep coupling (many imports between cycle members)
    let totalImports = 0;
    for (let i = 0; i < cycleLength; i++) {
      const cycleItem = cycle[i];
      if (!cycleItem) continue;
      
      const node = graph.get(cycleItem);
      if (node) {
        const importsInCycle = node.imports.filter(imp => cycle.includes(imp));
        totalImports += importsInCycle.length;
      }
    }

    if (cycleLength <= 2 && totalImports <= 2) {
      return 'low';
    } else if (cycleLength <= 4 && totalImports <= 6) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Analyze package.json for dependency issues
   */
  private async analyzePackageJson(packageJsonPath: string, rules?: DependencyRules): Promise<Issue[]> {
    const issues: Issue[] = [];

    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for blocked packages
      if (rules?.blockedPackages) {
        for (const [name] of Object.entries(dependencies)) {
          if (rules.blockedPackages.includes(name)) {
            issues.push({
              id: `blocked-package-${name}`,
              type: 'dependency-issue',
              severity: 'high',
              category: 'security',
              title: 'Blocked package detected',
              description: `Package '${name}' is in the blocked list`,
              file: 'package.json',
              suggestion: `Remove or replace '${name}' with an approved alternative`,
              autoFixable: false,
            });
          }
        }
      }

      // Check for outdated versions (simplified - would need npm registry check for real implementation)
      const outdatedPackages = this.findPotentiallyOutdatedPackages(dependencies);
      for (const pkg of outdatedPackages) {
        issues.push({
          id: `outdated-package-${pkg.name}`,
          type: 'dependency-issue',
          severity: 'low',
          category: 'maintainability',
          title: 'Potentially outdated package',
          description: `Package '${pkg.name}' version '${pkg.version}' may be outdated`,
          file: 'package.json',
          suggestion: `Consider updating '${pkg.name}' to the latest version`,
          autoFixable: true,
        });
      }

    } catch (error) {
      logger.debug(`Failed to analyze package.json: ${error}`);
    }

    return issues;
  }

  /**
   * Find potentially outdated packages (simplified heuristic)
   */
  private findPotentiallyOutdatedPackages(dependencies: Record<string, string>): { name: string; version: string }[] {
    const outdated: { name: string; version: string }[] = [];

    for (const [name, version] of Object.entries(dependencies)) {
      // Simple heuristic: versions with ^ or ~ that are very old major versions
      if (version.match(/^[\^~]?[0-4]\./)) {
        outdated.push({ name, version });
      }
    }

    return outdated;
  }

  /**
   * Calculate dependency metrics
   */
  public async calculateMetrics(files: FileInfo[]): Promise<DependencyMetrics> {
    const codeFiles = files.filter(f => this.isAnalyzableFile(f));
    const dependencyGraph = await this.buildDependencyGraph(codeFiles);
    
    const circularDeps = this.findCircularDependencies(dependencyGraph);
    
    // Count unique external dependencies
    const externalDeps = new Set<string>();
    for (const [, node] of dependencyGraph) {
      for (const imp of node.imports) {
        if (!imp.startsWith('.') && !imp.startsWith('/')) {
          const packageName = imp.split('/')[0];
          if (packageName) {
            externalDeps.add(packageName); // Get package name (handle scoped packages)
          }
        }
      }
    }

    // Analyze package.json for more accurate counts
    let totalDependencies = externalDeps.size;
    let outdatedDependencies = 0;
    let vulnerableDependencies = 0;

    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        totalDependencies = Object.keys(allDeps).length;
        
        // Simplified detection of outdated packages
        outdatedDependencies = this.findPotentiallyOutdatedPackages(allDeps).length;
        
        // Would need security audit integration for real vulnerability detection
        vulnerableDependencies = 0;
      }
    } catch (error) {
      logger.debug(`Failed to read package.json for metrics: ${error}`);
    }

    return {
      totalDependencies,
      outdatedDependencies,
      vulnerableDependencies,
      circularDependencies: circularDeps.length,
    };
  }

  /**
   * Check if file can be analyzed for dependencies
   */
  private isAnalyzableFile(file: FileInfo): boolean {
    const analyzableLanguages = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust'
    ];
    return file.language ? analyzableLanguages.includes(file.language) : false;
  }

  /**
   * Export dependency graph in DOT format for visualization
   */
  public async exportDependencyGraph(files: FileInfo[], outputPath: string): Promise<void> {
    const graph = await this.buildDependencyGraph(files.filter(f => this.isAnalyzableFile(f)));
    
    let dot = 'digraph Dependencies {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';

    for (const [file, node] of graph) {
      const fileName = path.basename(file);
      for (const dep of node.imports) {
        if (graph.has(dep)) {
          const depName = path.basename(dep);
          dot += `  "${fileName}" -> "${depName}";\n`;
        }
      }
    }

    dot += '}\n';

    await fs.writeFile(outputPath, dot, 'utf8');
    logger.info(`Dependency graph exported to: ${outputPath}`);
  }
}
