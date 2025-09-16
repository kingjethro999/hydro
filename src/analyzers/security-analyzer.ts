/**
 * Security analyzer for detecting vulnerabilities, secrets, and security anti-patterns
 */

import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { Issue, SecurityRules } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface VulnerabilityPattern {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  owaspCategory: string;
}

export class SecurityAnalyzer {
  private fileScanner = new FileScanner();

  // Secret detection patterns
  private secretPatterns: SecretPattern[] = [
    {
      name: 'API Key',
      pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/i,
      severity: 'critical',
      description: 'Hardcoded API key detected'
    },
    {
      name: 'JWT Secret',
      pattern: /(?:jwt[_-]?secret|secret[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9+/=]{20,}['"]/i,
      severity: 'critical',
      description: 'Hardcoded JWT secret detected'
    },
    {
      name: 'Database Password',
      pattern: /(?:db[_-]?password|database[_-]?password|password)\s*[:=]\s*['"][^'"]{8,}['"]/i,
      severity: 'critical',
      description: 'Hardcoded database password detected'
    },
    {
      name: 'Private Key',
      pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i,
      severity: 'critical',
      description: 'Private key detected in code'
    },
    {
      name: 'Access Token',
      pattern: /(?:access[_-]?token|bearer[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9._-]{20,}['"]/i,
      severity: 'high',
      description: 'Hardcoded access token detected'
    },
    {
      name: 'AWS Credentials',
      pattern: /(?:aws[_-]?access[_-]?key[_-]?id|aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9+/=]{20,}['"]/i,
      severity: 'critical',
      description: 'Hardcoded AWS credentials detected'
    },
    {
      name: 'GitHub Token',
      pattern: /(?:github[_-]?token|gh[_-]?token)\s*[:=]\s*['"](?:ghp_|gho_|ghu_|ghs_|ghr_)[a-zA-Z0-9]{36}['"]/i,
      severity: 'high',
      description: 'Hardcoded GitHub token detected'
    },
    {
      name: 'Slack Webhook',
      pattern: /(?:slack[_-]?webhook|webhook[_-]?url)\s*[:=]\s*['"]https:\/\/hooks\.slack\.com\/services\/[^'"]+['"]/i,
      severity: 'medium',
      description: 'Hardcoded Slack webhook URL detected'
    }
  ];

  // Security vulnerability patterns
  private vulnerabilityPatterns: VulnerabilityPattern[] = [
    {
      name: 'SQL Injection',
      pattern: /(?:query|execute|raw)\s*\(\s*['"`][^'"`]*\$\{[^}]+\}[^'"`]*['"`]/i,
      severity: 'critical',
      description: 'Potential SQL injection vulnerability',
      owaspCategory: 'A03:2021 – Injection'
    },
    {
      name: 'XSS Vulnerability',
      pattern: /\.innerHTML\s*=\s*[^;]+(?:location\.|document\.|window\.)/i,
      severity: 'high',
      description: 'Potential XSS vulnerability through innerHTML',
      owaspCategory: 'A03:2021 – Injection'
    },
    {
      name: 'Eval Usage',
      pattern: /\beval\s*\(/i,
      severity: 'critical',
      description: 'Use of eval() function detected',
      owaspCategory: 'A03:2021 – Injection'
    },
    {
      name: 'Dangerous Redirect',
      pattern: /(?:location\.href|window\.location)\s*=\s*[^;]*(?:location\.|document\.|window\.)/i,
      severity: 'high',
      description: 'Potential open redirect vulnerability',
      owaspCategory: 'A01:2021 – Broken Access Control'
    },
    {
      name: 'Weak Random',
      pattern: /Math\.random\(\)/i,
      severity: 'medium',
      description: 'Use of weak random number generator',
      owaspCategory: 'A02:2021 – Cryptographic Failures'
    },
    {
      name: 'Hardcoded Credentials',
      pattern: /(?:username|password|user|pass)\s*[:=]\s*['"][^'"]{3,}['"]/i,
      severity: 'high',
      description: 'Hardcoded credentials detected',
      owaspCategory: 'A07:2021 – Identification and Authentication Failures'
    },
    {
      name: 'Insecure HTTP',
      pattern: /http:\/\/(?!localhost|127\.0\.0\.1)[^'"]+/i,
      severity: 'medium',
      description: 'Insecure HTTP connection detected',
      owaspCategory: 'A02:2021 – Cryptographic Failures'
    },
    {
      name: 'Debug Information',
      pattern: /(?:console\.log|console\.debug|console\.info)\s*\([^)]*(?:password|secret|key|token)/i,
      severity: 'medium',
      description: 'Sensitive information in debug output',
      owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures'
    }
  ];

  /**
   * Analyze files for security issues
   */
  public async analyze(
    files: FileInfo[],
    rules: SecurityRules
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    const relevantFiles = files.filter(f => this.isRelevantFile(f));

    logger.debug(`Analyzing security for ${relevantFiles.length} files`);

    for (const file of relevantFiles) {
      try {
        const content = await this.fileScanner.readFileContent(file.path);
        const fileIssues = await this.analyzeFile(file, content, rules);
        issues.push(...fileIssues);
      } catch (error) {
        logger.debug(`Failed to analyze security for ${file.path}: ${error}`);
      }
    }

    return issues;
  }

  /**
   * Analyze a single file for security issues
   */
  private async analyzeFile(
    file: FileInfo,
    content: string,
    rules: SecurityRules
  ): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Check for secrets if enabled
    if (rules.detectSecrets) {
      const secretIssues = this.detectSecrets(file, content);
      issues.push(...secretIssues);
    }

    // Check for vulnerabilities if enabled
    if (rules.detectVulnerabilities) {
      const vulnerabilityIssues = this.detectVulnerabilities(file, content);
      issues.push(...vulnerabilityIssues);
    }

    // Check for security anti-patterns if enabled
    if (rules.detectAntiPatterns) {
      const antiPatternIssues = this.detectAntiPatterns(file, content);
      issues.push(...antiPatternIssues);
    }

    // Check OWASP compliance if enabled
    if (rules.owaspCompliance) {
      const owaspIssues = this.checkOWASPCompliance(file, content);
      issues.push(...owaspIssues);
    }

    return issues;
  }

  /**
   * Detect hardcoded secrets
   */
  private detectSecrets(file: FileInfo, content: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue;

      for (const pattern of this.secretPatterns) {
        const matches = line.matchAll(pattern.pattern);
        for (const match of matches) {
          issues.push({
            id: `secret-${pattern.name.toLowerCase().replace(/\s+/g, '-')}-${file.relativePath}-${lineIndex + 1}`,
            type: 'security-risk',
            severity: pattern.severity,
            category: 'security',
            title: pattern.description,
            description: `${pattern.name} found in ${file.relativePath}`,
            file: file.relativePath,
            line: lineIndex + 1,
            column: match.index || 0,
            suggestion: 'Move sensitive data to environment variables or secure configuration',
            autoFixable: false,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect security vulnerabilities
   */
  private detectVulnerabilities(file: FileInfo, content: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue;

      for (const pattern of this.vulnerabilityPatterns) {
        const matches = line.matchAll(pattern.pattern);
        for (const match of matches) {
          issues.push({
            id: `vulnerability-${pattern.name.toLowerCase().replace(/\s+/g, '-')}-${file.relativePath}-${lineIndex + 1}`,
            type: 'security-risk',
            severity: pattern.severity,
            category: 'security',
            title: pattern.description,
            description: `${pattern.name} detected: ${pattern.owaspCategory}`,
            file: file.relativePath,
            line: lineIndex + 1,
            column: match.index || 0,
            suggestion: this.getVulnerabilitySuggestion(pattern.name),
            autoFixable: false,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect security anti-patterns
   */
  private detectAntiPatterns(file: FileInfo, content: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    const antiPatterns = [
      {
        name: 'Unsafe Deserialization',
        pattern: /(?:JSON\.parse|eval)\s*\([^)]*req\.|request\./i,
        severity: 'high' as const,
        description: 'Unsafe deserialization of user input',
        suggestion: 'Validate and sanitize input before deserialization'
      },
      {
        name: 'Insecure Direct Object Reference',
        pattern: /(?:req\.params|req\.query|req\.body)\.[a-zA-Z_][a-zA-Z0-9_]*\s*[=:]/i,
        severity: 'medium' as const,
        description: 'Direct object reference without authorization check',
        suggestion: 'Implement proper authorization checks for object access'
      },
      {
        name: 'Missing CSRF Protection',
        pattern: /(?:POST|PUT|DELETE|PATCH)\s*['"`][^'"`]*['"`]/i,
        severity: 'medium' as const,
        description: 'HTTP method without CSRF protection',
        suggestion: 'Implement CSRF tokens for state-changing operations'
      },
      {
        name: 'Insecure Cookie Settings',
        pattern: /(?:cookie|setCookie)\s*\([^)]*(?!secure|httpOnly|sameSite)/i,
        severity: 'medium' as const,
        description: 'Insecure cookie configuration',
        suggestion: 'Use secure, httpOnly, and sameSite cookie attributes'
      }
    ];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue;

      for (const pattern of antiPatterns) {
        const matches = line.matchAll(pattern.pattern);
        for (const match of matches) {
          issues.push({
            id: `anti-pattern-${pattern.name.toLowerCase().replace(/\s+/g, '-')}-${file.relativePath}-${lineIndex + 1}`,
            type: 'security-risk',
            severity: pattern.severity,
            category: 'security',
            title: pattern.description,
            description: `${pattern.name} detected in ${file.relativePath}`,
            file: file.relativePath,
            line: lineIndex + 1,
            column: match.index || 0,
            suggestion: pattern.suggestion,
            autoFixable: false,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check OWASP Top 10 compliance
   */
  private checkOWASPCompliance(file: FileInfo, content: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    const owaspChecks = [
      {
        category: 'A01:2021 – Broken Access Control',
        patterns: [
          { pattern: /(?:admin|root|superuser)\s*[:=]\s*true/i, description: 'Hardcoded admin privileges' },
          { pattern: /(?:bypass|skip)\s*(?:auth|authentication|authorization)/i, description: 'Authentication bypass detected' }
        ]
      },
      {
        category: 'A02:2021 – Cryptographic Failures',
        patterns: [
          { pattern: /(?:md5|sha1)\s*\(/i, description: 'Weak cryptographic hash function' },
          { pattern: /(?:des|rc4)\s*\(/i, description: 'Weak encryption algorithm' }
        ]
      },
      {
        category: 'A03:2021 – Injection',
        patterns: [
          { pattern: /(?:query|execute|raw)\s*\(\s*['"`][^'"`]*\+/i, description: 'String concatenation in queries' },
          { pattern: /(?:innerHTML|outerHTML)\s*=\s*[^;]*(?:req\.|request\.)/i, description: 'User input in HTML output' }
        ]
      }
    ];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue;

      for (const check of owaspChecks) {
        for (const pattern of check.patterns) {
          const matches = line.matchAll(pattern.pattern);
          for (const match of matches) {
            issues.push({
              id: `owasp-${check.category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${file.relativePath}-${lineIndex + 1}`,
              type: 'security-risk',
              severity: 'high',
              category: 'security',
              title: pattern.description,
              description: `OWASP violation: ${check.category}`,
              file: file.relativePath,
              line: lineIndex + 1,
              column: match.index || 0,
              suggestion: `Address ${check.category} compliance issue`,
              autoFixable: false,
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Get suggestion for vulnerability type
   */
  private getVulnerabilitySuggestion(vulnerabilityType: string): string {
    const suggestions: Record<string, string> = {
      'SQL Injection': 'Use parameterized queries or prepared statements',
      'XSS Vulnerability': 'Sanitize user input and use textContent instead of innerHTML',
      'Eval Usage': 'Avoid eval() and use safer alternatives like JSON.parse()',
      'Dangerous Redirect': 'Validate and whitelist redirect URLs',
      'Weak Random': 'Use crypto.getRandomValues() or a secure random library',
      'Hardcoded Credentials': 'Use environment variables or secure configuration management',
      'Insecure HTTP': 'Use HTTPS for all external connections',
      'Debug Information': 'Remove sensitive data from debug output'
    };

    return suggestions[vulnerabilityType] || 'Review and fix security vulnerability';
  }

  /**
   * Check if file is relevant for security analysis
   */
  private isRelevantFile(file: FileInfo): boolean {
    const securityRelevantLanguages = [
      'javascript', 'typescript', 'python', 'java', 'php', 'ruby', 'go', 'rust'
    ];
    return file.language ? securityRelevantLanguages.includes(file.language) : false;
  }
}

