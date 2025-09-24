const { useState, useEffect } = React;

const PluginsPage = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [installedPlugins, setInstalledPlugins] = useState([]);

  useEffect(() => {
    // Mock plugin data based on actual Hydro plugin system
    const mockPlugins = [
      {
        id: 'performance-analyzer',
        name: 'Performance Analyzer',
        version: '2.1.0',
        description: 'Advanced performance analysis with bottleneck detection, memory profiling, and optimization recommendations',
        author: 'Hydro Team',
        downloads: 12450,
        rating: 4.9,
        type: 'analyzer',
        category: 'Performance',
        icon: 'speedometer-outline',
        status: 'active',
        features: [
          'Memory leak detection',
          'CPU usage profiling',
          'Bundle size analysis',
          'Render performance metrics',
          'Database query optimization',
          'API response time tracking'
        ],
        requirements: ['Node.js 16+', 'Hydro 1.0+'],
        size: '2.3 MB',
        lastUpdated: '2024-01-15',
        license: 'MIT',
        homepage: 'https://github.com/hydro/performance-analyzer',
        repository: 'https://github.com/hydro/performance-analyzer',
        tags: ['performance', 'optimization', 'profiling', 'memory'],
        configuration: {
          enabled: true,
          threshold: 100,
          monitoring: true,
          alerts: true
        }
      },
      {
        id: 'accessibility-analyzer',
        name: 'Accessibility Analyzer',
        version: '1.8.2',
        description: 'Comprehensive accessibility testing ensuring WCAG compliance and inclusive design standards',
        author: 'Accessibility Labs',
        downloads: 8967,
        rating: 4.8,
        type: 'analyzer',
        category: 'Accessibility',
        icon: 'accessibility-outline',
        status: 'active',
        features: [
          'WCAG 2.1 AA compliance',
          'Screen reader compatibility',
          'Keyboard navigation testing',
          'Color contrast validation',
          'ARIA attributes checking',
          'Focus management analysis'
        ],
        requirements: ['Node.js 14+', 'Hydro 1.0+'],
        size: '1.8 MB',
        lastUpdated: '2024-01-12',
        license: 'MIT',
        homepage: 'https://github.com/accessibility-labs/hydro-plugin',
        repository: 'https://github.com/accessibility-labs/hydro-plugin',
        tags: ['accessibility', 'wcag', 'inclusive', 'testing'],
        configuration: {
          enabled: true,
          level: 'AA',
          strict: false,
          autoFix: true
        }
      },
      {
        id: 'security-scanner',
        name: 'Security Scanner',
        version: '3.0.1',
        description: 'Advanced security vulnerability detection with OWASP compliance and threat modeling',
        author: 'Security Experts',
        downloads: 15678,
        rating: 4.9,
        type: 'analyzer',
        category: 'Security',
        icon: 'shield-checkmark-outline',
        status: 'active',
        features: [
          'OWASP Top 10 scanning',
          'Dependency vulnerability check',
          'SQL injection detection',
          'XSS prevention analysis',
          'Authentication audit',
          'Encryption validation'
        ],
        requirements: ['Node.js 16+', 'Hydro 1.2+'],
        size: '3.2 MB',
        lastUpdated: '2024-01-18',
        license: 'MIT',
        homepage: 'https://security-experts.com/hydro',
        repository: 'https://github.com/security-experts/hydro-scanner',
        tags: ['security', 'owasp', 'vulnerability', 'audit'],
        configuration: {
          enabled: true,
          level: 'strict',
          autoScan: true,
          reportFormat: 'detailed'
        }
      },
      {
        id: 'custom-commands',
        name: 'Custom Commands',
        version: '1.5.0',
        description: 'Additional utility commands for project insights, automation, and workflow enhancement',
        author: 'Hydro Community',
        downloads: 5678,
        rating: 4.6,
        type: 'command',
        category: 'Utilities',
        icon: 'terminal-outline',
        status: 'active',
        features: [
          'Project statistics',
          'Git workflow automation',
          'File organization',
          'Dependency management',
          'Build optimization',
          'Deployment helpers'
        ],
        requirements: ['Node.js 14+', 'Hydro 1.0+'],
        size: '1.1 MB',
        lastUpdated: '2024-01-10',
        license: 'MIT',
        homepage: 'https://github.com/hydro-community/commands',
        repository: 'https://github.com/hydro-community/commands',
        tags: ['utilities', 'automation', 'workflow', 'commands'],
        configuration: {
          enabled: true,
          autoUpdate: true,
          verbose: false
        }
      },
      {
        id: 'code-visualizer',
        name: 'Code Visualizer',
        version: '2.3.0',
        description: 'Interactive code visualization with dependency graphs, architecture diagrams, and flow charts',
        author: 'Visual Studio',
        downloads: 9876,
        rating: 4.7,
        type: 'visualizer',
        category: 'Visualization',
        icon: 'eye-outline',
        status: 'active',
        features: [
          'Dependency graph visualization',
          'Architecture diagram generation',
          'Code flow analysis',
          'Interactive exploration',
          'Export to multiple formats',
          'Real-time updates'
        ],
        requirements: ['Node.js 16+', 'Hydro 1.1+'],
        size: '4.1 MB',
        lastUpdated: '2024-01-14',
        license: 'MIT',
        homepage: 'https://visual-studio.com/hydro',
        repository: 'https://github.com/visual-studio/hydro-viz',
        tags: ['visualization', 'diagrams', 'architecture', 'graphs'],
        configuration: {
          enabled: true,
          interactive: true,
          autoLayout: true,
          exportFormats: ['svg', 'png', 'pdf']
        }
      },
      {
        id: 'api-generator',
        name: 'API Generator',
        version: '1.9.0',
        description: 'Intelligent API code generation with OpenAPI integration and type-safe clients',
        author: 'API Masters',
        downloads: 7234,
        rating: 4.8,
        type: 'generator',
        category: 'Generation',
        icon: 'cloud-outline',
        status: 'active',
        features: [
          'OpenAPI/Swagger integration',
          'Type-safe client generation',
          'Mock server creation',
          'API documentation',
          'Testing suite generation',
          'Multiple language support'
        ],
        requirements: ['Node.js 16+', 'Hydro 1.2+'],
        size: '2.8 MB',
        lastUpdated: '2024-01-16',
        license: 'MIT',
        homepage: 'https://api-masters.com/hydro',
        repository: 'https://github.com/api-masters/hydro-generator',
        tags: ['api', 'generation', 'openapi', 'typescript'],
        configuration: {
          enabled: true,
          languages: ['typescript', 'javascript', 'python'],
          frameworks: ['react', 'vue', 'angular'],
          mockServer: true
        }
      }
    ];

    setPlugins(mockPlugins);
    setInstalledPlugins(['performance-analyzer', 'accessibility-analyzer', 'security-scanner']);
    setLoading(false);
  }, []);

  const categories = ['all', 'analyzer', 'command', 'visualizer', 'generator'];
  
  const filteredPlugins = plugins.filter(plugin => {
    if (filter === 'all') return true;
    return plugin.type === filter;
  });

  const getTypeColor = (type) => {
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }
    return stars.join('');
  };

  const handleInstall = (pluginId) => {
    if (installedPlugins.includes(pluginId)) {
      setInstalledPlugins(prev => prev.filter(id => id !== pluginId));
    } else {
      setInstalledPlugins(prev => [...prev, pluginId]);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center py-12' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }),
      React.createElement('span', { className: 'ml-3 text-gray-600' }, 'Loading plugins...')
    );
  }

  return React.createElement('div', { className: 'space-y-6' },
    // Header
    React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-6' },
      React.createElement('h1', { className: 'text-2xl font-semibold text-gray-900 mb-2' }, 'Plugin Marketplace'),
      React.createElement('p', { className: 'text-gray-600 mb-4' }, 
        'Extend Hydro\'s functionality with powerful plugins.'
      ),
      React.createElement('div', { className: 'flex items-center space-x-4 text-sm text-gray-500' },
        React.createElement('span', null, '6 Plugins'),
        React.createElement('span', null, '•'),
        React.createElement('span', null, '3 Installed'),
        React.createElement('span', null, '•'),
        React.createElement('span', null, '4 Categories')
      )
    ),

    // Filter Tabs
    React.createElement('div', { className: 'flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit' },
      ...[
        { id: 'all', label: 'All Plugins', icon: 'apps-outline' },
        { id: 'analyzer', label: 'Analyzers', icon: 'analytics-outline' },
        { id: 'command', label: 'Commands', icon: 'terminal-outline' },
        { id: 'visualizer', label: 'Visualizers', icon: 'eye-outline' },
        { id: 'generator', label: 'Generators', icon: 'construct-outline' }
      ].map((tab) =>
        React.createElement('button', {
          key: tab.id,
          onClick: () => setFilter(tab.id),
          className: `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
            filter === tab.id
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`
        },
          React.createElement('ion-icon', { name: tab.icon, className: 'mr-2' }),
          tab.label
        )
      )
    ),

    // Plugins Grid
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
      ...filteredPlugins.map((plugin) =>
        React.createElement('div', { 
          key: plugin.id, 
          className: 'bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer',
          onClick: () => setSelectedPlugin(selectedPlugin?.id === plugin.id ? null : plugin)
        },
          React.createElement('div', { className: 'flex items-start justify-between mb-3' },
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('div', { className: 'w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3' },
                React.createElement('ion-icon', { name: plugin.icon, className: 'text-lg text-gray-600' })
              ),
              React.createElement('div', { className: 'flex-1' },
                React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-1' }, plugin.name),
                React.createElement('div', { className: 'flex items-center space-x-2 mb-2' },
                  React.createElement('span', { className: `px-2 py-1 rounded-full text-xs font-semibold border ${getTypeColor(plugin.type)}` }, 
                    plugin.type
                  ),
                  React.createElement('span', { className: 'text-sm text-gray-500' }, `v${plugin.version}`)
                )
              )
            ),
            React.createElement('div', { className: 'text-right' },
              React.createElement('div', { className: 'flex items-center mb-1' },
                React.createElement('span', { className: 'text-sm text-gray-600 mr-1' }, getRatingStars(plugin.rating)),
                React.createElement('span', { className: 'text-sm font-semibold text-gray-900' }, plugin.rating)
              ),
              React.createElement('div', { className: 'text-xs text-gray-500' }, `${plugin.downloads.toLocaleString()} downloads`)
            )
          ),

          React.createElement('p', { className: 'text-gray-600 text-sm mb-4 line-clamp-3' }, plugin.description),

          React.createElement('div', { className: 'mb-4' },
            React.createElement('h4', { className: 'text-sm font-semibold text-gray-900 mb-2' }, 'Key Features:'),
            React.createElement('div', { className: 'space-y-1' },
              ...plugin.features.slice(0, 3).map((feature, index) =>
                React.createElement('div', { key: index, className: 'flex items-center text-xs text-gray-600' },
                  React.createElement('ion-icon', { name: 'checkmark-circle-outline', className: 'text-green-500 mr-2 text-sm' }),
                  feature
                )
              ),
              plugin.features.length > 3 && 
                React.createElement('div', { className: 'text-xs text-gray-500 ml-4' }, `+${plugin.features.length - 3} more features`)
            )
          ),

          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'text-sm text-gray-500' },
              'by ', React.createElement('span', { className: 'font-semibold' }, plugin.author)
            ),
            React.createElement('div', { className: 'flex space-x-2' },
              React.createElement('button', {
                onClick: (e) => {
                  e.stopPropagation();
                  handleInstall(plugin.id);
                },
                className: `px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center ${
                  installedPlugins.includes(plugin.id)
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`
              },
                React.createElement('ion-icon', { 
                  name: installedPlugins.includes(plugin.id) ? 'trash-outline' : 'download-outline', 
                  className: 'mr-1' 
                }),
                installedPlugins.includes(plugin.id) ? 'Remove' : 'Install'
              ),
              React.createElement('button', {
                onClick: (e) => {
                  e.stopPropagation();
                  setSelectedPlugin(plugin);
                },
                className: 'border border-gray-300 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-50 transition-colors duration-200 flex items-center'
              },
                React.createElement('ion-icon', { name: 'information-outline', className: 'mr-1' }),
                'Details'
              )
            )
          )
        )
      )
    ),

    // Selected Plugin Details
    selectedPlugin && React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-8 border border-gray-100' },
      React.createElement('div', { className: 'flex items-center justify-between mb-6' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mr-6' },
            React.createElement('ion-icon', { name: selectedPlugin.icon, className: 'text-3xl text-blue-600' })
          ),
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-3xl font-bold text-gray-900' }, selectedPlugin.name),
            React.createElement('div', { className: 'flex items-center space-x-4 mt-2' },
              React.createElement('span', { className: `px-3 py-1 rounded-full text-sm font-semibold border ${getTypeColor(selectedPlugin.type)}` }, 
                selectedPlugin.type
              ),
              React.createElement('span', { className: 'text-gray-600' }, `v${selectedPlugin.version}`),
              React.createElement('span', { className: 'text-gray-600' }, `by ${selectedPlugin.author}`)
            )
          )
        ),
        React.createElement('button', {
          onClick: () => setSelectedPlugin(null),
          className: 'text-gray-400 hover:text-gray-600'
        },
          React.createElement('ion-icon', { name: 'close-outline', className: 'text-2xl' })
        )
      ),

      React.createElement('p', { className: 'text-gray-600 text-lg mb-6' }, selectedPlugin.description),

      React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-8' },
        // Features
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Features'),
          React.createElement('div', { className: 'space-y-3' },
            ...selectedPlugin.features.map((feature, index) =>
              React.createElement('div', { key: index, className: 'flex items-center p-3 bg-gray-50 rounded-lg' },
                React.createElement('ion-icon', { name: 'checkmark-circle-outline', className: 'text-green-600 mr-3' }),
                React.createElement('span', { className: 'text-gray-700' }, feature)
              )
            )
          )
        ),

        // Configuration
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Configuration'),
          React.createElement('div', { className: 'space-y-3' },
            ...Object.entries(selectedPlugin.configuration).map(([key, value]) =>
              React.createElement('div', { key: key, className: 'flex justify-between items-center p-3 bg-gray-50 rounded-lg' },
                React.createElement('span', { className: 'text-gray-600 capitalize' }, key.replace(/([A-Z])/g, ' $1').trim()),
                React.createElement('span', { className: 'font-semibold text-gray-900' }, 
                  typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : 
                  typeof value === 'object' ? value.join(', ') : value
                )
              )
            )
          )
        ),

        // Plugin Info
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Plugin Information'),
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-600' }, 'Downloads'),
              React.createElement('span', { className: 'font-semibold text-gray-900' }, selectedPlugin.downloads.toLocaleString())
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-600' }, 'Size'),
              React.createElement('span', { className: 'font-semibold text-gray-900' }, selectedPlugin.size)
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-600' }, 'License'),
              React.createElement('span', { className: 'font-semibold text-gray-900' }, selectedPlugin.license)
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-600' }, 'Last Updated'),
              React.createElement('span', { className: 'font-semibold text-gray-900' }, selectedPlugin.lastUpdated)
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-600' }, 'Requirements'),
              React.createElement('span', { className: 'font-semibold text-gray-900' }, selectedPlugin.requirements.join(', '))
            )
          )
        )
      ),

      // Tags
      React.createElement('div', { className: 'mt-6' },
        React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-3' }, 'Tags'),
        React.createElement('div', { className: 'flex flex-wrap gap-2' },
          ...selectedPlugin.tags.map((tag) =>
            React.createElement('span', { key: tag, className: 'px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full' }, tag)
          )
        )
      ),

      // Actions
      React.createElement('div', { className: 'mt-8 flex space-x-4' },
        React.createElement('button', {
          onClick: () => handleInstall(selectedPlugin.id),
          className: `px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center ${
            installedPlugins.includes(selectedPlugin.id)
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`
        },
          React.createElement('ion-icon', { 
            name: installedPlugins.includes(selectedPlugin.id) ? 'trash-outline' : 'download-outline', 
            className: 'mr-2' 
          }),
          installedPlugins.includes(selectedPlugin.id) ? 'Remove Plugin' : 'Install Plugin'
        ),
        React.createElement('button', { className: 'border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center' },
          React.createElement('ion-icon', { name: 'settings-outline', className: 'mr-2' }),
          'Configure'
        ),
        React.createElement('button', { className: 'border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center' },
          React.createElement('ion-icon', { name: 'document-text-outline', className: 'mr-2' }),
          'Documentation'
        )
      )
    ),

    // Plugin Statistics
    React.createElement('div', { className: 'bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white' },
      React.createElement('h2', { className: 'text-2xl font-bold mb-6' }, 'Plugin Ecosystem'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '6'),
          React.createElement('p', { className: 'text-blue-100' }, 'Available Plugins')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '58K'),
          React.createElement('p', { className: 'text-blue-100' }, 'Total Downloads')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '4.8'),
          React.createElement('p', { className: 'text-blue-100' }, 'Average Rating')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '4'),
          React.createElement('p', { className: 'text-blue-100' }, 'Categories')
        )
      )
    )
  );
};

window.PluginsPage = PluginsPage;