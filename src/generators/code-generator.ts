/**
 * Code generator for creating components, tests, and API clients
 */

import fs from 'fs-extra';
import path from 'path';

import { logger } from '@/core/logger';
import { SafetyManager } from '@/core/safety-manager';

import type { FileInfo } from '@/core/file-scanner';

export interface GenerationOptions {
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust';
  framework?: string;
  style?: 'functional' | 'class' | 'hooks';
  includeTests?: boolean;
  includeTypes?: boolean;
  includeDocs?: boolean;
  outputDir?: string;
}

export interface ComponentTemplate {
  name: string;
  description: string;
  category: 'component' | 'service' | 'util' | 'test' | 'api';
  files: ComponentFile[];
}

export interface ComponentFile {
  path: string;
  content: string;
  type: 'source' | 'test' | 'types' | 'docs';
}

export class CodeGenerator {
  private safetyManager = SafetyManager.getInstance();

  /**
   * Generate a React component
   */
  public async generateReactComponent(
    name: string,
    options: GenerationOptions
  ): Promise<string[]> {
    const operationId = await this.safetyManager.startOperation(
      `Generate React component: ${name}`,
      [],
      { dryRun: false, requireTests: false, createBackup: false, maxFiles: 10 }
    );

    try {
      const componentDir = path.join(options.outputDir || 'src/components', name);
      await fs.ensureDir(componentDir);

      const files: string[] = [];

      // Generate main component file
      const componentContent = this.generateReactComponentContent(name, options);
      const componentPath = path.join(componentDir, `${name}.tsx`);
      await fs.writeFile(componentPath, componentContent);
      files.push(componentPath);

      // Generate types file if requested
      if (options.includeTypes) {
        const typesContent = this.generateReactTypesContent(name);
        const typesPath = path.join(componentDir, `${name}.types.ts`);
        await fs.writeFile(typesPath, typesContent);
        files.push(typesPath);
      }

      // Generate test file if requested
      if (options.includeTests) {
        const testContent = this.generateReactTestContent(name);
        const testPath = path.join(componentDir, `${name}.test.tsx`);
        await fs.writeFile(testPath, testContent);
        files.push(testPath);
      }

      // Generate index file
      const indexContent = this.generateIndexContent(name);
      const indexPath = path.join(componentDir, 'index.ts');
      await fs.writeFile(indexPath, indexContent);
      files.push(indexPath);

      // Generate documentation if requested
      if (options.includeDocs) {
        const docsContent = this.generateComponentDocs(name);
        const docsPath = path.join(componentDir, 'README.md');
        await fs.writeFile(docsPath, docsContent);
        files.push(docsPath);
      }

      logger.success(`Generated React component: ${name}`);
      return files;

    } catch (error) {
      await this.safetyManager.rollbackOperation(operationId);
      throw error;
    }
  }

  /**
   * Generate a Node.js service
   */
  public async generateService(
    name: string,
    options: GenerationOptions
  ): Promise<string[]> {
    const operationId = await this.safetyManager.startOperation(
      `Generate service: ${name}`,
      [],
      { dryRun: false, requireTests: false, createBackup: false, maxFiles: 10 }
    );

    try {
      const serviceDir = path.join(options.outputDir || 'src/services', name);
      await fs.ensureDir(serviceDir);

      const files: string[] = [];

      // Generate main service file
      const serviceContent = this.generateServiceContent(name, options);
      const servicePath = path.join(serviceDir, `${name}.service.${options.language === 'typescript' ? 'ts' : 'js'}`);
      await fs.writeFile(servicePath, serviceContent);
      files.push(servicePath);

      // Generate interface/type definitions
      if (options.includeTypes && options.language === 'typescript') {
        const interfaceContent = this.generateServiceInterfaceContent(name);
        const interfacePath = path.join(serviceDir, `${name}.interface.ts`);
        await fs.writeFile(interfacePath, interfaceContent);
        files.push(interfacePath);
      }

      // Generate test file
      if (options.includeTests) {
        const testContent = this.generateServiceTestContent(name, options);
        const testPath = path.join(serviceDir, `${name}.service.test.${options.language === 'typescript' ? 'ts' : 'js'}`);
        await fs.writeFile(testPath, testContent);
        files.push(testPath);
      }

      // Generate index file
      const indexContent = this.generateServiceIndexContent(name);
      const indexPath = path.join(serviceDir, 'index.ts');
      await fs.writeFile(indexPath, indexContent);
      files.push(indexPath);

      logger.success(`Generated service: ${name}`);
      return files;

    } catch (error) {
      await this.safetyManager.rollbackOperation(operationId);
      throw error;
    }
  }

  /**
   * Generate API client
   */
  public async generateApiClient(
    name: string,
    baseUrl: string,
    options: GenerationOptions
  ): Promise<string[]> {
    const operationId = await this.safetyManager.startOperation(
      `Generate API client: ${name}`,
      [],
      { dryRun: false, requireTests: false, createBackup: false, maxFiles: 10 }
    );

    try {
      const clientDir = path.join(options.outputDir || 'src/api', name);
      await fs.ensureDir(clientDir);

      const files: string[] = [];

      // Generate main client file
      const clientContent = this.generateApiClientContent(name, baseUrl, options);
      const clientPath = path.join(clientDir, `${name}.client.${options.language === 'typescript' ? 'ts' : 'js'}`);
      await fs.writeFile(clientPath, clientContent);
      files.push(clientPath);

      // Generate types file
      if (options.includeTypes && options.language === 'typescript') {
        const typesContent = this.generateApiTypesContent(name);
        const typesPath = path.join(clientDir, `${name}.types.ts`);
        await fs.writeFile(typesPath, typesContent);
        files.push(typesPath);
      }

      // Generate test file
      if (options.includeTests) {
        const testContent = this.generateApiTestContent(name, options);
        const testPath = path.join(clientDir, `${name}.client.test.${options.language === 'typescript' ? 'ts' : 'js'}`);
        await fs.writeFile(testPath, testContent);
        files.push(testPath);
      }

      // Generate index file
      const indexContent = this.generateApiIndexContent(name);
      const indexPath = path.join(clientDir, 'index.ts');
      await fs.writeFile(indexPath, indexContent);
      files.push(indexPath);

      logger.success(`Generated API client: ${name}`);
      return files;

    } catch (error) {
      await this.safetyManager.rollbackOperation(operationId);
      throw error;
    }
  }

  /**
   * Generate test files for existing code
   */
  public async generateTests(
    files: FileInfo[],
    options: GenerationOptions
  ): Promise<string[]> {
    const operationId = await this.safetyManager.startOperation(
      'Generate test files',
      files.map(f => f.path),
      { dryRun: false, requireTests: false, createBackup: false, maxFiles: files.length }
    );

    try {
      const generatedFiles: string[] = [];

      for (const file of files) {
        if (!this.isTestableFile(file)) continue;

        const testContent = await this.generateTestForFile(file, options);
        if (!testContent) continue;

        const testPath = this.getTestPath(file, options);
        await fs.ensureDir(path.dirname(testPath));
        await fs.writeFile(testPath, testContent);
        generatedFiles.push(testPath);
      }

      logger.success(`Generated ${generatedFiles.length} test files`);
      return generatedFiles;

    } catch (error) {
      await this.safetyManager.rollbackOperation(operationId);
      throw error;
    }
  }

  /**
   * Generate React component content
   */
  private generateReactComponentContent(name: string, options: GenerationOptions): string {
    const isTypeScript = options.language === 'typescript';
    const useHooks = options.style === 'hooks' || options.style === 'functional';

    if (useHooks) {
      return `import React${isTypeScript ? ', { FC }' : ''} from 'react';
${isTypeScript ? `import { ${name}Props } from './${name}.types';\n` : ''}

${isTypeScript ? `const ${name}: FC<${name}Props> = ({` : `const ${name} = ({`}${isTypeScript ? '' : ' props'}) => {
  return (
    <div className="${name.toLowerCase()}">
      <h2>${name}</h2>
      {/* Add your component content here */}
    </div>
  );
};

export default ${name};
`;
    } else {
      return `import React${isTypeScript ? ', { Component }' : ''} from 'react';
${isTypeScript ? `import { ${name}Props, ${name}State } from './${name}.types';\n` : ''}

${isTypeScript ? `class ${name} extends Component<${name}Props, ${name}State> {` : `class ${name} extends React.Component {`}
  constructor(props${isTypeScript ? `: ${name}Props` : ''}) {
    super(props);
    ${isTypeScript ? `this.state: ${name}State = {` : 'this.state = {'}
      // Add your state here
    };
  }

  render() {
    return (
      <div className="${name.toLowerCase()}">
        <h2>${name}</h2>
        {/* Add your component content here */}
      </div>
    );
  }
}

export default ${name};
`;
    }
  }

  /**
   * Generate React types content
   */
  private generateReactTypesContent(name: string): string {
    return `export interface ${name}Props {
  // Add your props here
  className?: string;
  children?: React.ReactNode;
}

export interface ${name}State {
  // Add your state here
  isLoading?: boolean;
}
`;
  }

  /**
   * Generate React test content
   */
  private generateReactTestContent(name: string): string {
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${name} from './${name}';

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    const testProps = {
      className: 'test-class',
    };
    render(<${name} {...testProps} />);
    expect(screen.getByText('${name}')).toHaveClass('test-class');
  });
});
`;
  }

  /**
   * Generate service content
   */
  private generateServiceContent(name: string, options: GenerationOptions): string {
    const isTypeScript = options.language === 'typescript';
    const className = this.toPascalCase(name);

    if (isTypeScript) {
      return `import { ${className}Interface } from './${name}.interface';

export class ${className}Service implements ${className}Interface {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async initialize(): Promise<void> {
    // Add initialization logic here
  }

  async cleanup(): Promise<void> {
    // Add cleanup logic here
  }

  // Add your service methods here
}
`;
    } else {
      return `export class ${className}Service {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async initialize() {
    // Add initialization logic here
  }

  async cleanup() {
    // Add cleanup logic here
  }

  // Add your service methods here
}
`;
    }
  }

  /**
   * Generate service interface content
   */
  private generateServiceInterfaceContent(name: string): string {
    const className = this.toPascalCase(name);
    return `export interface ${className}Interface {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  // Add your interface methods here
}

export interface ${className}Config {
  baseUrl?: string;
  timeout?: number;
  // Add your config properties here
}
`;
  }

  /**
   * Generate service test content
   */
  private generateServiceTestContent(name: string, options: GenerationOptions): string {
    const className = this.toPascalCase(name);
    const isTypeScript = options.language === 'typescript';

    return `import { ${className}Service } from './${name}.service';

describe('${className}Service', () => {
  let service: ${className}Service;

  beforeEach(() => {
    service = new ${className}Service();
  });

  afterEach(async () => {
    await service.cleanup();
  });

  it('should initialize successfully', async () => {
    await expect(service.initialize()).resolves.not.toThrow();
  });

  it('should cleanup successfully', async () => {
    await service.initialize();
    await expect(service.cleanup()).resolves.not.toThrow();
  });
});
`;
  }

  /**
   * Generate API client content
   */
  private generateApiClientContent(name: string, baseUrl: string, options: GenerationOptions): string {
    const isTypeScript = options.language === 'typescript';
    const className = this.toPascalCase(name);

    if (isTypeScript) {
      return `import { ${className}Config, ApiResponse } from './${name}.types';

export class ${className}Client {
  private baseUrl: string;
  private config: ${className}Config;

  constructor(config: ${className}Config = {}) {
    this.baseUrl = config.baseUrl || '${baseUrl}';
    this.config = {
      timeout: 5000,
      ...config,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
      success: true,
    };
  }

  // Add your API methods here
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
`;
    } else {
      return `export class ${className}Client {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || '${baseUrl}';
    this.config = {
      timeout: 5000,
      ...config,
    };
  }

  async request(endpoint, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
      success: true,
    };
  }

  // Add your API methods here
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
`;
    }
  }

  /**
   * Generate API types content
   */
  private generateApiTypesContent(name: string): string {
    const className = this.toPascalCase(name);
    return `export interface ${className}Config {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}
`;
  }

  /**
   * Generate API test content
   */
  private generateApiTestContent(name: string, options: GenerationOptions): string {
    const className = this.toPascalCase(name);
    const isTypeScript = options.language === 'typescript';

    return `import { ${className}Client } from './${name}.client';

// Mock fetch
global.fetch = jest.fn();

describe('${className}Client', () => {
  let client: ${className}Client;

  beforeEach(() => {
    client = new ${className}Client({
      baseUrl: 'https://api.example.com',
    });
    (fetch as jest.Mock).mockClear();
  });

  it('should make GET request', async () => {
    const mockData = { id: 1, name: 'Test' };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await client.get('/test');
    
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result.data).toEqual(mockData);
    expect(result.success).toBe(true);
  });

  it('should handle API errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(client.get('/nonexistent')).rejects.toThrow('API request failed: 404 Not Found');
  });
});
`;
  }

  /**
   * Generate test for existing file
   */
  private async generateTestForFile(file: FileInfo, options: GenerationOptions): Promise<string | null> {
    try {
      const content = await fs.readFile(file.path, 'utf8');
      const functions = this.extractFunctions(content, file.language || 'javascript');
      
      if (functions.length === 0) return null;

      const testContent = this.generateTestContent(file, functions, options);
      return testContent;
    } catch (error) {
      logger.debug(`Failed to generate test for ${file.path}: ${error}`);
      return null;
    }
  }

  /**
   * Generate test content
   */
  private generateTestContent(file: FileInfo, functions: FunctionInfo[], options: GenerationOptions): string {
    const isTypeScript = options.language === 'typescript';
    const fileName = path.basename(file.path, path.extname(file.path));
    const importPath = file.relativePath.replace(/\.(js|ts)$/, '');

    let content = `import { ${functions.map(f => f.name).join(', ')} } from '${importPath}';\n\n`;

    functions.forEach(func => {
      content += `describe('${func.name}', () => {
  it('should work correctly', () => {
    // Add your test cases here
    expect(${func.name}).toBeDefined();
  });
});\n\n`;
    });

    return content;
  }

  /**
   * Extract functions from code content
   */
  private extractFunctions(content: string, language: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = content.split('\n');

    const patterns = this.getFunctionPatterns(language);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      
      for (const pattern of patterns) {
        const match = line.match(pattern.regex);
        if (match) {
          const functionName = match[pattern.nameGroup] || 'anonymous';
          functions.push({
            name: functionName,
            startLine: i + 1,
            endLine: i + 1,
            lineCount: 1,
            parameterCount: 0,
            body: line,
          });
          break;
        }
      }
    }

    return functions;
  }

  /**
   * Get function patterns for different languages
   */
  private getFunctionPatterns(language: string): { regex: RegExp; nameGroup: number; paramsGroup: number }[] {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return [
          { regex: /^function\s+(\w+)\s*\(([^)]*)\)/, nameGroup: 1, paramsGroup: 2 },
          { regex: /^(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/, nameGroup: 1, paramsGroup: 2 },
          { regex: /^(\w+)\s*\(([^)]*)\)\s*\{/, nameGroup: 1, paramsGroup: 2 },
        ];
      case 'python':
        return [
          { regex: /^def\s+(\w+)\s*\(([^)]*)\):/, nameGroup: 1, paramsGroup: 2 },
        ];
      default:
        return [
          { regex: /^(?:function\s+)?(\w+)\s*\(([^)]*)\)/, nameGroup: 1, paramsGroup: 2 },
        ];
    }
  }

  /**
   * Generate index content
   */
  private generateIndexContent(name: string): string {
    return `export { default as ${name} } from './${name}';
export * from './${name}.types';
`;
  }

  /**
   * Generate service index content
   */
  private generateServiceIndexContent(name: string): string {
    const className = this.toPascalCase(name);
    return `export { ${className}Service } from './${name}.service';
export * from './${name}.interface';
`;
  }

  /**
   * Generate API index content
   */
  private generateApiIndexContent(name: string): string {
    const className = this.toPascalCase(name);
    return `export { ${className}Client } from './${name}.client';
export * from './${name}.types';
`;
  }

  /**
   * Generate component documentation
   */
  private generateComponentDocs(name: string): string {
    return `# ${name} Component

## Description
A reusable React component for ${name.toLowerCase()}.

## Usage

\`\`\`tsx
import { ${name} } from './${name}';

<${name} />
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | - | CSS class name |

## Examples

### Basic Usage
\`\`\`tsx
<${name} />
\`\`\`

### With Custom Class
\`\`\`tsx
<${name} className="custom-class" />
\`\`\`
`;
  }

  /**
   * Get test path for file
   */
  private getTestPath(file: FileInfo, options: GenerationOptions): string {
    const ext = options.language === 'typescript' ? '.test.ts' : '.test.js';
    const dir = path.dirname(file.path);
    const name = path.basename(file.path, path.extname(file.path));
    return path.join(dir, `${name}${ext}`);
  }

  /**
   * Check if file can be tested
   */
  private isTestableFile(file: FileInfo): boolean {
    const testableLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust'];
    return file.language ? testableLanguages.includes(file.language) : false;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  parameterCount: number;
  body: string;
}
