const { useState, useEffect } = React;

const DocsPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'overview', label: 'Overview', icon: 'home-outline' },
    { id: 'getting-started', label: 'Getting Started', icon: 'rocket-outline' },
    { id: 'core', label: 'Core System', icon: 'settings-outline' },
    { id: 'analyzers', label: 'Analyzers', icon: 'analytics-outline' },
    { id: 'ai', label: 'AI Service', icon: 'chatbubbles-outline' },
    { id: 'generators', label: 'Generators', icon: 'construct-outline' },
    { id: 'cli', label: 'CLI Commands', icon: 'terminal-outline' },
    { id: 'plugins', label: 'Plugin System', icon: 'extension-puzzle-outline' },
    { id: 'utils', label: 'Utilities', icon: 'build-outline' },
    { id: 'config', label: 'Configuration', icon: 'document-text-outline' },
    { id: 'api', label: 'API Reference', icon: 'code-slash-outline' },
    { id: 'examples', label: 'Examples', icon: 'library-outline' }
  ];

  const getSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return React.createElement('div', { className: 'space-y-8' },
          // Hero Section
          React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-6' },
            React.createElement('h2', { className: 'text-2xl font-semibold text-gray-900 mb-2' }, 'Hydro - Unified Development Environment Catalyst'),
            React.createElement('p', { className: 'text-gray-600 mb-6' }, 
              'A comprehensive development tool that streamlines your workflow with intelligent analysis, AI assistance, and powerful automation capabilities.'
            ),
            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
              React.createElement('div', { className: 'text-center p-3 bg-gray-50 rounded' },
                React.createElement('div', { className: 'text-xl font-semibold text-gray-900 mb-1' }, '7'),
                React.createElement('p', { className: 'text-xs text-gray-600' }, 'Analyzers')
              ),
              React.createElement('div', { className: 'text-center p-3 bg-gray-50 rounded' },
                React.createElement('div', { className: 'text-xl font-semibold text-gray-900 mb-1' }, '13'),
                React.createElement('p', { className: 'text-xs text-gray-600' }, 'CLI Commands')
              ),
              React.createElement('div', { className: 'text-center p-3 bg-gray-50 rounded' },
                React.createElement('div', { className: 'text-xl font-semibold text-gray-900 mb-1' }, '6'),
                React.createElement('p', { className: 'text-xs text-gray-600' }, 'Generators')
              ),
              React.createElement('div', { className: 'text-center p-3 bg-gray-50 rounded' },
                React.createElement('div', { className: 'text-xl font-semibold text-gray-900 mb-1' }, '4'),
                React.createElement('p', { className: 'text-xs text-gray-600' }, 'AI Types')
              )
            )
          ),

          // Architecture Overview
          React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-6' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'System Architecture'),
            React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-4' },
              React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg border border-gray-200' },
                React.createElement('h4', { className: 'font-medium text-gray-900 mb-3' }, 'Core Layer'),
                React.createElement('ul', { className: 'space-y-1 text-sm text-gray-600' },
                  React.createElement('li', null, 'Configuration Management'),
                  React.createElement('li', null, 'File System Scanner'),
                  React.createElement('li', null, 'Safety Manager'),
                  React.createElement('li', null, 'Logger System')
                )
              ),
              React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg border border-gray-200' },
                React.createElement('h4', { className: 'font-medium text-gray-900 mb-3' }, 'Analysis Layer'),
                React.createElement('ul', { className: 'space-y-1 text-sm text-gray-600' },
                  React.createElement('li', null, 'Complexity Analysis'),
                  React.createElement('li', null, 'Security Scanning'),
                  React.createElement('li', null, 'Dependency Analysis'),
                  React.createElement('li', null, 'Test Coverage')
                )
              ),
              React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg border border-gray-200' },
                React.createElement('h4', { className: 'font-medium text-gray-900 mb-3' }, 'Generation Layer'),
                React.createElement('ul', { className: 'space-y-1 text-sm text-gray-600' },
                  React.createElement('li', null, 'Code Generation'),
                  React.createElement('li', null, 'AI Assistant'),
                  React.createElement('li', null, 'Plugin System'),
                  React.createElement('li', null, 'CLI Interface')
                )
              )
            )
          )
        );

      case 'getting-started':
        return React.createElement('div', { className: 'space-y-8' },
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg p-8 border border-gray-100' },
            React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-6' }, 'Quick Start Guide'),
            React.createElement('div', { className: 'space-y-6' },
              React.createElement('div', { className: 'bg-gray-50 p-6 rounded-xl' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4 flex items-center' },
                  React.createElement('ion-icon', { name: 'download-outline', className: 'mr-2 text-blue-600' }),
                  'Installation'
                ),
                React.createElement('div', { className: 'bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm' },
                  React.createElement('pre', null, 'npm install -g hydro-cli\n# or\nyarn global add hydro-cli')
                )
              ),
              React.createElement('div', { className: 'bg-gray-50 p-6 rounded-xl' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4 flex items-center' },
                  React.createElement('ion-icon', { name: 'rocket-outline', className: 'mr-2 text-green-600' }),
                  'Initialize Project'
                ),
                React.createElement('div', { className: 'bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm' },
                  React.createElement('pre', null, 'hydro init\nhydro scan\nhydro analyze')
                )
              ),
              React.createElement('div', { className: 'bg-gray-50 p-6 rounded-xl' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4 flex items-center' },
                  React.createElement('ion-icon', { name: 'eye-outline', className: 'mr-2 text-purple-600' }),
                  'View Results'
                ),
                React.createElement('div', { className: 'bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm' },
                  React.createElement('pre', null, 'hydro web  # Launch web interface\nhydro report  # Generate detailed report')
                )
              )
            )
          )
        );

      case 'analyzers':
        return React.createElement('div', { className: 'space-y-8' },
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg p-8 border border-gray-100' },
            React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-6' }, 'Specialized Analyzers'),
            React.createElement('p', { className: 'text-gray-600 mb-8' }, 
              'Hydro includes 7 specialized analyzers, each designed to examine specific aspects of your codebase with deep precision.'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
              // Complexity Analyzer
              React.createElement('div', { className: 'border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow' },
                React.createElement('div', { className: 'flex items-center mb-4' },
                  React.createElement('div', { className: 'w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3' },
                    React.createElement('ion-icon', { name: 'trending-up-outline', className: 'text-blue-600' })
                  ),
                  React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, 'Complexity Analyzer')
                ),
                React.createElement('p', { className: 'text-gray-600 mb-4' }, 
                  'Measures cyclomatic complexity, function length, and parameter count to identify overly complex code sections.'
                ),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Max Function Lines'),
                    React.createElement('span', { className: 'font-semibold' }, '50')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Max Complexity'),
                    React.createElement('span', { className: 'font-semibold' }, '10')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Max Parameters'),
                    React.createElement('span', { className: 'font-semibold' }, '5')
                  )
                )
              ),

              // Security Analyzer
              React.createElement('div', { className: 'border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow' },
                React.createElement('div', { className: 'flex items-center mb-4' },
                  React.createElement('div', { className: 'w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3' },
                    React.createElement('ion-icon', { name: 'shield-checkmark-outline', className: 'text-red-600' })
                  ),
                  React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, 'Security Analyzer')
                ),
                React.createElement('p', { className: 'text-gray-600 mb-4' }, 
                  'Scans for security vulnerabilities, unsafe patterns, and potential security risks in your codebase.'
                ),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'OWASP Compliance'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Dependency Scan'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'SQL Injection'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Protected')
                  )
                )
              ),

              // Dependency Analyzer
              React.createElement('div', { className: 'border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow' },
                React.createElement('div', { className: 'flex items-center mb-4' },
                  React.createElement('div', { className: 'w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3' },
                    React.createElement('ion-icon', { name: 'git-branch-outline', className: 'text-green-600' })
                  ),
                  React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, 'Dependency Analyzer')
                ),
                React.createElement('p', { className: 'text-gray-600 mb-4' }, 
                  'Analyzes package dependencies, detects circular dependencies, and identifies outdated packages.'
                ),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Circular Detection'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'License Check'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Outdated Detection'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  )
                )
              ),

              // SQL Analyzer
              React.createElement('div', { className: 'border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow' },
                React.createElement('div', { className: 'flex items-center mb-4' },
                  React.createElement('div', { className: 'w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3' },
                    React.createElement('ion-icon', { name: 'server-outline', className: 'text-orange-600' })
                  ),
                  React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, 'SQL Analyzer')
                ),
                React.createElement('p', { className: 'text-gray-600 mb-4' }, 
                  'Validates SQL queries, checks for performance issues, and ensures database best practices.'
                ),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Supported DBs'),
                    React.createElement('span', { className: 'font-semibold' }, '4')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Query Validation'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Performance Check'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  )
                )
              ),

              // Test Analyzer
              React.createElement('div', { className: 'border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow' },
                React.createElement('div', { className: 'flex items-center mb-4' },
                  React.createElement('div', { className: 'w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3' },
                    React.createElement('ion-icon', { name: 'checkmark-circle-outline', className: 'text-purple-600' })
                  ),
                  React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, 'Test Analyzer')
                ),
                React.createElement('p', { className: 'text-gray-600 mb-4' }, 
                  'Analyzes test coverage, test quality, and identifies untested code paths.'
                ),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Coverage Target'),
                    React.createElement('span', { className: 'font-semibold' }, '80%')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Test Quality'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Analyzed')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Untested Paths'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Detected')
                  )
                )
              ),

              // Naming Analyzer
              React.createElement('div', { className: 'border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow' },
                React.createElement('div', { className: 'flex items-center mb-4' },
                  React.createElement('div', { className: 'w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-3' },
                    React.createElement('ion-icon', { name: 'text-outline', className: 'text-cyan-600' })
                  ),
                  React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, 'Naming Analyzer')
                ),
                React.createElement('p', { className: 'text-gray-600 mb-4' }, 
                  'Enforces consistent naming conventions across your codebase.'
                ),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Convention'),
                    React.createElement('span', { className: 'font-semibold' }, 'camelCase')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'File Naming'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enforced')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Variable Naming'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enforced')
                  )
                )
              ),

              // Team Metrics Analyzer
              React.createElement('div', { className: 'border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow' },
                React.createElement('div', { className: 'flex items-center mb-4' },
                  React.createElement('div', { className: 'w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3' },
                    React.createElement('ion-icon', { name: 'people-outline', className: 'text-indigo-600' })
                  ),
                  React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, 'Team Metrics Analyzer')
                ),
                React.createElement('p', { className: 'text-gray-600 mb-4' }, 
                  'Tracks development metrics, contribution patterns, and team collaboration insights.'
                ),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Git Integration'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Contribution Tracking'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  ),
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-gray-500' }, 'Collaboration Insights'),
                    React.createElement('span', { className: 'font-semibold text-green-600' }, 'Enabled')
                  )
                )
              )
            )
          )
        );

      case 'ai':
        return React.createElement('div', { className: 'space-y-8' },
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg p-8 border border-gray-100' },
            React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-6' }, 'AI Service'),
            React.createElement('p', { className: 'text-gray-600 mb-8' }, 
              'Hydro\'s AI service provides intelligent code analysis, suggestions, and explanations using advanced natural language processing.'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
              React.createElement('div', { className: 'bg-blue-50 p-6 rounded-xl border border-blue-200' },
                React.createElement('h3', { className: 'font-bold text-blue-900 mb-4 flex items-center' },
                  React.createElement('ion-icon', { name: 'analytics-outline', className: 'mr-2' }),
                  'Analysis Queries'
                ),
                React.createElement('p', { className: 'text-blue-800 mb-4' }, 
                  'Get intelligent analysis of your code patterns, complexity, and potential issues.'
                ),
                React.createElement('div', { className: 'bg-blue-100 p-3 rounded-lg font-mono text-sm' },
                  '"What are the most complex functions in my codebase?"'
                )
              ),
              React.createElement('div', { className: 'bg-green-50 p-6 rounded-xl border border-green-200' },
                React.createElement('h3', { className: 'font-bold text-green-900 mb-4 flex items-center' },
                  React.createElement('ion-icon', { name: 'bulb-outline', className: 'mr-2' }),
                  'Suggestion Queries'
                ),
                React.createElement('p', { className: 'text-green-800 mb-4' }, 
                  'Receive intelligent suggestions for code improvements and optimizations.'
                ),
                React.createElement('div', { className: 'bg-green-100 p-3 rounded-lg font-mono text-sm' },
                  '"How can I improve the performance of this function?"'
                )
              ),
              React.createElement('div', { className: 'bg-purple-50 p-6 rounded-xl border border-purple-200' },
                React.createElement('h3', { className: 'font-bold text-purple-900 mb-4 flex items-center' },
                  React.createElement('ion-icon', { name: 'help-circle-outline', className: 'mr-2' }),
                  'Explanation Queries'
                ),
                React.createElement('p', { className: 'text-purple-800 mb-4' }, 
                  'Get detailed explanations of complex code sections and algorithms.'
                ),
                React.createElement('div', { className: 'bg-purple-100 p-3 rounded-lg font-mono text-sm' },
                  '"Explain how this sorting algorithm works"'
                )
              ),
              React.createElement('div', { className: 'bg-orange-50 p-6 rounded-xl border border-orange-200' },
                React.createElement('h3', { className: 'font-bold text-orange-900 mb-4 flex items-center' },
                  React.createElement('ion-icon', { name: 'construct-outline', className: 'mr-2' }),
                  'Refactor Queries'
                ),
                React.createElement('p', { className: 'text-orange-800 mb-4' }, 
                  'Get suggestions for code refactoring and restructuring.'
                ),
                React.createElement('div', { className: 'bg-orange-100 p-3 rounded-lg font-mono text-sm' },
                  '"How can I refactor this component for better maintainability?"'
                )
              )
            )
          )
        );

      case 'cli':
        return React.createElement('div', { className: 'space-y-8' },
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg p-8 border border-gray-100' },
            React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-6' }, 'CLI Commands'),
            React.createElement('p', { className: 'text-gray-600 mb-8' }, 
              'Hydro provides 13 powerful CLI commands for comprehensive project management and analysis.'
            ),
            React.createElement('div', { className: 'space-y-4' },
              ...['init', 'scan', 'analyze', 'generate', 'ai', 'plugin', 'update', 'version', 'web', 'write', 'info', 'codemap'].map((cmd, index) =>
                React.createElement('div', { key: cmd, className: 'border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors' },
                  React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', { className: 'flex items-center' },
                      React.createElement('div', { className: 'w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3' },
                        React.createElement('span', { className: 'text-blue-600 font-bold text-sm' }, index + 1)
                      ),
                      React.createElement('div', null,
                        React.createElement('code', { className: 'bg-gray-100 px-2 py-1 rounded text-sm font-mono' }, `hydro ${cmd}`),
                        React.createElement('p', { className: 'text-gray-600 text-sm mt-1' }, 
                          cmd === 'init' ? 'Initialize Hydro in your project' :
                          cmd === 'scan' ? 'Scan project files and structure' :
                          cmd === 'analyze' ? 'Run comprehensive code analysis' :
                          cmd === 'generate' ? 'Generate code, tests, or documentation' :
                          cmd === 'ai' ? 'Interact with AI assistant' :
                          cmd === 'plugin' ? 'Manage plugins and extensions' :
                          cmd === 'update' ? 'Update Hydro and dependencies' :
                          cmd === 'version' ? 'Display version information' :
                          cmd === 'web' ? 'Launch web interface' :
                          cmd === 'write' ? 'Write analysis reports' :
                          cmd === 'info' ? 'Display project information' :
                          cmd === 'codemap' ? 'Generate code visualization' : ''
                        )
                      )
                    ),
                    React.createElement('ion-icon', { name: 'chevron-forward-outline', className: 'text-gray-400' })
                  )
                )
              )
            )
          )
        );

      default:
        return React.createElement('div', { className: 'text-center py-12' },
          React.createElement('ion-icon', { name: 'document-outline', className: 'text-6xl text-gray-400 mb-4' }),
          React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 mb-2' }, 'Documentation Section'),
          React.createElement('p', { className: 'text-gray-600' }, 'Select a section from the sidebar to view detailed documentation.')
        );
    }
  };

  return React.createElement('div', { className: 'flex min-h-screen bg-gray-50' },
    // Sidebar
    React.createElement('div', { className: 'w-64 bg-white border-r border-gray-200' },
      React.createElement('div', { className: 'p-6' },
        React.createElement('h1', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Hydro Docs'),
        React.createElement('div', { className: 'mb-6' },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Search documentation...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          })
        ),
        React.createElement('nav', { className: 'space-y-1' },
          ...sections.map((section) =>
            React.createElement('button', {
              key: section.id,
              onClick: () => setActiveSection(section.id),
              className: `w-full flex items-center px-3 py-2 text-left text-sm rounded-lg transition-colors duration-200 ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            },
              React.createElement('ion-icon', { name: section.icon, className: 'mr-3' }),
              section.label
            )
          )
        )
      )
    ),

    // Main Content
    React.createElement('div', { className: 'flex-1 p-8' },
      React.createElement('div', { className: 'max-w-4xl' },
        getSectionContent()
      )
    )
  );
};

window.DocsPage = DocsPage;
