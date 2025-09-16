/**
 * SQL analyzer for detecting SQL-related issues and anti-patterns
 */

import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { Issue, SqlRules } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

interface SqlQuery {
  query: string;
  line: number;
  column: number;
  type: 'select' | 'insert' | 'update' | 'delete' | 'create' | 'alter' | 'drop' | 'unknown';
}

export class SqlAnalyzer {
  private fileScanner = new FileScanner();

  /**
   * Analyze files for SQL-related issues
   */
  public async analyze(
    files: FileInfo[],
    rules: SqlRules
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    const relevantFiles = files.filter(f => this.isRelevantFile(f));

    logger.debug(`Analyzing SQL usage in ${relevantFiles.length} files`);

    for (const file of relevantFiles) {
      try {
        const content = await this.fileScanner.readFileContent(file.path);
        const fileIssues = await this.analyzeFile(file, content, rules);
        issues.push(...fileIssues);
      } catch (error) {
        logger.debug(`Failed to analyze SQL in ${file.path}: ${error}`);
      }
    }

    return issues;
  }

  /**
   * Analyze a single file for SQL issues
   */
  private async analyzeFile(
    file: FileInfo,
    content: string,
    rules: SqlRules
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    const queries = this.extractSqlQueries(content);

    for (const query of queries) {
      // Check query length
      if (rules.maxQueryLength && query.query.length > rules.maxQueryLength) {
        issues.push({
          id: `long-query-${file.relativePath}-${query.line}`,
          type: 'sql-issue',
          severity: 'medium',
          category: 'maintainability',
          title: 'SQL query too long',
          description: `Query is ${query.query.length} characters (max: ${rules.maxQueryLength})`,
          file: file.relativePath,
          line: query.line,
          column: query.column,
          suggestion: 'Break down complex queries or move to stored procedures',
          autoFixable: false,
        });
      }

      // Check for raw queries if not allowed
      if (!rules.allowRawQueries && this.isRawQuery(query.query, file)) {
        issues.push({
          id: `raw-query-${file.relativePath}-${query.line}`,
          type: 'sql-issue',
          severity: 'high',
          category: 'security',
          title: 'Raw SQL query detected',
          description: 'Raw SQL queries can lead to SQL injection vulnerabilities',
          file: file.relativePath,
          line: query.line,
          column: query.column,
          suggestion: 'Use parameterized queries or an ORM instead',
          autoFixable: false,
        });
      }

      // Check for SQL injection vulnerabilities
      const injectionIssues = this.checkSqlInjection(query, file.relativePath);
      issues.push(...injectionIssues);

      // Check for performance anti-patterns
      const performanceIssues = this.checkPerformanceIssues(query, file.relativePath, rules);
      issues.push(...performanceIssues);

      // Check for SQL best practices
      const bestPracticeIssues = this.checkBestPractices(query, file.relativePath, rules);
      issues.push(...bestPracticeIssues);
    }

    return issues;
  }

  /**
   * Extract SQL queries from file content
   */
  private extractSqlQueries(content: string): SqlQuery[] {
    const queries: SqlQuery[] = [];
    const lines = content.split('\n');

    // Patterns to match SQL queries in different contexts
    const patterns = [
      // Template literals with SQL
      /`([^`]*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)[^`]*)`/gi,
      // String literals with SQL
      /["']([^"']*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)[^"']*)["']/gi,
      // SQL files
      /^((?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)[^;]*;?)/gmi,
      // ORM query methods
      /\.(?:query|execute|raw)\s*\(\s*["'`]([^"'`]*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)[^"'`]*)["'`]/gi,
    ];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue;
      
      const lineNumber = lineIndex + 1;

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const queryText = match[1]?.trim();
          if (queryText && queryText.length > 10) { // Filter out very short matches
            queries.push({
              query: queryText,
              line: lineNumber,
              column: match.index || 0,
              type: this.getQueryType(queryText as string),
            });
          }
        }
      }
    }

    return queries;
  }

  /**
   * Determine the type of SQL query
   */
  private getQueryType(query: string): SqlQuery['type'] {
    const upperQuery = query.toUpperCase().trim();
    
    if (upperQuery.startsWith('SELECT')) return 'select';
    if (upperQuery.startsWith('INSERT')) return 'insert';
    if (upperQuery.startsWith('UPDATE')) return 'update';
    if (upperQuery.startsWith('DELETE')) return 'delete';
    if (upperQuery.startsWith('CREATE')) return 'create';
    if (upperQuery.startsWith('ALTER')) return 'alter';
    if (upperQuery.startsWith('DROP')) return 'drop';
    
    return 'unknown';
  }

  /**
   * Check if query is a raw SQL query (not parameterized)
   */
  private isRawQuery(query: string, file: FileInfo): boolean {
    // Check for string concatenation patterns that might indicate SQL injection risk
    const concatenationPatterns = [
      /\+\s*["'`]/,  // String concatenation with +
      /\$\{[^}]+\}/,  // Template literal interpolation
      /%s|%d|%f/,     // String formatting
      /\?\s*\+/,      // Question mark followed by concatenation
    ];

    return concatenationPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check for SQL injection vulnerabilities
   */
  private checkSqlInjection(query: SqlQuery, filePath: string): Issue[] {
    const issues: Issue[] = [];

    // Check for string concatenation in WHERE clauses
    if (query.query.match(/WHERE[^=]*=\s*["'`][^"'`]*\$\{[^}]+\}[^"'`]*["'`]/i)) {
      issues.push({
        id: `sql-injection-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'critical',
        category: 'security',
        title: 'Potential SQL injection vulnerability',
        description: 'Direct string interpolation in WHERE clause detected',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Use parameterized queries with placeholders',
        autoFixable: false,
      });
    }

    // Check for dynamic ORDER BY clauses
    if (query.query.match(/ORDER\s+BY\s+["'`]?\$\{[^}]+\}["'`]?/i)) {
      issues.push({
        id: `dynamic-order-by-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'high',
        category: 'security',
        title: 'Dynamic ORDER BY clause',
        description: 'Dynamic ORDER BY clauses can be vulnerable to SQL injection',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Validate and whitelist allowed column names',
        autoFixable: false,
      });
    }

    // Check for LIKE clauses with user input
    if (query.query.match(/LIKE\s+["'`][^"'`]*\$\{[^}]+\}[^"'`]*["'`]/i)) {
      issues.push({
        id: `like-injection-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'high',
        category: 'security',
        title: 'Potential LIKE clause injection',
        description: 'LIKE clause with direct user input can be exploited',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Escape special characters in LIKE patterns',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check for performance anti-patterns
   */
  private checkPerformanceIssues(query: SqlQuery, filePath: string, rules: SqlRules): Issue[] {
    const issues: Issue[] = [];

    // Check for SELECT *
    if (query.query.match(/SELECT\s+\*/i)) {
      issues.push({
        id: `select-star-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'medium',
        category: 'performance',
        title: 'SELECT * detected',
        description: 'SELECT * can be inefficient and fragile',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Specify only the columns you need',
        autoFixable: false,
      });
    }

    // Check for N+1 query patterns (simplified detection)
    if (query.type === 'select' && query.query.match(/WHERE\s+\w+\s*=\s*\?/i)) {
      // This is a very basic heuristic - real N+1 detection would need more context
      issues.push({
        id: `potential-n-plus-one-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'medium',
        category: 'performance',
        title: 'Potential N+1 query pattern',
        description: 'This query pattern might indicate N+1 query problem',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Consider using JOINs or bulk loading instead of multiple queries',
        autoFixable: false,
      });
    }

    // Check for missing LIMIT in SELECT queries
    if (query.type === 'select' && !query.query.match(/LIMIT\s+\d+/i)) {
      issues.push({
        id: `missing-limit-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'low',
        category: 'performance',
        title: 'Missing LIMIT clause',
        description: 'SELECT queries without LIMIT can return large result sets',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Add LIMIT clause to prevent large result sets',
        autoFixable: true,
      });
    }

    // Check for functions in WHERE clauses
    if (query.query.match(/WHERE[^=]*(?:UPPER|LOWER|SUBSTRING|DATE)\s*\(/i)) {
      issues.push({
        id: `function-in-where-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'medium',
        category: 'performance',
        title: 'Function in WHERE clause',
        description: 'Functions in WHERE clauses can prevent index usage',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Consider restructuring to avoid functions on indexed columns',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check for SQL best practices
   */
  private checkBestPractices(query: SqlQuery, filePath: string, _rules: SqlRules): Issue[] {
    const issues: Issue[] = [];

    // Check for inconsistent naming conventions
    const hasSnakeCase = query.query.match(/\b\w+_\w+\b/);
    const hasCamelCase = query.query.match(/\b[a-z]+[A-Z][a-zA-Z]*\b/);
    
    if (hasSnakeCase && hasCamelCase) {
      issues.push({
        id: `inconsistent-naming-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'low',
        category: 'maintainability',
        title: 'Inconsistent naming convention',
        description: 'Mixed snake_case and camelCase in SQL query',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Use consistent naming convention throughout',
        autoFixable: false,
      });
    }

    // Check for hardcoded values that should be parameters
    const hardcodedValues = query.query.match(/=\s*['"][^'"]+['"]/g);
    if (hardcodedValues && hardcodedValues.length > 2) {
      issues.push({
        id: `hardcoded-values-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'low',
        category: 'maintainability',
        title: 'Multiple hardcoded values',
        description: 'Query contains multiple hardcoded values',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Consider using parameters for reusability',
        autoFixable: false,
      });
    }

    // Check for missing table aliases in JOINs
    if (query.query.match(/JOIN\s+\w+\s+ON/i) && !query.query.match(/JOIN\s+\w+\s+AS?\s+\w+/i)) {
      issues.push({
        id: `missing-table-alias-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'low',
        category: 'maintainability',
        title: 'Missing table alias',
        description: 'Table aliases improve readability in JOIN queries',
        file: filePath,
        line: query.line,
        column: query.column,
        suggestion: 'Add table aliases for better readability',
        autoFixable: true,
      });
    }

    // Dialect-specific checks
    if (_rules.dialect === 'postgres') {
      this.checkPostgresSpecific(query, filePath, issues);
    } else if (_rules.dialect === 'mysql') {
      this.checkMySqlSpecific(query, filePath, issues);
    }

    return issues;
  }

  /**
   * PostgreSQL-specific checks
   */
  private checkPostgresSpecific(query: SqlQuery, filePath: string, issues: Issue[]): void {
    // Check for ILIKE usage (PostgreSQL-specific)
    if (query.query.match(/\bILIKE\b/i)) {
      // This is actually good for PostgreSQL, but note it's not portable
      issues.push({
        id: `postgres-ilike-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'low',
        category: 'maintainability',
        title: 'PostgreSQL-specific ILIKE',
        description: 'ILIKE is PostgreSQL-specific and not portable',
        file: filePath,
        line: query.line,
        suggestion: 'Document PostgreSQL dependency or use UPPER/LOWER with LIKE for portability',
        autoFixable: false,
      });
    }

    // Check for array operations
    if (query.query.match(/ANY\s*\(/i) || query.query.match(/=\s*ALL\s*\(/i)) {
      // PostgreSQL array operations are powerful but should be used carefully
      issues.push({
        id: `postgres-array-ops-${filePath}-${query.line}`,
        type: 'sql-issue',
        severity: 'low',
        category: 'performance',
        title: 'PostgreSQL array operation',
        description: 'Array operations can be expensive on large datasets',
        file: filePath,
        line: query.line,
        suggestion: 'Ensure proper indexing for array operations',
        autoFixable: false,
      });
    }
  }

  /**
   * MySQL-specific checks
   */
  private checkMySqlSpecific(query: SqlQuery, filePath: string, issues: Issue[]): void {
    // Check for MySQL-specific functions
    const mysqlFunctions = ['CONCAT_WS', 'GROUP_CONCAT', 'IFNULL'];
    for (const func of mysqlFunctions) {
      if (query.query.match(new RegExp(`\\b${func}\\b`, 'i'))) {
        issues.push({
          id: `mysql-specific-${func.toLowerCase()}-${filePath}-${query.line}`,
          type: 'sql-issue',
          severity: 'low',
          category: 'maintainability',
          title: `MySQL-specific function: ${func}`,
          description: `${func} is MySQL-specific and not portable`,
          file: filePath,
          line: query.line,
          suggestion: 'Consider using standard SQL functions for portability',
          autoFixable: false,
        });
      }
    }
  }

  /**
   * Check if file is relevant for SQL analysis
   */
  private isRelevantFile(file: FileInfo): boolean {
    // SQL files
    if (file.extension === '.sql') return true;
    
    // Code files that might contain SQL
    const codeLanguages = ['javascript', 'typescript', 'python', 'java', 'php', 'ruby'];
    return file.language ? codeLanguages.includes(file.language) : false;
  }
}
