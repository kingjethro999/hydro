const { useState, useEffect } = React;
const { createRoot } = ReactDOM;

// Custom Router Component
const Router = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return children({ currentPath, navigate });
};

// Navigation Component
const Navigation = ({ currentPath, navigate }) => {
  const navItems = [
    { path: '/', label: 'Home', icon: 'home-outline' },
    { path: '/analyzers', label: 'Analyzers', icon: 'analytics-outline' },
    { path: '/generators', label: 'Generators', icon: 'construct-outline' },
    { path: '/ai', label: 'AI', icon: 'chatbubbles-outline' },
    { path: '/plugins', label: 'Plugins', icon: 'extension-puzzle-outline' },
    { path: '/commands', label: 'Commands', icon: 'terminal-outline' },
    { path: '/api', label: 'API', icon: 'code-slash-outline' },
    { path: '/docs', label: 'Docs', icon: 'document-text-outline' },
    { path: '/analytics', label: 'Analytics', icon: 'bar-chart-outline' }
  ];

  return React.createElement('nav', { className: 'bg-white border-b border-gray-200 shadow-sm' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-6' },
      React.createElement('div', { className: 'flex justify-between items-center h-16' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('div', { className: 'w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center mr-3' },
              React.createElement('ion-icon', { name: 'water-outline', className: 'text-lg text-white' })
            ),
            React.createElement('h1', { className: 'text-xl font-semibold text-gray-900' }, 'Hydro')
          ),
          React.createElement('div', { className: 'hidden md:ml-10 md:flex md:space-x-8' },
            ...navItems.map((item) => {
              const isActive = currentPath === item.path;
              return React.createElement('button', {
                key: item.path,
                onClick: () => navigate(item.path),
                className: `inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                }`
              },
                React.createElement('ion-icon', { name: item.icon, className: 'mr-2 text-base' }),
                item.label
              );
            })
          )
        ),
        React.createElement('div', { className: 'flex items-center space-x-4' },
          React.createElement('div', { className: 'hidden md:flex items-center space-x-2 text-sm text-gray-500' },
            React.createElement('div', { className: 'w-2 h-2 bg-green-500 rounded-full' }),
            React.createElement('span', null, 'Online')
          ),
          React.createElement('button', {
            className: 'md:hidden p-2 text-gray-500 hover:text-gray-700',
            onClick: () => console.log('Toggle mobile menu')
          },
            React.createElement('ion-icon', { name: 'menu-outline', className: 'text-lg' })
          )
        )
      )
    ),
    
    // Mobile menu
    React.createElement('div', { className: 'md:hidden bg-white border-t border-gray-200' },
      React.createElement('div', { className: 'px-4 py-2 space-y-1' },
        ...navItems.map((item) => {
          const isActive = currentPath === item.path;
          return React.createElement('button', {
            key: item.path,
            onClick: () => navigate(item.path),
            className: `flex items-center w-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${
              isActive
                ? 'text-gray-900 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`
          },
            React.createElement('ion-icon', { name: item.icon, className: 'mr-2 text-base' }),
            item.label
          );
        })
      )
    )
  );
};

// Page Loader Component
const PageLoader = ({ path }) => {
  switch (path) {
    case '/':
      return React.createElement(window.HomePage || (() => React.createElement('div', { className: 'text-center py-12' }, 'Loading Home...')));
    case '/analyzers':
      return React.createElement(window.AnalyzersPage || (() => React.createElement('div', { className: 'text-center py-12' }, 'Loading Analyzers...')));
    case '/generators':
      return React.createElement(window.GeneratorsPage || (() => React.createElement('div', { className: 'text-center py-12' }, 'Loading Generators...')));
    case '/ai':
      return React.createElement(window.AIPage || (() => React.createElement('div', { className: 'text-center py-12' }, 'Loading AI...')));
    case '/plugins':
      return React.createElement(window.PluginsPage || (() => React.createElement('div', { className: 'text-center py-12' }, 'Loading Plugins...')));
    case '/commands':
      return React.createElement(window.CommandsPage || (() => React.createElement('div', { className: 'text-center py-12' }, 'Loading Commands...')));
    case '/api':
      return React.createElement(window.APIPage || (() => React.createElement('div', { className: 'text-center py-12' }, 'Loading API...')));
    case '/docs':
      return React.createElement(window.DocsPage || (() => React.createElement('div', { className: 'text-center py-12' }, 'Loading Docs...')));
    case '/analytics':
      return React.createElement(window.AnalyticsPage || (() => React.createElement('div', { className: 'text-center py-12' }, 'Loading Analytics...')));
    default:
      return React.createElement('div', { className: 'text-center py-16' },
        React.createElement('div', { className: 'max-w-md mx-auto' },
          React.createElement('div', { className: 'w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center' },
            React.createElement('ion-icon', { name: 'alert-circle-outline', className: 'text-4xl text-gray-400' })
          ),
          React.createElement('h1', { className: 'text-4xl font-bold text-gray-800 mb-4' }, '404 - Page Not Found'),
          React.createElement('p', { className: 'text-gray-600 mb-8' }, 'The page you are looking for does not exist.'),
          React.createElement('button', {
            className: 'px-6 py-3 bg-hydro-blue text-white font-semibold rounded-lg shadow-md hover:bg-hydro-purple transition duration-300',
            onClick: () => window.history.pushState({}, '', '/'),
          }, 'Go to Home')
        )
      );
  }
};

// Main App Component
const App = () => {
  return React.createElement(Router, null, ({ currentPath, navigate }) =>
    React.createElement('div', { className: 'min-h-screen bg-gray-50' },
      React.createElement(Navigation, { currentPath: currentPath, navigate: navigate }),
      React.createElement('main', { className: 'max-w-7xl mx-auto py-4 px-6' },
        React.createElement(PageLoader, { path: currentPath })
      )
    )
  );
};

// Initialize the app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(App));
