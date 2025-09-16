/**
 * Accessibility Analyzer Plugin - Custom plugin example
 * Analyzes code for accessibility issues and WCAG compliance
 */

import { PluginType, Issue } from '@/types';
import { Plugin, PluginContext } from '@/plugins/plugin-manager';
import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { FileInfo } from '@/core/file-scanner';

interface AccessibilityMetrics {
  missingAltText: number;
  colorContrastIssues: number;
  keyboardNavigationIssues: number;
  ariaIssues: number;
}

export class AccessibilityAnalyzerPlugin implements Plugin {
  public readonly id = 'accessibility-analyzer';
  public readonly name = 'accessibility-analyzer';
  public readonly version = '1.0.0';
  public readonly type: PluginType = 'analyzer';
  public readonly description = 'Analyzes code for accessibility issues and WCAG compliance';
  public readonly author = 'Hydro Team';
  public readonly entryPoint = './accessibility-analyzer.js';
  public readonly dependencies: string[] = [];
  public readonly enabled = true;

  private fileScanner = new FileScanner();

  async analyze(context: PluginContext): Promise<Issue[]> {
    const files = context.files;
    const issues: Issue[] = [];
    const webFiles = files.filter((f: FileInfo) => this.isWebFile(f));

    logger.debug(`Accessibility analysis: analyzing ${webFiles.length} files`);

    for (const file of webFiles) {
      try {
        const content = await this.fileScanner.readFileContent(file.path);
        const fileIssues = await this.analyzeFile(file, content);
        issues.push(...fileIssues);
      } catch (error) {
        logger.debug(`Failed to analyze accessibility for ${file.path}: ${error}`);
      }
    }

    return issues;
  }

  private async analyzeFile(file: FileInfo, content: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const lineNumber = i + 1;

      // Check for missing alt text
      if (this.detectMissingAltText(line)) {
        issues.push({
          id: `missing-alt-${file.relativePath}-${lineNumber}`,
          type: 'tech-debt',
          severity: 'high',
          category: 'maintainability',
          title: 'Missing Alt Text',
          description: 'Image element missing alt attribute for accessibility',
          file: file.relativePath,
          line: lineNumber,
          column: 0,
          suggestion: 'Add alt attribute to img element for screen readers',
          autoFixable: true,
        });
      }

      // Check for color contrast issues
      if (this.detectColorContrastIssues(line)) {
        issues.push({
          id: `color-contrast-${file.relativePath}-${lineNumber}`,
          type: 'tech-debt',
          severity: 'medium',
          category: 'maintainability',
          title: 'Potential Color Contrast Issue',
          description: 'Color combination may not meet WCAG contrast requirements',
          file: file.relativePath,
          line: lineNumber,
          column: 0,
          suggestion: 'Ensure color contrast ratio meets WCAG AA standards (4.5:1)',
          autoFixable: false,
        });
      }

      // Check for keyboard navigation issues
      if (this.detectKeyboardNavigationIssues(line)) {
        issues.push({
          id: `keyboard-nav-${file.relativePath}-${lineNumber}`,
          type: 'tech-debt',
          severity: 'high',
          category: 'maintainability',
          title: 'Keyboard Navigation Issue',
          description: 'Interactive element may not be keyboard accessible',
          file: file.relativePath,
          line: lineNumber,
          column: 0,
          suggestion: 'Ensure interactive elements are keyboard accessible with proper tabindex',
          autoFixable: false,
        });
      }

      // Check for ARIA issues
      if (this.detectAriaIssues(line)) {
        issues.push({
          id: `aria-issue-${file.relativePath}-${lineNumber}`,
          type: 'tech-debt',
          severity: 'medium',
          category: 'maintainability',
          title: 'ARIA Implementation Issue',
          description: 'ARIA attribute may be incorrectly implemented',
          file: file.relativePath,
          line: lineNumber,
          column: 0,
          suggestion: 'Review ARIA implementation for proper accessibility support',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  private detectMissingAltText(line: string): boolean {
    const patterns = [
      /<img[^>]*(?!alt=)[^>]*>/i,
      /<img[^>]*alt\s*=\s*["']\s*["'][^>]*>/i,
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private detectColorContrastIssues(line: string): boolean {
    const patterns = [
      /color\s*:\s*#[0-9a-fA-F]{3,6}/i,
      /background-color\s*:\s*#[0-9a-fA-F]{3,6}/i,
      /color\s*:\s*rgb\(/i,
      /background-color\s*:\s*rgb\(/i,
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private detectKeyboardNavigationIssues(line: string): boolean {
    const patterns = [
      /<div[^>]*onclick[^>]*>/i,
      /<span[^>]*onclick[^>]*>/i,
      /<button[^>]*(?!tabindex)[^>]*>/i,
      /<a[^>]*(?!href)[^>]*>/i,
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private detectAriaIssues(line: string): boolean {
    const patterns = [
      /aria-[a-z-]+=""/i,
      /aria-[a-z-]+=\s*["']\s*["']/i,
      /role\s*=\s*["']\s*["']/i,
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private isWebFile(file: FileInfo): boolean {
    const webExtensions = ['.html', '.jsx', '.tsx', '.vue', '.svelte'];
    return webExtensions.some(ext => file.path.endsWith(ext));
  }

  async calculateMetrics(context: PluginContext): Promise<AccessibilityMetrics> {
    const issues = await this.analyze(context);
    
    return {
      missingAltText: issues.filter(i => i.id.includes('missing-alt')).length,
      colorContrastIssues: issues.filter(i => i.id.includes('color-contrast')).length,
      keyboardNavigationIssues: issues.filter(i => i.id.includes('keyboard-nav')).length,
      ariaIssues: issues.filter(i => i.id.includes('aria-issue')).length,
    };
  }
}
