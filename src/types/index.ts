/**
 * Core type definitions for Hydro
 */

export interface HydroConfig {
  project: string;
  languages: string[];
  scan: ScanConfig;
  rules: Rules;
  outputs: OutputConfig;
  safety: SafetyConfig;
  hooks?: HookConfig;
  write?: WriteConfig;
}

export interface ScanConfig {
  include: string[];
  exclude: string[];
  maxFileSize?: number;
  followSymlinks?: boolean;
}

export interface Rules {
  naming?: NamingRules;
  complexity?: ComplexityRules;
  sql?: SqlRules;
  dependencies?: DependencyRules;
  security?: SecurityRules;
}

export interface NamingRules {
  style: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
  exceptions?: string[];
}

export interface ComplexityRules {
  maxFunctionLines: number;
  maxCyclomaticComplexity?: number;
  maxParameterCount?: number;
}

export interface SqlRules {
  dialect: 'postgres' | 'mysql' | 'sqlite' | 'mssql';
  maxQueryLength?: number;
  allowRawQueries?: boolean;
}

export interface DependencyRules {
  upgradeStrategy: 'safe' | 'latest' | 'conservative';
  allowedLicenses?: string[];
  blockedPackages?: string[];
}

export interface SecurityRules {
  detectSecrets?: boolean;
  detectVulnerabilities?: boolean;
  detectAntiPatterns?: boolean;
  owaspCompliance?: boolean;
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
}

export interface OutputConfig {
  reports: string;
  codemods?: string;
  format?: 'json' | 'yaml' | 'csv';
}

export interface SafetyConfig {
  dryRunDefault: boolean;
  applyRequiresTests: boolean;
  backupBeforeChanges?: boolean;
  maxFilesPerOperation?: number;
}

export interface HookConfig {
  preCommit?: string[];
  ci?: CiConfig;
}

export interface CiConfig {
  provider: 'github' | 'gitlab' | 'circleci' | 'jenkins';
  workflow?: string;
}

// Analysis Results
export interface AnalysisResult {
  timestamp: Date;
  projectPath: string;
  summary: AnalysisSummary;
  issues: Issue[];
  metrics: ProjectMetrics;
}

export interface AnalysisSummary {
  totalFiles: number;
  totalLines: number;
  languages: LanguageStats[];
  issueCount: number;
  techDebtScore: number;
}

export interface LanguageStats {
  language: string;
  files: number;
  lines: number;
  percentage: number;
}

export interface Issue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  file: string;
  line?: number;
  column?: number;
  suggestion?: string;
  autoFixable: boolean;
}

export type IssueType = 
  | 'circular-dependency'
  | 'god-file'
  | 'complex-function'
  | 'naming-violation'
  | 'error-handling'
  | 'sql-issue'
  | 'api-inconsistency'
  | 'test-gap'
  | 'dependency-issue'
  | 'tech-debt'
  | 'security-risk'
  | 'performance-issue';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueCategory = 
  | 'architecture'
  | 'maintainability'
  | 'performance'
  | 'security'
  | 'testing'
  | 'documentation';

export interface ProjectMetrics {
  complexity: ComplexityMetrics;
  dependencies: DependencyMetrics;
  testing: TestingMetrics;
  maintainability: MaintainabilityMetrics;
}

export interface ComplexityMetrics {
  averageFunctionLength: number;
  maxFunctionLength: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
}

export interface DependencyMetrics {
  totalDependencies: number;
  outdatedDependencies: number;
  vulnerableDependencies: number;
  circularDependencies: number;
}

export interface TestingMetrics {
  coverage: number;
  testFiles: number;
  testToCodeRatio: number;
  flakyTests: number;
}

export interface MaintainabilityMetrics {
  techDebtHours: number;
  duplicateCodePercentage: number;
  documentationCoverage: number;
  codeChurn: number;
}

// Command interfaces
export interface CommandOptions {
  dryRun?: boolean;
  apply?: boolean;
  path?: string;
  format?: 'json' | 'yaml' | 'csv' | 'dot' | 'graph';
  yes?: boolean;
  staged?: boolean;
}

export interface RefactorPlan {
  id: string;
  name: string;
  description: string;
  steps: RefactorStep[];
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RefactorStep {
  id: string;
  description: string;
  type: 'rename' | 'extract' | 'move' | 'delete' | 'modify';
  files: string[];
  dependencies: string[];
  rollbackPlan: string;
}

// Plugin system
export interface HydroPlugin {
  name: string;
  version: string;
  description: string;
  analyzers?: AnalyzerPlugin[];
  commands?: CommandPlugin[];
}

export interface AnalyzerPlugin {
  name: string;
  fileExtensions: string[];
  analyze: (filePath: string, content: string) => Promise<Issue[]>;
}

export interface CommandPlugin {
  name: string;
  description: string;
  options: CommandOption[];
  execute: (options: Record<string, unknown>) => Promise<void>;
}

export interface CommandOption {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  default?: unknown;
}

export interface WriteConfig {
  readmePreference?: 'overwrite' | 'suggested';
  templates?: {
    readme?: 'minimal' | 'comprehensive' | 'api';
  };
}

export interface GenerationOptions {
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust';
  framework?: string;
  style?: 'functional' | 'class' | 'hooks';
  includeTests?: boolean;
  includeTypes?: boolean;
  includeDocs?: boolean;
  outputDir?: string;
}

// Plugin System Types
export type PluginType = 'analyzer' | 'command' | 'visualizer' | 'generator';
