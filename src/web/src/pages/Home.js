const { useState, useEffect } = React;

const HomePage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/health'),
      fetch('/api/analysis/status')
    ])
    .then(([healthRes, metricsRes]) => Promise.all([healthRes.json(), metricsRes.json()]))
    .then(([health, metrics]) => {
      setStatus(health);
      setMetrics(metrics);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      setLoading(false);
    });
  }, []);

  const features = [
    {
      icon: 'analytics-outline',
      title: 'Advanced Analysis Engine',
      description: '7 specialized analyzers covering complexity, dependencies, security, naming conventions, SQL queries, and test coverage.',
      stats: '7 Analyzers',
      color: 'blue'
    },
    {
      icon: 'chatbubbles-outline',
      title: 'AI-Powered Intelligence',
      description: 'Natural language queries, intelligent suggestions, code explanations, and automated refactoring recommendations.',
      stats: '4 AI Types',
      color: 'purple'
    },
    {
      icon: 'construct-outline',
      title: 'Code Generation',
      description: 'Generate React components, API clients, tests, and documentation across multiple languages and frameworks.',
      stats: '6 Languages',
      color: 'green'
    },
    {
      icon: 'extension-puzzle-outline',
      title: 'Extensible Plugin System',
      description: 'Custom analyzers, commands, visualizers, and generators with full plugin management and configuration.',
      stats: '4 Plugin Types',
      color: 'orange'
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Safety & Security',
      description: 'Dry-run operations, automatic backups, test gates, and comprehensive security vulnerability scanning.',
      stats: '100% Safe',
      color: 'red'
    },
    {
      icon: 'terminal-outline',
      title: 'Powerful CLI',
      description: '13 commands covering analysis, generation, AI assistance, plugin management, and project visualization.',
      stats: '13 Commands',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 bg-blue-100 text-blue-600',
      purple: 'from-purple-500 to-purple-600 bg-purple-100 text-purple-600',
      green: 'from-green-500 to-green-600 bg-green-100 text-green-600',
      orange: 'from-orange-500 to-orange-600 bg-orange-100 text-orange-600',
      red: 'from-red-500 to-red-600 bg-red-100 text-red-600',
      indigo: 'from-indigo-500 to-indigo-600 bg-indigo-100 text-indigo-600'
    };
    return colors[color] || colors.blue;
  };

  return React.createElement('div', { className: 'space-y-8' },
    // Hero Section
    React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg' },
      React.createElement('div', { className: 'px-8 py-12' },
        React.createElement('div', { className: 'max-w-4xl mx-auto text-center' },
          React.createElement('h1', { className: 'text-4xl font-bold text-gray-900 mb-4' }, 
            'Hydro'
          ),
          React.createElement('p', { className: 'text-xl text-gray-600 mb-6' }, 
            'Unified Development Environment Catalyst'
          ),
          React.createElement('p', { className: 'text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8' }, 
            'Intelligent code analysis, AI-powered insights, and automated development tools for modern software engineering.'
          ),
          React.createElement('div', { className: 'flex flex-wrap justify-center gap-4' },
            React.createElement('button', { className: 'bg-gray-900 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors flex items-center' },
              React.createElement('ion-icon', { name: 'play-outline', className: 'mr-2' }),
              'Get Started'
            ),
            React.createElement('button', { className: 'border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center' },
              React.createElement('ion-icon', { name: 'document-text-outline', className: 'mr-2' }),
              'Documentation'
            )
          )
        )
      )
    ),

    // System Status Dashboard
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
      React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-sm font-medium text-gray-900' }, 'System Status'),
            loading ? 
              React.createElement('div', { className: 'flex items-center mt-1' },
                React.createElement('div', { className: 'animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600' }),
                React.createElement('span', { className: 'ml-2 text-xs text-gray-500' }, 'Checking...')
              ) :
              React.createElement('div', { className: 'flex items-center mt-1' },
                React.createElement('div', { className: 'w-2 h-2 bg-green-500 rounded-full mr-2' }),
                React.createElement('span', { className: 'text-xs text-gray-600' }, status?.status || 'Operational')
              )
          ),
          React.createElement('ion-icon', { name: 'checkmark-circle-outline', className: 'text-gray-400' })
        )
      ),

      React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-sm font-medium text-gray-900' }, 'Analyzers'),
            React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, '7 specialized tools')
          ),
          React.createElement('ion-icon', { name: 'analytics-outline', className: 'text-gray-400' })
        )
      ),

      React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-sm font-medium text-gray-900' }, 'AI Assistant'),
            React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, '4 query types')
          ),
          React.createElement('ion-icon', { name: 'chatbubbles-outline', className: 'text-gray-400' })
        )
      ),

      React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-sm font-medium text-gray-900' }, 'CLI Commands'),
            React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, '13 commands')
          ),
          React.createElement('ion-icon', { name: 'terminal-outline', className: 'text-gray-400' })
        )
      )
    ),

    // Core Features Grid
    React.createElement('div', null,
      React.createElement('h2', { className: 'text-2xl font-semibold text-gray-900 mb-6' }, 'Core Capabilities'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
        ...features.map((feature, index) =>
          React.createElement('div', { key: index, className: 'bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors' },
            React.createElement('div', { className: 'flex items-start' },
              React.createElement('div', { className: 'w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0' },
                React.createElement('ion-icon', { name: feature.icon, className: 'text-lg text-gray-600' })
              ),
              React.createElement('div', null,
                React.createElement('h3', { className: 'text-lg font-medium text-gray-900 mb-2' }, feature.title),
                React.createElement('p', { className: 'text-sm text-gray-600 mb-3' }, feature.description),
                React.createElement('span', { className: 'inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded' },
                  feature.stats
                )
              )
            )
          )
        )
      )
    ),

    // Project Metrics
    metrics && React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-6' },
      React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 mb-6' }, 'Project Overview'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
        React.createElement('div', { className: 'text-center p-4' },
          React.createElement('div', { className: 'text-2xl font-bold text-gray-900 mb-1' }, metrics.metrics.totalFiles),
          React.createElement('p', { className: 'text-sm text-gray-600' }, 'Total Files')
        ),
        React.createElement('div', { className: 'text-center p-4' },
          React.createElement('div', { className: 'text-2xl font-bold text-gray-900 mb-1' }, metrics.metrics.totalLines.toLocaleString()),
          React.createElement('p', { className: 'text-sm text-gray-600' }, 'Lines of Code')
        ),
        React.createElement('div', { className: 'text-center p-4' },
          React.createElement('div', { className: 'text-2xl font-bold text-gray-900 mb-1' }, metrics.metrics.complexityScore),
          React.createElement('p', { className: 'text-sm text-gray-600' }, 'Complexity Score')
        ),
        React.createElement('div', { className: 'text-center p-4' },
          React.createElement('div', { className: 'text-2xl font-bold text-gray-900 mb-1' }, `${metrics.metrics.testCoverage}%`),
          React.createElement('p', { className: 'text-sm text-gray-600' }, 'Test Coverage')
        )
      )
    )
  );
};

// Export as default for dynamic import
window.HomePage = HomePage;