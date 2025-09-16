# Contributing to Hydro

Thank you for your interest in contributing to Hydro! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** when available
3. **Provide detailed information** including:
   - Hydro version
   - Operating system
   - Node.js version
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant configuration files

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check the roadmap** to see if it's already planned
2. **Open a discussion** before implementing large features
3. **Provide use cases** and examples
4. **Consider backward compatibility**

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm 8+
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/hydro-cli/hydro.git
cd hydro

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
```

### Project Structure

```
hydro/
├── src/                    # Source code
│   ├── cli/               # CLI commands
│   ├── core/              # Core functionality
│   ├── analyzers/         # Code analyzers
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── examples/              # Example configurations
├── scripts/               # Build and utility scripts
├── tests/                 # Test files
└── docs/                  # Documentation
```

## 📝 Coding Standards

### TypeScript Guidelines

- Use **strict TypeScript** configuration
- Provide **explicit return types** for functions
- Use **meaningful variable names**
- Add **JSDoc comments** for public APIs
- Prefer **composition over inheritance**

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Example Code Style

```typescript
/**
 * Analyzes code complexity and returns issues
 */
export class ComplexityAnalyzer {
  private readonly maxComplexity: number;

  constructor(config: ComplexityConfig) {
    this.maxComplexity = config.maxComplexity;
  }

  /**
   * Analyze files for complexity issues
   */
  public async analyze(files: FileInfo[]): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    for (const file of files) {
      const fileIssues = await this.analyzeFile(file);
      issues.push(...fileIssues);
    }

    return issues;
  }

  private async analyzeFile(file: FileInfo): Promise<Issue[]> {
    // Implementation details...
    return [];
  }
}
```

## 🧪 Testing

### Test Structure

- **Unit tests**: Test individual functions/classes
- **Integration tests**: Test component interactions  
- **E2E tests**: Test complete workflows
- **Performance tests**: Ensure acceptable performance

### Writing Tests

```typescript
import { ComplexityAnalyzer } from '../src/analyzers/complexity-analyzer';

describe('ComplexityAnalyzer', () => {
  let analyzer: ComplexityAnalyzer;

  beforeEach(() => {
    analyzer = new ComplexityAnalyzer({ maxComplexity: 10 });
  });

  describe('analyze', () => {
    it('should detect high complexity functions', async () => {
      const files = [createMockFile('complex-function.js')];
      const issues = await analyzer.analyze(files);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('complex-function');
    });

    it('should handle empty file list', async () => {
      const issues = await analyzer.analyze([]);
      expect(issues).toHaveLength(0);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- complexity-analyzer.test.ts
```

## 📋 Pull Request Process

### Before Submitting

1. **Create a feature branch** from `main`
2. **Write tests** for new functionality
3. **Update documentation** if needed
4. **Run the full test suite**
5. **Check code formatting and linting**
6. **Update CHANGELOG.md** if applicable

### PR Guidelines

1. **Use descriptive titles** that explain the change
2. **Reference related issues** using `#issue-number`
3. **Provide detailed description** of changes
4. **Include screenshots** for UI changes
5. **Keep PRs focused** - one feature/fix per PR
6. **Update tests** and documentation

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for hard-to-understand areas
- [ ] Documentation updated
- [ ] No new warnings introduced
```

## 🏗️ Architecture Guidelines

### Adding New Analyzers

1. Create analyzer class in `src/analyzers/`
2. Implement the `AnalyzerPlugin` interface
3. Add tests in `tests/analyzers/`
4. Register in `AnalysisEngine`
5. Update documentation

Example analyzer structure:

```typescript
export class MyAnalyzer {
  public async analyze(files: FileInfo[], rules?: MyRules): Promise<Issue[]> {
    // Analysis logic
    return [];
  }

  public async calculateMetrics(files: FileInfo[]): Promise<MyMetrics> {
    // Metrics calculation
    return {};
  }
}
```

### Adding New CLI Commands

1. Create command class in `src/cli/commands/`
2. Extend `BaseCommand`
3. Register in main CLI file
4. Add tests
5. Update help documentation

### Plugin Development

Hydro supports plugins for extending functionality:

```typescript
export const myPlugin: HydroPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  
  analyzers: [
    {
      name: 'my-analyzer',
      fileExtensions: ['.js', '.ts'],
      analyze: async (filePath, content) => {
        // Custom analysis logic
        return [];
      }
    }
  ],
  
  commands: [
    {
      name: 'my-command',
      description: 'My custom command',
      options: [],
      execute: async (options) => {
        // Command implementation
      }
    }
  ]
};
```

## 🚀 Release Process

### Version Management

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release PR
4. Tag release after merge
5. Publish to npm
6. Create GitHub release

## 📚 Documentation

### Documentation Types

- **API Documentation**: Generated from TSDoc comments
- **User Guides**: Step-by-step tutorials
- **Examples**: Real-world usage examples
- **Architecture Docs**: Technical design documents

### Writing Documentation

- Use **clear, concise language**
- Include **code examples**
- Provide **step-by-step instructions**
- Add **screenshots** where helpful
- Keep docs **up-to-date** with code changes

## 🆘 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat with maintainers
- **Email**: security@hydro-cli.io (security issues only)

### Maintainer Response Times

- **Critical bugs**: Within 24 hours
- **General issues**: Within 1 week
- **Feature requests**: Within 2 weeks
- **PRs**: Within 1 week

## 🏆 Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md** file
- **GitHub contributors** section
- **Release notes** for significant contributions
- **Special thanks** in documentation

## 📄 License

By contributing to Hydro, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Hydro better! 🎉
