const { useState, useEffect } = React;

const AnalyzersPage = () => {
  const [analyzers, setAnalyzers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalyzer, setSelectedAnalyzer] = useState(null);

  useEffect(() => {
    // Mock analyzer data based on actual Hydro analyzers
    const mockAnalyzers = [
      {
        id: 'complexity',
        name: 'Complexity Analyzer',
        icon: 'git-branch-outline',
        description: 'Detects complex functions, nested conditions, and maintainability issues',
        category: 'Code Quality',
        status: 'active',
        issues: 12,
        severity: 'medium',
        features: [
          'Cyclomatic complexity detection',
          'Cognitive complexity analysis',
          'Function length validation',
          'Nested depth analysis',
          'Maintainability scoring'
        ],
        metrics: {
          complexityScore: 3.2,
          averageFunctionLength: 24,
          maxNestingDepth: 5,
          complexFunctions: 8
        },
        rules: [
          { name: 'Max Function Length', value: '50 lines', status: 'warning' },
          { name: 'Max Nesting Depth', value: '4 levels', status: 'error' },
          { name: 'Cyclomatic Complexity', value: '10', status: 'warning' }
        ]
      },
      {
        id: 'dependency',
        name: 'Dependency Analyzer',
        icon: 'git-network-outline',
        description: 'Analyzes import dependencies, circular references, and module coupling',
        category: 'Architecture',
        status: 'active',
        issues: 3,
        severity: 'low',
        features: [
          'Circular dependency detection',
          'Import analysis',
          'Module coupling metrics',
          'Dead code detection',
          'Dependency graph generation'
        ],
        metrics: {
          totalDependencies: 156,
          circularDependencies: 0,
          unusedImports: 12,
          couplingScore: 2.1
        },
        rules: [
          { name: 'Circular Dependencies', value: '0 allowed', status: 'pass' },
          { name: 'Max Coupling', value: '5', status: 'pass' },
          { name: 'Unused Imports', value: '0', status: 'warning' }
        ]
      },
      {
        id: 'security',
        name: 'Security Analyzer',
        icon: 'shield-checkmark-outline',
        description: 'Identifies security vulnerabilities, sensitive data exposure, and best practices',
        category: 'Security',
        status: 'active',
        issues: 2,
        severity: 'high',
        features: [
          'Vulnerability scanning',
          'Sensitive data detection',
          'Authentication analysis',
          'Authorization checks',
          'Input validation review'
        ],
        metrics: {
          vulnerabilities: 2,
          highRisk: 1,
          mediumRisk: 1,
          lowRisk: 0
        },
        rules: [
          { name: 'SQL Injection', value: 'Protected', status: 'pass' },
          { name: 'XSS Prevention', value: 'Protected', status: 'pass' },
          { name: 'Sensitive Data', value: '2 issues', status: 'error' }
        ]
      },
      {
        id: 'naming',
        name: 'Naming Analyzer',
        icon: 'text-outline',
        description: 'Enforces naming conventions, detects typos, and improves code readability',
        category: 'Code Quality',
        status: 'active',
        issues: 7,
        severity: 'low',
        features: [
          'Naming convention validation',
          'Typo detection',
          'Consistency checking',
          'Variable naming analysis',
          'Function naming review'
        ],
        metrics: {
          conventionViolations: 7,
          typos: 2,
          consistencyScore: 85,
          readabilityScore: 78
        },
        rules: [
          { name: 'Camel Case', value: 'Enforced', status: 'warning' },
          { name: 'Pascal Case', value: 'Enforced', status: 'warning' },
          { name: 'Snake Case', value: 'Enforced', status: 'pass' }
        ]
      },
      {
        id: 'sql',
        name: 'SQL Analyzer',
        icon: 'server-outline',
        description: 'Analyzes SQL queries for performance, security, and best practices',
        category: 'Database',
        status: 'active',
        issues: 4,
        severity: 'medium',
        features: [
          'Query performance analysis',
          'SQL injection detection',
          'Index optimization suggestions',
          'Query complexity scoring',
          'Best practices validation'
        ],
        metrics: {
          totalQueries: 23,
          slowQueries: 2,
          missingIndexes: 3,
          securityIssues: 0
        },
        rules: [
          { name: 'Query Performance', value: '2 slow', status: 'warning' },
          { name: 'Missing Indexes', value: '3 found', status: 'warning' },
          { name: 'SQL Injection', value: 'Protected', status: 'pass' }
        ]
      },
      {
        id: 'test',
        name: 'Test Analyzer',
        icon: 'checkmark-circle-outline',
        description: 'Evaluates test coverage, quality, and effectiveness of testing strategies',
        category: 'Testing',
        status: 'active',
        issues: 5,
        severity: 'medium',
        features: [
          'Test coverage analysis',
          'Test quality assessment',
          'Missing test detection',
          'Test effectiveness scoring',
          'Mock usage analysis'
        ],
        metrics: {
          coverage: 78.5,
          totalTests: 156,
          passingTests: 148,
          failingTests: 8
        },
        rules: [
          { name: 'Coverage Threshold', value: '80%', status: 'warning' },
          { name: 'Test Quality', value: 'Good', status: 'pass' },
          { name: 'Failing Tests', value: '8 found', status: 'error' }
        ]
      },
      {
        id: 'team-metrics',
        name: 'Team Metrics Analyzer',
        icon: 'people-outline',
        description: 'Tracks team productivity, code ownership, and collaboration patterns',
        category: 'Team',
        status: 'active',
        issues: 0,
        severity: 'low',
        features: [
          'Code ownership analysis',
          'Collaboration metrics',
          'Productivity tracking',
          'Knowledge distribution',
          'Team dynamics insights'
        ],
        metrics: {
          activeContributors: 12,
          codeOwnership: 85,
          collaborationScore: 92,
          knowledgeDistribution: 78
        },
        rules: [
          { name: 'Code Ownership', value: '85%', status: 'pass' },
          { name: 'Collaboration', value: '92%', status: 'pass' },
          { name: 'Knowledge Sharing', value: '78%', status: 'warning' }
        ]
      }
    ];

    setAnalyzers(mockAnalyzers);
    setLoading(false);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center py-12' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }),
      React.createElement('span', { className: 'ml-3 text-gray-600' }, 'Loading analyzers...')
    );
  }

  return React.createElement('div', { className: 'space-y-8' },
    // Header
    React.createElement('div', null,
      React.createElement('h1', { className: 'text-4xl font-bold text-gray-900 mb-4 flex items-center' },
        React.createElement('ion-icon', { name: 'analytics-outline', className: 'mr-4 text-blue-600' }),
        'Analysis Engine'
      ),
      React.createElement('p', { className: 'text-xl text-gray-600 mb-6' }, 
        'Comprehensive code analysis powered by 7 specialized analyzers that work together to provide deep insights into your codebase.'
      ),
      React.createElement('div', { className: 'flex items-center space-x-6 text-sm text-gray-500' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-2 h-2 bg-green-500 rounded-full mr-2' }),
          React.createElement('span', null, '7 Active Analyzers')
        ),
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-2 h-2 bg-blue-500 rounded-full mr-2' }),
          React.createElement('span', null, '33 Issues Found')
        ),
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-2 h-2 bg-orange-500 rounded-full mr-2' }),
          React.createElement('span', null, 'Last Run: 2 min ago')
        )
      )
    ),

    // Analyzers Grid
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
      ...analyzers.map((analyzer) =>
        React.createElement('div', { 
          key: analyzer.id, 
          className: `bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer ${selectedAnalyzer?.id === analyzer.id ? 'ring-2 ring-blue-500' : ''}`,
          onClick: () => setSelectedAnalyzer(selectedAnalyzer?.id === analyzer.id ? null : analyzer)
        },
          React.createElement('div', { className: 'flex items-start justify-between mb-4' },
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('div', { className: 'w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4' },
                React.createElement('ion-icon', { name: analyzer.icon, className: 'text-2xl text-blue-600' })
              ),
              React.createElement('div', null,
                React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, analyzer.name),
                React.createElement('span', { className: 'text-sm text-gray-500' }, analyzer.category)
              )
            ),
            React.createElement('div', { className: 'text-right' },
              React.createElement('span', { className: `px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(analyzer.status)}` }, 
                analyzer.status
              ),
              React.createElement('div', { className: 'mt-1 text-sm text-gray-600' }, `${analyzer.issues} issues`),
              React.createElement('span', { className: `inline-block mt-1 px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(analyzer.severity)}` }, 
                analyzer.severity
              )
            )
          ),
          React.createElement('p', { className: 'text-gray-600 text-sm mb-4' }, analyzer.description),
          React.createElement('div', { className: 'space-y-2' },
            ...analyzer.rules.map((rule, index) =>
              React.createElement('div', { key: index, className: 'flex items-center justify-between text-xs' },
                React.createElement('span', { className: 'text-gray-600' }, rule.name),
                React.createElement('div', { className: 'flex items-center space-x-2' },
                  React.createElement('span', { className: 'text-gray-900 font-medium' }, rule.value),
                  React.createElement('div', { className: `w-2 h-2 rounded-full ${
                    rule.status === 'pass' ? 'bg-green-500' : 
                    rule.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }` })
                )
              )
            )
          )
        )
      )
    ),

    // Selected Analyzer Details
    selectedAnalyzer && React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-8 border border-gray-100' },
      React.createElement('div', { className: 'flex items-center justify-between mb-6' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mr-6' },
            React.createElement('ion-icon', { name: selectedAnalyzer.icon, className: 'text-3xl text-blue-600' })
          ),
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-3xl font-bold text-gray-900' }, selectedAnalyzer.name),
            React.createElement('p', { className: 'text-gray-600 text-lg' }, selectedAnalyzer.description)
          )
        ),
        React.createElement('button', {
          onClick: () => setSelectedAnalyzer(null),
          className: 'text-gray-400 hover:text-gray-600'
        },
          React.createElement('ion-icon', { name: 'close-outline', className: 'text-2xl' })
        )
      ),

      React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-8' },
        // Features
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Features'),
          React.createElement('div', { className: 'space-y-3' },
            ...selectedAnalyzer.features.map((feature, index) =>
              React.createElement('div', { key: index, className: 'flex items-center p-3 bg-gray-50 rounded-lg' },
                React.createElement('ion-icon', { name: 'checkmark-circle-outline', className: 'text-green-600 mr-3' }),
                React.createElement('span', { className: 'text-gray-700' }, feature)
              )
            )
          )
        ),

        // Metrics
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Current Metrics'),
          React.createElement('div', { className: 'space-y-4' },
            ...Object.entries(selectedAnalyzer.metrics).map(([key, value]) =>
              React.createElement('div', { key: key, className: 'flex justify-between items-center p-3 bg-gray-50 rounded-lg' },
                React.createElement('span', { className: 'text-gray-600 capitalize' }, key.replace(/([A-Z])/g, ' $1').trim()),
                React.createElement('span', { className: 'font-semibold text-gray-900' }, 
                  typeof value === 'number' && value < 10 ? value.toFixed(1) : 
                  typeof value === 'number' ? value.toLocaleString() : value
                )
              )
            )
          )
        ),

        // Actions
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Actions'),
          React.createElement('div', { className: 'space-y-3' },
            React.createElement('button', { className: 'w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center' },
              React.createElement('ion-icon', { name: 'play-outline', className: 'mr-2' }),
              'Run Analysis'
            ),
            React.createElement('button', { className: 'w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center' },
              React.createElement('ion-icon', { name: 'settings-outline', className: 'mr-2' }),
              'Configure Rules'
            ),
            React.createElement('button', { className: 'w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center' },
              React.createElement('ion-icon', { name: 'download-outline', className: 'mr-2' }),
              'Export Report'
            )
          )
        )
      )
    ),

    // Analysis Summary
    React.createElement('div', { className: 'bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white' },
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '7'),
          React.createElement('p', { className: 'text-blue-100' }, 'Active Analyzers')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '33'),
          React.createElement('p', { className: 'text-blue-100' }, 'Total Issues')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '2'),
          React.createElement('p', { className: 'text-blue-100' }, 'High Priority')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '85%'),
          React.createElement('p', { className: 'text-blue-100' }, 'Code Quality')
        )
      )
    )
  );
};

window.AnalyzersPage = AnalyzersPage;

