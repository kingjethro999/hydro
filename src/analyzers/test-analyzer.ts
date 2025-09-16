/**
 * Test analyzer for detecting testing gaps and issues
 */

import path from 'path';

import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { Issue, TestingMetrics } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

interface TestFile {
  file: FileInfo;
  testCount: number;
  testTypes: string[];
  coveredFiles: string[];
}

interface TestGap {
  file: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export class TestAnalyzer {
  private fileScanner = new FileScanner();

  /**
   * Analyze files for testing issues
   */
  public async analyze(files: FileInfo[]): Promise<Issue[]> {
    const issues: Issue[] = [];
    const testFiles = this.identifyTestFiles(files);
    const codeFiles = this.identifyCodeFiles(files);

    logger.debug(`Analyzing testing coverage for ${codeFiles.length} code files and ${testFiles.length} test files`);

    // Analyze test files
    const testFileData = await this.analyzeTestFiles(testFiles);
    
    // Find test gaps
    const testGaps = this.findTestGaps(codeFiles, testFileData);
    
    for (const gap of testGaps) {
      issues.push({
        id: `test-gap-${gap.file}`,
        type: 'test-gap',
        severity: gap.severity,
        category: 'testing',
        title: 'Missing test coverage',
        description: gap.reason,
        file: gap.file,
        suggestion: this.getTestSuggestion(gap.file),
        autoFixable: true,
      });
    }

    // Analyze individual test files for issues
    for (const testFile of testFileData) {
      const testIssues = await this.analyzeTestFile(testFile);
      issues.push(...testIssues);
    }

    return issues;
  }

  /**
   * Calculate testing metrics
   */
  public async calculateMetrics(files: FileInfo[]): Promise<TestingMetrics> {
    const testFiles = this.identifyTestFiles(files);
    const codeFiles = this.identifyCodeFiles(files);
    const testFileData = await this.analyzeTestFiles(testFiles);

    // const totalTests = testFileData.reduce((sum, test) => sum + test.testCount, 0);
    const testToCodeRatio = codeFiles.length > 0 ? testFiles.length / codeFiles.length : 0;

    // Calculate coverage estimate (simplified)
    const coveredFiles = new Set<string>();
    testFileData.forEach(test => {
      test.coveredFiles.forEach(file => coveredFiles.add(file));
    });

    const coverage = codeFiles.length > 0 
      ? Math.round((coveredFiles.size / codeFiles.length) * 100)
      : 0;

    // Detect flaky tests (simplified heuristic)
    const flakyTests = await this.detectFlakyTests(testFileData);

    return {
      coverage,
      testFiles: testFiles.length,
      testToCodeRatio,
      flakyTests,
    };
  }

  /**
   * Identify test files
   */
  private identifyTestFiles(files: FileInfo[]): FileInfo[] {
    return files.filter(file => {
      const fileName = path.basename(file.path).toLowerCase();
      const dirName = path.dirname(file.path).toLowerCase();
      
      return (
        fileName.includes('.test.') ||
        fileName.includes('.spec.') ||
        fileName.endsWith('_test.js') ||
        fileName.endsWith('_test.ts') ||
        fileName.endsWith('_test.py') ||
        fileName.endsWith('Test.java') ||
        dirName.includes('test') ||
        dirName.includes('spec') ||
        dirName.includes('__tests__')
      );
    });
  }

  /**
   * Identify code files (non-test files)
   */
  private identifyCodeFiles(files: FileInfo[]): FileInfo[] {
    const testFiles = new Set(this.identifyTestFiles(files).map(f => f.path));
    return files.filter(file => 
      !testFiles.has(file.path) && 
      this.isCodeFile(file) &&
      !this.isConfigFile(file)
    );
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(file: FileInfo): boolean {
    const codeLanguages = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'php', 'ruby'
    ];
    return file.language ? codeLanguages.includes(file.language) : false;
  }

  /**
   * Check if file is a configuration file
   */
  private isConfigFile(file: FileInfo): boolean {
    const configPatterns = [
      'config', 'package.json', 'tsconfig', 'webpack', 'babel',
      'eslint', 'prettier', '.env', 'docker', 'makefile'
    ];
    
    const fileName = path.basename(file.path).toLowerCase();
    return configPatterns.some(pattern => fileName.includes(pattern));
  }

  /**
   * Analyze test files to extract test information
   */
  private async analyzeTestFiles(testFiles: FileInfo[]): Promise<TestFile[]> {
    const testFileData: TestFile[] = [];

    for (const file of testFiles) {
      try {
        const content = await this.fileScanner.readFileContent(file.path);
        const testData = this.parseTestFile(file, content);
        testFileData.push(testData);
      } catch (error) {
        logger.debug(`Failed to analyze test file ${file.path}: ${error}`);
      }
    }

    return testFileData;
  }

  /**
   * Parse test file to extract test information
   */
  private parseTestFile(file: FileInfo, content: string): TestFile {
    const testPatterns = this.getTestPatterns(file.language || 'javascript');
    let testCount = 0;
    const testTypes: string[] = [];
    const coveredFiles: string[] = [];

    const lines = content.split('\n');

    for (const line of lines) {
      // Count tests
      for (const pattern of testPatterns.test) {
        const matches = line.match(pattern);
        if (matches) {
          testCount++;
          break;
        }
      }

      // Identify test types
      for (const [type, patterns] of Object.entries(testPatterns.types)) {
        for (const pattern of patterns) {
          if (line.match(pattern)) {
            if (!testTypes.includes(type)) {
              testTypes.push(type);
            }
            break;
          }
        }
      }

      // Find imports to identify covered files
      const importMatch = line.match(/(?:import|require|from)\s+.*?['"]([^'"]+)['"]/);
      if (importMatch && importMatch[1]) {
        const importPath = importMatch[1];
        if (importPath.startsWith('.')) {
          // Relative import - likely a file being tested
          const resolvedPath = this.resolveTestImport(importPath, file.path);
          if (resolvedPath) {
            coveredFiles.push(resolvedPath);
          }
        }
      }
    }

    return {
      file,
      testCount,
      testTypes,
      coveredFiles: [...new Set(coveredFiles)],
    };
  }

  /**
   * Get test patterns for different languages
   */
  private getTestPatterns(language: string): {
    test: RegExp[];
    types: Record<string, RegExp[]>;
  } {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return {
          test: [
            /\b(?:test|it|describe)\s*\(/,
            /\btest\s*\(/,
            /\bit\s*\(/,
            /\bdescribe\s*\(/,
          ],
          types: {
            unit: [/\b(?:test|it)\s*\(/],
            integration: [/\bdescribe\s*\(.*integration/i],
            e2e: [/\bdescribe\s*\(.*e2e|end.to.end/i],
            snapshot: [/\.toMatchSnapshot\(\)/],
            mock: [/\b(?:jest\.mock|sinon|stub|spy)\b/],
          },
        };

      case 'python':
        return {
          test: [
            /\bdef\s+test_\w+/,
            /\bclass\s+Test\w+/,
          ],
          types: {
            unit: [/\bdef\s+test_\w+/],
            integration: [/\bclass\s+.*Integration.*Test/i],
            fixture: [/\b@pytest\.fixture\b/],
            mock: [/\b(?:mock|patch|MagicMock)\b/],
          },
        };

      case 'java':
        return {
          test: [
            /@Test\b/,
            /\bpublic\s+void\s+test\w+/,
          ],
          types: {
            unit: [/@Test\b/],
            integration: [/@IntegrationTest\b/],
            mock: [/\b(?:Mockito|@Mock|@InjectMocks)\b/],
          },
        };

      default:
        return {
          test: [/\btest\b/i],
          types: {
            unit: [/\bunit\b/i],
            integration: [/\bintegration\b/i],
          },
        };
    }
  }

  /**
   * Resolve import path in test file
   */
  private resolveTestImport(importPath: string, testFilePath: string): string | null {
    try {
      const testDir = path.dirname(testFilePath);
      const resolvedPath = path.resolve(testDir, importPath);
      return path.relative(process.cwd(), resolvedPath);
    } catch {
      return null;
    }
  }

  /**
   * Find test gaps
   */
  private findTestGaps(codeFiles: FileInfo[], testFiles: TestFile[]): TestGap[] {
    const gaps: TestGap[] = [];
    const coveredFiles = new Set<string>();

    // Collect all covered files
    testFiles.forEach(test => {
      test.coveredFiles.forEach(file => coveredFiles.add(file));
    });

    for (const codeFile of codeFiles) {
      const relativePath = codeFile.relativePath;
      
      // Check if file has corresponding test
      const hasTest = this.hasCorrespondingTest(codeFile, testFiles);
      const isCovered = coveredFiles.has(relativePath);

      if (!hasTest && !isCovered) {
        const severity = this.calculateTestGapSeverity(codeFile);
        gaps.push({
          file: relativePath,
          reason: `No test file found for ${relativePath}`,
          severity,
        });
      }
    }

    return gaps;
  }

  /**
   * Check if code file has corresponding test file
   */
  private hasCorrespondingTest(codeFile: FileInfo, testFiles: TestFile[]): boolean {
    const baseName = path.basename(codeFile.path, path.extname(codeFile.path));
    const testPatterns = [
      `${baseName}.test`,
      `${baseName}.spec`,
      `${baseName}_test`,
      `${baseName}Test`,
    ];

    return testFiles.some(test => {
      const testBaseName = path.basename(test.file.path, path.extname(test.file.path));
      return testPatterns.some(pattern => testBaseName.includes(pattern));
    });
  }

  /**
   * Calculate severity of test gap
   */
  private calculateTestGapSeverity(codeFile: FileInfo): 'low' | 'medium' | 'high' {
    const fileName = path.basename(codeFile.path).toLowerCase();
    const dirName = path.dirname(codeFile.path).toLowerCase();

    // High priority files
    if (
      fileName.includes('auth') ||
      fileName.includes('security') ||
      fileName.includes('payment') ||
      fileName.includes('user') ||
      dirName.includes('api') ||
      dirName.includes('service')
    ) {
      return 'high';
    }

    // Medium priority files
    if (
      fileName.includes('util') ||
      fileName.includes('helper') ||
      fileName.includes('component') ||
      codeFile.size > 5000 // Large files
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Analyze individual test file for issues
   */
  private async analyzeTestFile(testData: TestFile): Promise<Issue[]> {
    const issues: Issue[] = [];
    const file = testData.file;

    // Check for test file without tests
    if (testData.testCount === 0) {
      issues.push({
        id: `empty-test-file-${file.relativePath}`,
        type: 'test-gap',
        severity: 'medium',
        category: 'testing',
        title: 'Empty test file',
        description: 'Test file contains no test cases',
        file: file.relativePath,
        suggestion: 'Add test cases or remove empty test file',
        autoFixable: false,
      });
    }

    // Check for test files with too few tests
    if (testData.testCount > 0 && testData.testCount < 3) {
      issues.push({
        id: `few-tests-${file.relativePath}`,
        type: 'test-gap',
        severity: 'low',
        category: 'testing',
        title: 'Few test cases',
        description: `Test file has only ${testData.testCount} test case(s)`,
        file: file.relativePath,
        suggestion: 'Consider adding more test cases for better coverage',
        autoFixable: false,
      });
    }

    // Check for missing test types
    if (!testData.testTypes.includes('unit') && testData.testCount > 0) {
      issues.push({
        id: `missing-unit-tests-${file.relativePath}`,
        type: 'test-gap',
        severity: 'medium',
        category: 'testing',
        title: 'Missing unit tests',
        description: 'Test file appears to lack unit tests',
        file: file.relativePath,
        suggestion: 'Add unit tests for individual functions/methods',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Detect flaky tests (simplified heuristic)
   */
  private async detectFlakyTests(testFiles: TestFile[]): Promise<number> {
    let flakyCount = 0;

    for (const testFile of testFiles) {
      try {
        const content = await this.fileScanner.readFileContent(testFile.file.path);
        
        // Look for patterns that might indicate flaky tests
        const flakyPatterns = [
          /setTimeout|setInterval/g,
          /Math\.random\(\)/g,
          /new Date\(\)/g,
          /Date\.now\(\)/g,
          /\.retry\(/g,
          /\.eventually\./g,
        ];

        for (const pattern of flakyPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            flakyCount += matches.length;
          }
        }
      } catch (error) {
        logger.debug(`Failed to check for flaky tests in ${testFile.file.path}: ${error}`);
      }
    }

    return flakyCount;
  }

  /**
   * Get test suggestion based on file type
   */
  private getTestSuggestion(filePath: string): string {
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath);
    const baseName = path.basename(filePath, extension);

    const suggestions: Record<string, string> = {
      '.js': `Create ${baseName}.test.js with Jest or Mocha tests`,
      '.ts': `Create ${baseName}.test.ts with Jest tests`,
      '.py': `Create test_${baseName}.py with pytest or unittest`,
      '.java': `Create ${baseName}Test.java with JUnit tests`,
      '.go': `Create ${baseName}_test.go with Go testing package`,
      '.rs': `Create tests for ${fileName} in tests/ directory`,
    };

    return suggestions[extension] || `Create test file for ${fileName}`;
  }
}
