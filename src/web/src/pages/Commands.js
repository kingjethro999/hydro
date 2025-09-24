const { useState, useEffect } = React;

const CommandsPage = () => {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommand, setSelectedCommand] = useState(null);

  useEffect(() => {
    // Mock commands data based on actual Hydro CLI commands
    const mockCommands = [
      {
        name: 'hydro init',
        description: 'Initialize Hydro configuration in your project',
        category: 'setup',
        icon: 'rocket-outline',
        examples: [
          'hydro init',
          'hydro init --template advanced',
          'hydro init --force'
        ],
        options: [
          { flag: '--template', description: 'Use a specific template', values: ['basic', 'advanced', 'minimal'] },
          { flag: '--force', description: 'Overwrite existing configuration' },
          { flag: '--interactive', description: 'Interactive setup mode' }
        ],
        details: 'Creates a hydro.yml configuration file with default settings and project structure.'
      },
      {
        name: 'hydro scan',
        description: 'Scan project files and generate comprehensive analysis',
        category: 'analysis',
        icon: 'search-outline',
        examples: [
          'hydro scan',
          'hydro scan --full',
          'hydro scan --path src',
          'hydro scan --exclude node_modules'
        ],
        options: [
          { flag: '--full', description: 'Full project scan including dependencies' },
          { flag: '--path', description: 'Scan specific directory', values: ['src', 'lib', 'tests'] },
          { flag: '--exclude', description: 'Exclude files matching pattern' },
          { flag: '--output', description: 'Output format', values: ['json', 'html', 'text'] }
        ],
        details: 'Performs comprehensive analysis of your codebase using all available analyzers.'
      },
      {
        name: 'hydro analyze',
        description: 'Run specific analysis operations with detailed insights',
        category: 'analysis',
        icon: 'analytics-outline',
        examples: [
          'hydro analyze --complexity',
          'hydro analyze --security',
          'hydro analyze --all',
          'hydro analyze --dependency --circular'
        ],
        options: [
          { flag: '--complexity', description: 'Analyze code complexity' },
          { flag: '--dependency', description: 'Check dependencies and cycles' },
          { flag: '--security', description: 'Run security analysis' },
          { flag: '--naming', description: 'Validate naming conventions' },
          { flag: '--test', description: 'Analyze test coverage' },
          { flag: '--all', description: 'Run all analyses' }
        ],
        details: 'Executes specific analyzers with detailed reporting and recommendations.'
      },
      {
        name: 'hydro ai',
        description: 'AI-powered code analysis and intelligent suggestions',
        category: 'ai',
        icon: 'chatbubbles-outline',
        examples: [
          'hydro ai "How can I improve this function?"',
          'hydro ai --suggest --file src/utils/helpers.ts',
          'hydro ai --explain --pattern "complex algorithm"'
        ],
        options: [
          { flag: '--suggest', description: 'Generate improvement suggestions' },
          { flag: '--explain', description: 'Explain code functionality' },
          { flag: '--refactor', description: 'Suggest refactoring opportunities' },
          { flag: '--file', description: 'Analyze specific file' },
          { flag: '--pattern', description: 'Search for code patterns' }
        ],
        details: 'Leverages AI to provide intelligent code analysis, explanations, and improvement suggestions.'
      },
      {
        name: 'hydro generate',
        description: 'Generate code components, tests, and documentation',
        category: 'generation',
        icon: 'construct-outline',
        examples: [
          'hydro generate component MyComponent',
          'hydro generate test --file src/utils.js',
          'hydro generate api-client --endpoint /users'
        ],
        options: [
          { flag: '--component', description: 'Generate React component' },
          { flag: '--test', description: 'Generate test files' },
          { flag: '--api-client', description: 'Generate API client' },
          { flag: '--type', description: 'Specify component type', values: ['functional', 'class', 'hook'] },
          { flag: '--framework', description: 'Target framework', values: ['react', 'vue', 'angular'] }
        ],
        details: 'Intelligent code generation with templates, best practices, and type safety.'
      },
      {
        name: 'hydro plugin',
        description: 'Manage plugins and extensions',
        category: 'plugins',
        icon: 'extension-puzzle-outline',
        examples: [
          'hydro plugin list',
          'hydro plugin install performance-analyzer',
          'hydro plugin remove old-plugin',
          'hydro plugin enable security-checker'
        ],
        options: [
          { flag: 'list', description: 'List installed plugins' },
          { flag: 'install', description: 'Install plugin from registry' },
          { flag: 'remove', description: 'Remove installed plugin' },
          { flag: 'enable', description: 'Enable plugin' },
          { flag: 'disable', description: 'Disable plugin' },
          { flag: 'update', description: 'Update all plugins' }
        ],
        details: 'Comprehensive plugin management system for extending Hydro capabilities.'
      },
      {
        name: 'hydro codemap',
        description: 'Generate visual code maps and dependency graphs',
        category: 'visualization',
        icon: 'map-outline',
        examples: [
          'hydro codemap --type dependencies',
          'hydro codemap --type complexity --output graph.html',
          'hydro codemap --interactive'
        ],
        options: [
          { flag: '--type', description: 'Map type', values: ['dependencies', 'complexity', 'coverage', 'architecture'] },
          { flag: '--output', description: 'Output file format', values: ['html', 'svg', 'png', 'json'] },
          { flag: '--interactive', description: 'Generate interactive visualization' },
          { flag: '--depth', description: 'Maximum dependency depth' }
        ],
        details: 'Creates visual representations of your codebase structure and relationships.'
      },
      {
        name: 'hydro web',
        description: 'Launch the Hydro web interface',
        category: 'interface',
        icon: 'globe-outline',
        examples: [
          'hydro web',
          'hydro web --port 3001',
          'hydro web --host 0.0.0.0'
        ],
        options: [
          { flag: '--port', description: 'Port number', values: ['3000', '3001', '8080'] },
          { flag: '--host', description: 'Host address', values: ['localhost', '0.0.0.0'] },
          { flag: '--open', description: 'Open in browser automatically' }
        ],
        details: 'Starts the Hydro web interface for interactive analysis and visualization.'
      },
      {
        name: 'hydro write',
        description: 'Generate documentation and reports',
        category: 'documentation',
        icon: 'document-text-outline',
        examples: [
          'hydro write --type api-docs',
          'hydro write --type readme --output README.md',
          'hydro write --type changelog'
        ],
        options: [
          { flag: '--type', description: 'Documentation type', values: ['api-docs', 'readme', 'changelog', 'architecture'] },
          { flag: '--output', description: 'Output file path' },
          { flag: '--format', description: 'Output format', values: ['markdown', 'html', 'pdf'] }
        ],
        details: 'Automatically generates comprehensive documentation from your codebase analysis.'
      },
      {
        name: 'hydro update',
        description: 'Update Hydro and its components',
        category: 'maintenance',
        icon: 'refresh-outline',
        examples: [
          'hydro update',
          'hydro update --check',
          'hydro update --beta'
        ],
        options: [
          { flag: '--check', description: 'Check for updates without installing' },
          { flag: '--beta', description: 'Update to beta version' },
          { flag: '--force', description: 'Force update even if same version' }
        ],
        details: 'Keeps Hydro and its plugins up to date with the latest features and improvements.'
      },
      {
        name: 'hydro version',
        description: 'Display version information',
        category: 'info',
        icon: 'information-circle-outline',
        examples: [
          'hydro version',
          'hydro version --verbose',
          'hydro version --json'
        ],
        options: [
          { flag: '--verbose', description: 'Show detailed version info' },
          { flag: '--json', description: 'Output in JSON format' }
        ],
        details: 'Shows current Hydro version and component information.'
      },
      {
        name: 'hydro info',
        description: 'Display project and system information',
        category: 'info',
        icon: 'information-outline',
        examples: [
          'hydro info',
          'hydro info --project',
          'hydro info --system'
        ],
        options: [
          { flag: '--project', description: 'Show project-specific information' },
          { flag: '--system', description: 'Show system information' },
          { flag: '--json', description: 'Output in JSON format' }
        ],
        details: 'Provides comprehensive information about your project and system configuration.'
      }
    ];

    setCommands(mockCommands);
    setLoading(false);
  }, []);

  const categories = [
    { id: 'all', label: 'All Commands', icon: 'apps-outline' },
    { id: 'setup', label: 'Setup', icon: 'rocket-outline' },
    { id: 'analysis', label: 'Analysis', icon: 'analytics-outline' },
    { id: 'ai', label: 'AI', icon: 'chatbubbles-outline' },
    { id: 'generation', label: 'Generation', icon: 'construct-outline' },
    { id: 'plugins', label: 'Plugins', icon: 'extension-puzzle-outline' },
    { id: 'visualization', label: 'Visualization', icon: 'map-outline' },
    { id: 'interface', label: 'Interface', icon: 'globe-outline' },
    { id: 'documentation', label: 'Documentation', icon: 'document-text-outline' },
    { id: 'maintenance', label: 'Maintenance', icon: 'refresh-outline' },
    { id: 'info', label: 'Info', icon: 'information-outline' }
  ];

  const filteredCommands = commands.filter(command => {
    const matchesCategory = selectedCategory === 'all' || command.category === selectedCategory;
    const matchesSearch = command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         command.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case 'setup': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-green-100 text-green-800';
      case 'ai': return 'bg-purple-100 text-purple-800';
      case 'generation': return 'bg-orange-100 text-orange-800';
      case 'plugins': return 'bg-pink-100 text-pink-800';
      case 'visualization': return 'bg-cyan-100 text-cyan-800';
      case 'interface': return 'bg-indigo-100 text-indigo-800';
      case 'documentation': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center py-12' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }),
      React.createElement('span', { className: 'ml-3 text-gray-600' }, 'Loading commands...')
    );
  }

  return React.createElement('div', { className: 'space-y-8' },
    // Header
    React.createElement('div', null,
      React.createElement('h1', { className: 'text-4xl font-bold text-gray-900 mb-4 flex items-center' },
        React.createElement('ion-icon', { name: 'terminal-outline', className: 'mr-4 text-blue-600' }),
        'CLI Commands'
      ),
      React.createElement('p', { className: 'text-xl text-gray-600 mb-6' }, 
        'Comprehensive command-line interface with 13 powerful commands for development workflow automation.'
      )
    ),

    // Search and Filter
    React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', { className: 'relative' },
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search commands...',
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: 'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        }),
        React.createElement('ion-icon', { name: 'search-outline', className: 'absolute left-3 top-3.5 text-gray-400' })
      ),

      React.createElement('div', { className: 'flex flex-wrap gap-2' },
        ...categories.map((category) =>
          React.createElement('button', {
            key: category.id,
            onClick: () => setSelectedCategory(category.id),
            className: `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`
          },
            React.createElement('ion-icon', { name: category.icon, className: 'mr-2' }),
            category.label
          )
        )
      )
    ),

    // Commands Grid
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
      ...filteredCommands.map((command, index) =>
        React.createElement('div', { 
          key: index, 
          className: 'bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer',
          onClick: () => setSelectedCommand(selectedCommand?.name === command.name ? null : command)
        },
          React.createElement('div', { className: 'flex items-start justify-between mb-4' },
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('div', { className: 'w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4' },
                React.createElement('ion-icon', { name: command.icon, className: 'text-2xl text-blue-600' })
              ),
              React.createElement('div', null,
                React.createElement('div', { className: 'flex items-center space-x-3 mb-1' },
                  React.createElement('code', { className: 'text-lg font-mono bg-gray-100 px-3 py-1 rounded-lg' }, command.name),
                  React.createElement('span', { className: `px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(command.category)}` }, 
                    command.category
                  )
                ),
                React.createElement('p', { className: 'text-gray-600' }, command.description)
              )
            )
          ),
          
          command.examples && command.examples.length > 0 && 
            React.createElement('div', { className: 'mb-4' },
              React.createElement('h4', { className: 'text-sm font-semibold text-gray-900 mb-2' }, 'Examples:'),
              React.createElement('div', { className: 'space-y-2' },
                ...command.examples.slice(0, 2).map((example, exampleIndex) =>
                  React.createElement('div', { key: exampleIndex, className: 'bg-gray-50 rounded-lg p-3 flex items-center justify-between' },
                    React.createElement('code', { className: 'text-sm font-mono text-gray-800' }, example),
                    React.createElement('button', {
                      onClick: (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(example);
                      },
                      className: 'text-gray-500 hover:text-gray-700 text-sm'
                    }, 'Copy')
                  )
                )
              )
            )
        )
      )
    ),

    // Selected Command Details
    selectedCommand && React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-8 border border-gray-100' },
      React.createElement('div', { className: 'flex items-center justify-between mb-6' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mr-6' },
            React.createElement('ion-icon', { name: selectedCommand.icon, className: 'text-3xl text-blue-600' })
          ),
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-3xl font-bold text-gray-900' }, selectedCommand.name),
            React.createElement('p', { className: 'text-gray-600 text-lg' }, selectedCommand.description)
          )
        ),
        React.createElement('button', {
          onClick: () => setSelectedCommand(null),
          className: 'text-gray-400 hover:text-gray-600'
        },
          React.createElement('ion-icon', { name: 'close-outline', className: 'text-2xl' })
        )
      ),

      React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-8' },
        // Examples
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Usage Examples'),
          React.createElement('div', { className: 'space-y-3' },
            ...selectedCommand.examples.map((example, index) =>
              React.createElement('div', { key: index, className: 'bg-gray-50 rounded-lg p-4' },
                React.createElement('code', { className: 'text-sm font-mono text-gray-800' }, example),
                React.createElement('button', {
                  onClick: () => navigator.clipboard.writeText(example),
                  className: 'mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center'
                },
                  React.createElement('ion-icon', { name: 'copy-outline', className: 'mr-1' }),
                  'Copy'
                )
              )
            )
          )
        ),

        // Options
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Options'),
          React.createElement('div', { className: 'space-y-3' },
            ...selectedCommand.options.map((option, index) =>
              React.createElement('div', { key: index, className: 'p-3 bg-gray-50 rounded-lg' },
                React.createElement('div', { className: 'flex items-center mb-1' },
                  React.createElement('code', { className: 'text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2' }, option.flag),
                  React.createElement('span', { className: 'text-sm text-gray-700' }, option.description)
                ),
                option.values && React.createElement('div', { className: 'ml-4 text-xs text-gray-500' },
                  'Values: ', option.values.join(', ')
                )
              )
            )
          )
        )
      ),

      // Details
      React.createElement('div', { className: 'mt-8 p-6 bg-blue-50 rounded-xl' },
        React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-2' }, 'Details'),
        React.createElement('p', { className: 'text-gray-700' }, selectedCommand.details)
      )
    ),

    // Command Statistics
    React.createElement('div', { className: 'bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white' },
      React.createElement('h2', { className: 'text-2xl font-bold mb-6' }, 'Command Statistics'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '13'),
          React.createElement('p', { className: 'text-blue-100' }, 'Total Commands')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '11'),
          React.createElement('p', { className: 'text-blue-100' }, 'Categories')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '47'),
          React.createElement('p', { className: 'text-blue-100' }, 'Total Options')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '100%'),
          React.createElement('p', { className: 'text-blue-100' }, 'Coverage')
        )
      )
    )
  );
};

window.CommandsPage = CommandsPage;