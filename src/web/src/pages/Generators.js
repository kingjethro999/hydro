const { useState, useEffect } = React;

const GeneratorsPage = () => {
  const [generators, setGenerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenerator, setSelectedGenerator] = useState(null);
  const [generationForm, setGenerationForm] = useState({});

  useEffect(() => {
    // Mock generator data based on actual Hydro generators
    const mockGenerators = [
      {
        id: 'react-component',
        name: 'React Component',
        icon: 'logo-react',
        description: 'Generate React components with TypeScript, tests, and documentation',
        category: 'Frontend',
        status: 'active',
        languages: ['typescript', 'javascript'],
        frameworks: ['react', 'next.js'],
        features: [
          'TypeScript support',
          'Test files generation',
          'Storybook stories',
          'CSS modules',
          'Prop validation',
          'Documentation comments'
        ],
        templates: [
          { name: 'Functional Component', description: 'Modern functional component with hooks' },
          { name: 'Class Component', description: 'Traditional class-based component' },
          { name: 'Page Component', description: 'Full page component with routing' },
          { name: 'Layout Component', description: 'Layout wrapper component' }
        ]
      },
      {
        id: 'api-client',
        name: 'API Client',
        icon: 'cloud-outline',
        description: 'Generate type-safe API clients with automatic TypeScript types',
        category: 'Backend',
        status: 'active',
        languages: ['typescript', 'javascript'],
        frameworks: ['express', 'fastify', 'koa'],
        features: [
          'TypeScript interfaces',
          'HTTP client generation',
          'Request/response types',
          'Error handling',
          'Validation schemas',
          'Documentation'
        ],
        templates: [
          { name: 'REST API', description: 'Standard REST API client' },
          { name: 'GraphQL Client', description: 'GraphQL client with queries' },
          { name: 'WebSocket Client', description: 'Real-time WebSocket client' }
        ]
      },
      {
        id: 'database-model',
        name: 'Database Model',
        icon: 'server-outline',
        description: 'Generate database models, migrations, and ORM configurations',
        category: 'Database',
        status: 'active',
        languages: ['typescript', 'javascript'],
        frameworks: ['prisma', 'sequelize', 'typeorm'],
        features: [
          'Schema generation',
          'Migration files',
          'Type definitions',
          'Validation rules',
          'Relationships',
          'Indexes'
        ],
        templates: [
          { name: 'User Model', description: 'Complete user authentication model' },
          { name: 'Content Model', description: 'Generic content management model' },
          { name: 'Audit Model', description: 'Model with audit trails' }
        ]
      },
      {
        id: 'test-suite',
        name: 'Test Suite',
        icon: 'checkmark-circle-outline',
        description: 'Generate comprehensive test suites with mocks and fixtures',
        category: 'Testing',
        status: 'active',
        languages: ['typescript', 'javascript'],
        frameworks: ['jest', 'vitest', 'mocha'],
        features: [
          'Unit tests',
          'Integration tests',
          'Mock generation',
          'Fixtures',
          'Coverage reports',
          'E2E tests'
        ],
        templates: [
          { name: 'Component Tests', description: 'React component test suite' },
          { name: 'API Tests', description: 'API endpoint test suite' },
          { name: 'Utility Tests', description: 'Utility function test suite' }
        ]
      },
      {
        id: 'documentation',
        name: 'Documentation',
        icon: 'document-text-outline',
        description: 'Generate comprehensive documentation with examples and API references',
        category: 'Documentation',
        status: 'active',
        languages: ['markdown', 'typescript'],
        frameworks: ['docusaurus', 'gitbook', 'mkdocs'],
        features: [
          'API documentation',
          'Code examples',
          'Interactive demos',
          'Type definitions',
          'Changelog generation',
          'README files'
        ],
        templates: [
          { name: 'API Docs', description: 'Complete API documentation' },
          { name: 'Component Docs', description: 'Component library documentation' },
          { name: 'Library Docs', description: 'NPM package documentation' }
        ]
      },
      {
        id: 'configuration',
        name: 'Configuration',
        icon: 'settings-outline',
        description: 'Generate project configurations, build scripts, and deployment files',
        category: 'DevOps',
        status: 'active',
        languages: ['json', 'yaml', 'typescript'],
        frameworks: ['webpack', 'vite', 'rollup'],
        features: [
          'Build configurations',
          'Deployment scripts',
          'Environment files',
          'CI/CD pipelines',
          'Docker files',
          'Package.json'
        ],
        templates: [
          { name: 'React App', description: 'Complete React application setup' },
          { name: 'Node API', description: 'Node.js API server setup' },
          { name: 'Monorepo', description: 'Multi-package monorepo setup' }
        ]
      }
    ];

    setGenerators(mockGenerators);
    setLoading(false);
  }, []);

  const handleGenerate = (generatorId) => {
    const generator = generators.find(g => g.id === generatorId);
    if (generator) {
      // Simulate generation process
      alert(`Generating ${generator.name}... This would create the files in your project.`);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center py-12' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }),
      React.createElement('span', { className: 'ml-3 text-gray-600' }, 'Loading generators...')
    );
  }

  return React.createElement('div', { className: 'space-y-8' },
    // Header
    React.createElement('div', null,
      React.createElement('h1', { className: 'text-4xl font-bold text-gray-900 mb-4 flex items-center' },
        React.createElement('ion-icon', { name: 'construct-outline', className: 'mr-4 text-blue-600' }),
        'Code Generators'
      ),
      React.createElement('p', { className: 'text-xl text-gray-600 mb-6' }, 
        'Intelligent code generation across multiple languages and frameworks. Create production-ready code with templates, best practices, and full type safety.'
      )
    ),

    // Generators Grid
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
      ...generators.map((generator) =>
        React.createElement('div', { 
          key: generator.id,
          className: 'bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300'
        },
          React.createElement('div', { className: 'flex items-start justify-between mb-4' },
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('div', { className: 'w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4' },
                React.createElement('ion-icon', { name: generator.icon, className: 'text-2xl text-blue-600' })
              ),
              React.createElement('div', null,
                React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, generator.name),
                React.createElement('span', { className: 'text-sm text-gray-500' }, generator.category)
              )
            ),
            React.createElement('span', { className: 'px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800' }, 
              generator.status
            )
          ),
          React.createElement('p', { className: 'text-gray-600 text-sm mb-4' }, generator.description),
          
          React.createElement('div', { className: 'mb-4' },
            React.createElement('h4', { className: 'text-sm font-semibold text-gray-900 mb-2' }, 'Supported Languages:'),
            React.createElement('div', { className: 'flex flex-wrap gap-1' },
              ...generator.languages.map((lang) =>
                React.createElement('span', { key: lang, className: 'px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded' }, lang)
              )
            )
          ),
          
          React.createElement('div', { className: 'mb-4' },
            React.createElement('h4', { className: 'text-sm font-semibold text-gray-900 mb-2' }, 'Frameworks:'),
            React.createElement('div', { className: 'flex flex-wrap gap-1' },
              ...generator.frameworks.map((framework) =>
                React.createElement('span', { key: framework, className: 'px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded' }, framework)
              )
            )
          ),
          
          React.createElement('button', {
            onClick: () => setSelectedGenerator(generator),
            className: 'w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center'
          },
            React.createElement('ion-icon', { name: 'settings-outline', className: 'mr-2' }),
            'Configure & Generate'
          )
        )
      )
    ),

    // Selected Generator Details
    selectedGenerator && React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-8 border border-gray-100' },
      React.createElement('div', { className: 'flex items-center justify-between mb-6' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mr-6' },
            React.createElement('ion-icon', { name: selectedGenerator.icon, className: 'text-3xl text-blue-600' })
          ),
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-3xl font-bold text-gray-900' }, selectedGenerator.name),
            React.createElement('p', { className: 'text-gray-600 text-lg' }, selectedGenerator.description)
          )
        ),
        React.createElement('button', {
          onClick: () => setSelectedGenerator(null),
          className: 'text-gray-400 hover:text-gray-600'
        },
          React.createElement('ion-icon', { name: 'close-outline', className: 'text-2xl' })
        )
      ),

      React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-8' },
        // Templates
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Available Templates'),
          React.createElement('div', { className: 'space-y-3' },
            ...selectedGenerator.templates.map((template, index) =>
              React.createElement('div', { key: index, className: 'p-4 bg-gray-50 rounded-lg border border-gray-200' },
                React.createElement('h4', { className: 'font-semibold text-gray-900 mb-1' }, template.name),
                React.createElement('p', { className: 'text-sm text-gray-600' }, template.description),
                React.createElement('button', {
                  onClick: () => handleGenerate(selectedGenerator.id),
                  className: 'mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center'
                },
                  React.createElement('ion-icon', { name: 'play-outline', className: 'mr-1' }),
                  'Generate'
                )
              )
            )
          )
        ),

        // Features
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Features'),
          React.createElement('div', { className: 'space-y-3' },
            ...selectedGenerator.features.map((feature, index) =>
              React.createElement('div', { key: index, className: 'flex items-center p-3 bg-gray-50 rounded-lg' },
                React.createElement('ion-icon', { name: 'checkmark-circle-outline', className: 'text-green-600 mr-3' }),
                React.createElement('span', { className: 'text-gray-700' }, feature)
              )
            )
          )
        )
      ),

      // Generation Form
      React.createElement('div', { className: 'mt-8 p-6 bg-gray-50 rounded-xl' },
        React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-4' }, 'Generation Options'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Component Name'),
            React.createElement('input', {
              type: 'text',
              placeholder: 'MyComponent',
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Output Directory'),
            React.createElement('input', {
              type: 'text',
              placeholder: './src/components',
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Framework'),
            React.createElement('select', { className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent' },
              ...selectedGenerator.frameworks.map((framework) =>
                React.createElement('option', { key: framework, value: framework }, framework)
              )
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Language'),
            React.createElement('select', { className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent' },
              ...selectedGenerator.languages.map((language) =>
                React.createElement('option', { key: language, value: language }, language)
              )
            )
          )
        ),
        React.createElement('div', { className: 'mt-6 flex space-x-4' },
          React.createElement('button', {
            onClick: () => handleGenerate(selectedGenerator.id),
            className: 'bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center'
          },
            React.createElement('ion-icon', { name: 'construct-outline', className: 'mr-2' }),
            'Generate Code'
          ),
          React.createElement('button', { className: 'border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center' },
            React.createElement('ion-icon', { name: 'eye-outline', className: 'mr-2' }),
            'Preview'
          )
        )
      )
    ),

    // Generation Statistics
    React.createElement('div', { className: 'bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white' },
      React.createElement('h2', { className: 'text-2xl font-bold mb-6' }, 'Generation Statistics'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '6'),
          React.createElement('p', { className: 'text-green-100' }, 'Generator Types')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '18'),
          React.createElement('p', { className: 'text-green-100' }, 'Templates')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '6'),
          React.createElement('p', { className: 'text-green-100' }, 'Languages')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '12'),
          React.createElement('p', { className: 'text-green-100' }, 'Frameworks')
        )
      )
    )
  );
};

window.GeneratorsPage = GeneratorsPage;

