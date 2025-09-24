# Hydro - The Unified Development Environment Catalyst

[![npm version](https://badge.fury.io/js/hydro-cli.svg)](https://badge.fury.io/js/hydro-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

**Hydro** is a comprehensive, AI-powered code analysis and development tool that helps you maintain code quality, reduce technical debt, and improve your development workflow. It provides automated detection of common code issues, dependency problems, and architectural concerns across multiple programming languages, with advanced AI integration for intelligent code analysis and generation.

## ✨ Key Features

### 🤖 **AI-Powered Analysis**
- **Natural Language Queries**: Ask questions about your codebase in plain English
- **Intelligent Code Generation**: Create functions, classes, components, and modules using AI
- **Smart Refactoring Suggestions**: Get AI-powered recommendations for code improvements
- **Semantic Code Search**: Find code by meaning, not just text matching
- **Automated Code Explanation**: Understand complex code with AI-generated explanations

### 🔍 **Comprehensive Code Analysis**
- **Circular Dependency Detection**: Find and visualize dependency cycles
- **Complexity Analysis**: Detect overly complex functions and files
- **Code Quality Metrics**: Track maintainability, performance, and security
- **Naming Convention Validation**: Ensure consistent naming across your codebase
- **SQL Analysis**: Detect SQL injection vulnerabilities and performance issues
- **Test Coverage Analysis**: Identify untested code and suggest improvements

### 🚀 **Advanced Processing Capabilities**
- **Bulk Operations**: Process thousands of files efficiently with optimized batching
- **Memory Management**: Intelligent memory usage with automatic garbage collection
- **Concurrency Control**: Parallel processing with configurable limits
- **Progress Tracking**: Real-time progress monitoring for large operations
- **Streaming Support**: Handle large files without memory issues

### 🎯 **Multi-Language Support**
- **JavaScript/TypeScript**: Full support with advanced analysis
- **Python**: Comprehensive analysis and refactoring suggestions
- **Java**: Enterprise-grade code analysis
- **Go**: Performance and concurrency analysis
- **Rust**: Memory safety and performance optimization
- **SQL**: Security and performance analysis
- **And more**: Extensible architecture for additional languages

### 📊 **Visual Code Maps**
- **Dependency Graphs**: Interactive visualization of code relationships
- **Complexity Heatmaps**: Visual representation of code complexity
- **Hotspot Detection**: Identify files that need attention
- **Architecture Diagrams**: High-level system overview

### 🔧 **Developer Experience**
- **CLI Interface**: Powerful command-line tools for automation
- **Web Interface**: Modern web UI for interactive analysis
- **CI/CD Integration**: Ready-to-use GitHub Actions and workflows
- **Plugin System**: Extensible architecture for custom analyzers
- **Configuration Management**: Flexible YAML-based configuration

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g hydro-cli

# Or install locally in your project
npm install --save-dev hydro-cli
```

### Initialize Hydro in Your Project

```bash
cd your-project
hydro init
```

This creates a `hydro.yml` configuration file and sets up the initial project structure.

### Run Your First Analysis

```bash
# Basic project scan
hydro scan

# AI-powered analysis
hydro ai --analyze

# Find circular dependencies
hydro analyze --cycles

# Generate dependency map
hydro codemap --type dependencies
```

## 📋 Command Reference

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `hydro init` | Initialize Hydro configuration | `hydro init --template advanced` |
| `hydro scan` | Comprehensive project analysis | `hydro scan --full --baseline` |
| `hydro analyze` | Run specific analyzers | `hydro analyze --cycles --complexity` |
| `hydro codemap` | Generate visual code maps | `hydro codemap --type hotspots` |

### AI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `hydro ai --query` | Natural language queries | `hydro ai --query "How does authentication work?"` |
| `hydro ai --create` | Generate new code | `hydro ai --create "React component for user profile"` |
| `hydro ai --read` | Understand existing code | `hydro ai --read src/components/UserProfile.tsx` |
| `hydro ai --update` | Modify code with AI | `hydro ai --update src/utils/validation.ts` |
| `hydro ai --refactor` | Get refactoring suggestions | `hydro ai --refactor src/services/api.ts` |

### CRUD Operations

| Command | Description | Example |
|---------|-------------|---------|
| `hydro crud --create` | Create new code | `hydro crud --create "TypeScript utility for data validation"` |
| `hydro crud --read` | Read and understand code | `hydro crud --read src/services/api.ts` |
| `hydro crud --update` | Update existing code | `hydro crud --update src/components/Button.tsx` |
| `hydro crud --delete` | Analyze for deletion | `hydro crud --delete src/utils/deprecated.ts` |
| `hydro crud --search` | Search code patterns | `hydro crud --search "database connection logic"` |

### Bulk Operations

| Command | Description | Example |
|---------|-------------|---------|
| `hydro bulk --analyze` | Bulk analysis | `hydro bulk --analyze --batch-size 100` |
| `hydro bulk --ai-analyze` | AI-powered bulk analysis | `hydro bulk --ai-analyze --ai-batch-size 5` |
| `hydro bulk --ai-suggestions` | Generate AI suggestions | `hydro bulk --ai-suggestions --deep-analysis` |

## 📁 Configuration

### Basic Configuration (`hydro.yml`)

```yaml
project: my-awesome-app
languages:
  - javascript
  - typescript
  - python
  - sql

scan:
  include:
    - src
    - lib
    - api
  exclude:
    - node_modules
    - dist
    - .git
    - .hydro

rules:
  naming:
    style: camelCase
    exceptions:
      - API_KEY
      - DB_URL
  
  complexity:
    maxFunctionLines: 120
    maxCyclomaticComplexity: 10
    maxParameterCount: 5
  
  sql:
    dialect: postgres
    allowRawQueries: false
  
  dependencies:
    upgradeStrategy: safe

outputs:
  reports: .hydro/reports
  format: json

safety:
  dryRunDefault: true
  applyRequiresTests: true
  backupBeforeChanges: true
  maxFilesPerOperation: 100

hooks:
  preCommit:
    - hydro fmt --check
    - hydro analyze --cycles
    - hydro sql-lint --dialect postgres
```

### Advanced Configuration

```yaml
# Advanced configuration with all options
project: enterprise-app
languages:
  - typescript
  - python
  - java
  - sql

scan:
  include:
    - src
    - services
    - api
  exclude:
    - node_modules
    - dist
    - build
    - coverage
    - .hydro
  maxFileSize: 1048576  # 1MB
  followSymlinks: false

rules:
  naming:
    style: camelCase
    exceptions:
      - API_KEY
      - DATABASE_URL
      - JWT_SECRET
  
  complexity:
    maxFunctionLines: 100
    maxCyclomaticComplexity: 8
    maxParameterCount: 4
  
  sql:
    dialect: postgres
    maxQueryLength: 1000
    allowRawQueries: false
  
  dependencies:
    upgradeStrategy: conservative
    allowedLicenses:
      - MIT
      - Apache-2.0
      - BSD-3-Clause
    blockedPackages:
      - lodash  # Use native methods instead

outputs:
  reports: .hydro/reports
  codemods: .hydro/codemods
  format: json

safety:
  dryRunDefault: true
  applyRequiresTests: true
  backupBeforeChanges: true
  maxFilesPerOperation: 50

hooks:
  preCommit:
    - hydro fmt --check
    - hydro analyze --cycles
    - hydro sql-lint --dialect postgres
  ci:
    provider: github
    workflow: .github/workflows/hydro-ci.yml

# Advanced features
advanced:
  plugins:
    analyzers:
      - name: business-logic-analyzer
        path: ./plugins/business-logic.js
        config:
          strictMode: true
  
  performance:
    enableCaching: true
    cacheDirectory: .hydro/cache
    maxCacheAge: 24
    workerProcesses: 4
  
  integrations:
    sonarqube:
      url: https://sonarqube.company.com
      token: your-sonarqube-token
      projectKey: enterprise-app
```

## 🎯 Use Cases

### 1. Finding Circular Dependencies

```bash
# Find all circular dependencies
hydro analyze --cycles

# Export dependency graph for visualization
hydro analyze --cycles --export-graph

# Generate PNG from DOT file
dot -Tpng .hydro/reports/dependency-graph.dot -o dependency-graph.png
```

### 2. AI-Powered Code Analysis

```bash
# Ask questions about your codebase
hydro ai --query "How does the authentication system work?"

# Get refactoring suggestions
hydro ai --refactor src/services/userService.ts

# Generate new code
hydro ai --create "TypeScript function to validate email addresses"

# Understand complex code
hydro ai --read src/utils/complexAlgorithm.ts
```

### 3. Bulk Processing for Large Codebases

```bash
# Process thousands of files efficiently
hydro bulk --ai-analyze --ai-suggestions --ai-refactor \
  --ai-batch-size 5 --max-concurrency 3 --deep-analysis

# Memory-optimized processing
hydro bulk --analyze --batch-size 200 --memory-limit 2GB
```

### 4. Code Quality Metrics

```bash
# Comprehensive analysis with metrics
hydro scan --full --metrics

# Generate complexity report
hydro analyze --complexity --threshold 3

# Find functions longer than 200 lines
hydro scan --full | grep "Function too long"
```

### 5. Visual Code Maps

```bash
# Generate dependency map
hydro codemap --type dependencies --output-format html

# Create complexity heatmap
hydro codemap --type complexity --output-format dot

# Find file hotspots
hydro codemap --type hotspots --min-size 5000
```

## 🔧 Integration

### GitHub Actions

Hydro automatically creates a GitHub Actions workflow when you run `hydro init`. Here's a manual setup:

```yaml
name: Hydro Code Quality

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  hydro-analysis:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Hydro
        run: npm install -g hydro-cli
      
      - name: Run Hydro analysis
        run: |
          hydro scan --full --format json > hydro-report.json
          hydro analyze --cycles --sql --tests
          hydro ai --analyze --path ./src
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: hydro-report
          path: hydro-report.json
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
hydro pre-commit install

# Manual setup with husky
npm install --save-dev husky
echo "hydro analyze --cycles --dry-run" > .husky/pre-commit
```

## 📊 Output Examples

### Dependency Analysis Output

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "summary": {
    "totalFiles": 150,
    "issueCount": 3,
    "circularDependencies": 1
  },
  "issues": [
    {
      "type": "circular-dependency",
      "severity": "high",
      "description": "Circular dependency: auth/service.js → user/model.js → auth/service.js",
      "suggestion": "Extract shared interfaces or use dependency injection"
    }
  ]
}
```

### AI Analysis Output

```json
{
  "query": "How does authentication work in this codebase?",
  "response": {
    "answer": "The authentication system uses JWT tokens with the following flow...",
    "confidence": 0.92,
    "suggestions": [
      "Consider implementing refresh token rotation",
      "Add rate limiting to prevent brute force attacks"
    ],
    "relatedFiles": [
      "src/auth/jwt.ts",
      "src/middleware/auth.ts",
      "src/routes/login.ts"
    ]
  }
}
```

### Complexity Report

```
📊 Complexity Metrics:
─────────────────────
Average function length: 45 lines
Maximum function length: 234 lines
Average cyclomatic complexity: 7
Maximum nesting depth: 5

⚠️  Top Complexity Issues:
────────────────────────
1. Function too long (high)
   src/controllers/userController.js:45
   Function 'processUserData' has 234 lines (max: 120)

2. High cyclomatic complexity (medium)
   src/utils/validator.js:12
   Function 'validateInput' has complexity 15 (max: 10)
```

## 🛠️ Advanced Usage

### Custom Rules

Create custom analysis rules by extending Hydro's plugin system:

```typescript
// custom-analyzer.ts
import { AnalyzerPlugin } from 'hydro-cli';

export const customAnalyzer: AnalyzerPlugin = {
  name: 'custom-business-logic',
  fileExtensions: ['.js', '.ts'],
  analyze: async (filePath, content) => {
    // Your custom analysis logic
    return [];
  }
};
```

### Batch Operations

```bash
# Analyze multiple projects
for dir in project1 project2 project3; do
  cd $dir
  hydro scan --baseline
  cd ..
done

# Generate reports for all projects
find . -name "hydro.yml" -execdir hydro scan --format csv \;
```

### CI/CD Pipeline Integration

```bash
# Set exit code based on issues found
hydro scan --fail-on-issues --threshold high

# Generate reports for different environments
hydro scan --config hydro.prod.yml --format json > prod-report.json
hydro scan --config hydro.dev.yml --format json > dev-report.json
```

## 🏗️ Architecture

### Core Components

- **Analysis Engine**: Orchestrates multiple analyzers for comprehensive code analysis
- **AI Service**: Integrates with OpenRouter API for intelligent code analysis and generation
- **File Scanner**: Efficiently scans and processes large codebases
- **Bulk Operations**: Optimized processing for large-scale operations
- **Configuration Manager**: Handles flexible YAML-based configuration
- **Safety Manager**: Ensures safe operations with dry-run and backup capabilities

### Analyzers

- **Complexity Analyzer**: Detects complex functions and files
- **Dependency Analyzer**: Finds circular dependencies and architectural issues
- **Naming Analyzer**: Validates naming conventions
- **Security Analyzer**: Detects security vulnerabilities
- **SQL Analyzer**: Analyzes SQL queries for issues
- **Test Analyzer**: Identifies test coverage gaps
- **Team Metrics Analyzer**: Tracks team productivity and knowledge distribution

### AI Integration

<!-- - **OpenRouter API**: Uses advanced language models for code analysis -->
- **Fallback System**: Graceful degradation when AI is unavailable
- **Batch Processing**: Optimized AI operations for large codebases
- **Context Awareness**: Maintains code context for better AI responses

## 🚀 Performance

### Optimized for Large Codebases

- **Batch Processing**: Processes files in optimized batches
- **Memory Management**: Intelligent memory usage with garbage collection
- **Concurrency Control**: Parallel processing with configurable limits
- **Streaming Support**: Handles large files without memory issues
- **Caching**: Intelligent caching of analysis results

### Performance Metrics

| Codebase Size | Analysis Time | Batch Size | Concurrency |
|---------------|---------------|------------|-------------|
| Small (1-10)  | 10-30s       | 3-5        | 2-3         |
| Medium (10-100)| 1-5min      | 5-10       | 3-5         |
| Large (100+)  | 5-30min      | 10-20      | 5-10        |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/kingjethro999/hydro.git
cd hydro

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by tools like ESLint, SonarQube, and CodeClimate
- Built with TypeScript, Commander.js, and other amazing open-source libraries
- Thanks to all contributors and the open-source community
- AI capabilities powered by OpenRouter and advanced language models

## 📞 Support

- 📖 [Documentation](https://hydro-cli.github.io/docs)
- 🐛 [Issue Tracker](https://github.com/kingjethro999/hydro/issues)
- 💬 [Discussions](https://github.com/kingjethro999/hydro/discussions)
- 📧 Email: support@hydro-cli.io

---

**Made with ❤️ by the THE BEST**

*Hydro - The Unified Development Environment Catalyst*