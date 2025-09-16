# Hydro - The Unified Development Environment Catalyst

[![npm version](https://badge.fury.io/js/hydro-cli.svg)](https://badge.fury.io/js/hydro-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Hydro is a comprehensive code analysis and development tool that helps you maintain code quality, reduce technical debt, and improve your development workflow. It provides automated detection of common code issues, dependency problems, and architectural concerns across multiple programming languages.

## ✨ Features

- **🔍 Comprehensive Code Analysis**: Detect circular dependencies, complexity issues, naming violations, and more
- **📊 Visual Code Maps**: Generate interactive dependency graphs and complexity visualizations
- **🧪 Test Coverage Analysis**: Identify untested code and suggest test improvements
- **🗃️ SQL Analysis**: Find SQL injection vulnerabilities and performance issues
- **🔧 Auto-Fix Capabilities**: Automatically fix certain types of issues
- **📈 Metrics & Reporting**: Track technical debt and code quality over time
- **🌐 Multi-Language Support**: JavaScript, TypeScript, Python, Java, Go, Rust, and more
- **⚡ Fast & Efficient**: Optimized for large codebases with smart caching
- **🎯 CI/CD Integration**: Ready-to-use GitHub Actions and other CI workflows

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

# Find circular dependencies
hydro analyze --cycles

# Generate dependency map
hydro codemap --type dependencies
```

## 📋 Commands

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `hydro init` | Initialize Hydro configuration | `hydro init --template advanced` |
| `hydro scan` | Comprehensive project analysis | `hydro scan --full --baseline` |
| `hydro analyze` | Run specific analyzers | `hydro analyze --cycles --complexity` |
| `hydro codemap` | Generate visual code maps | `hydro codemap --type hotspots` |

### Analysis Options

| Option | Description | Example |
|--------|-------------|---------|
| `--cycles` | Find circular dependencies | `hydro analyze --cycles` |
| `--complexity` | Analyze code complexity | `hydro analyze --complexity` |
| `--naming` | Check naming conventions | `hydro analyze --naming` |
| `--sql` | Analyze SQL usage | `hydro analyze --sql` |
| `--tests` | Analyze test coverage | `hydro analyze --tests` |
| `--all` | Run all analyzers | `hydro analyze --all` |

### Output Options

| Option | Description | Example |
|--------|-------------|---------|
| `--format json` | JSON output | `hydro scan --format json` |
| `--format yaml` | YAML output | `hydro scan --format yaml` |
| `--format csv` | CSV output | `hydro scan --format csv` |
| `--dry-run` | Preview changes only | `hydro analyze --cycles --dry-run` |

## 📁 Configuration

### Basic Configuration (`hydro.yml`)

```yaml
project: my-awesome-app
languages:
  - javascript
  - typescript
  - sql

scan:
  include:
    - src
    - lib
  exclude:
    - node_modules
    - dist
    - .git

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

hooks:
  preCommit:
    - hydro fmt --check
    - hydro analyze --cycles
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

### 2. Code Complexity Analysis

```bash
# Analyze complexity with custom threshold
hydro analyze --complexity --threshold 3

# Find functions longer than 200 lines
hydro scan --full | grep "Function too long"
```

### 3. Test Coverage Gaps

```bash
# Find untested files
hydro analyze --tests

# Generate test suggestions
hydro test-suggest --path src --output tests/suggested
```

### 4. SQL Security Analysis

```bash
# Check for SQL injection vulnerabilities
hydro analyze --sql

# Lint SQL with specific dialect
hydro sql-lint --dialect postgres --path src
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

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

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
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by tools like ESLint, SonarQube, and CodeClimate
- Built with TypeScript, Commander.js, and other amazing open-source libraries
- Thanks to all contributors and the open-source community

## 📞 Support

- 📖 [Documentation](https://hydro-cli.github.io/docs)
- 🐛 [Issue Tracker](https://github.com/hydro-cli/hydro/issues)
- 💬 [Discussions](https://github.com/hydro-cli/hydro/discussions)
- 📧 Email: support@hydro-cli.io

---

**Made with ❤️ by the Hydro team**
