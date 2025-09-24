const { useState, useEffect } = React;

const APIPage = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);

  useEffect(() => {
    const mockEndpoints = [
      {
        method: 'GET',
        path: '/api/health',
        description: 'Get server health status',
        response: { status: 'ok', message: 'Hydro Web Server is running', version: '1.0.0' }
      },
      {
        method: 'GET',
        path: '/api/plugins',
        description: 'Get available plugins',
        response: { plugins: [] }
      },
      {
        method: 'GET',
        path: '/api/commands',
        description: 'Get available CLI commands',
        response: { commands: [] }
      }
    ];
    setEndpoints(mockEndpoints);
    setLoading(false);
  }, []);

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const testEndpoint = async (endpoint) => {
    try {
      const response = await fetch(endpoint.path);
      const data = await response.json();
      setSelectedEndpoint({ ...endpoint, actualResponse: data });
    } catch (error) {
      setSelectedEndpoint({ ...endpoint, error: error.message });
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center py-12' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }),
      React.createElement('span', { className: 'ml-3 text-gray-600' }, 'Loading API endpoints...')
    );
  }

  return React.createElement('div', { className: 'space-y-8' },
    // Header
    React.createElement('div', null,
      React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 mb-4 flex items-center' },
        React.createElement('ion-icon', { name: 'code-slash-outline', className: 'mr-3 text-blue-600' }),
        'API Reference'
      ),
      React.createElement('p', { className: 'text-gray-600 text-lg' }, 'Explore and test the Hydro API endpoints. All endpoints return JSON responses.')
    ),
    
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-8' },
      // Endpoints List
      React.createElement('div', { className: 'space-y-4' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Available Endpoints'),
        ...endpoints.map((endpoint, index) =>
          React.createElement('div', { key: index, className: 'bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200' },
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
              React.createElement('div', { className: 'flex items-center space-x-3' },
                React.createElement('span', { className: `px-3 py-1 rounded-lg text-sm font-semibold border ${getMethodColor(endpoint.method)}` }, endpoint.method),
                React.createElement('code', { className: 'text-sm font-mono bg-gray-100 px-3 py-1 rounded-lg' }, endpoint.path)
              ),
              React.createElement('button', {
                onClick: () => testEndpoint(endpoint),
                className: 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center'
              },
                React.createElement('ion-icon', { name: 'play-outline', className: 'mr-1' }),
                'Test'
              )
            ),
            React.createElement('p', { className: 'text-gray-600' }, endpoint.description)
          )
        )
      ),
      
      // Response Viewer
      React.createElement('div', null,
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Response'),
        selectedEndpoint ? 
          React.createElement('div', { className: 'bg-white rounded-xl shadow-lg p-6 border border-gray-100' },
            React.createElement('div', { className: 'flex items-center mb-4 space-x-3' },
              React.createElement('span', { className: `px-3 py-1 rounded-lg text-sm font-semibold border ${getMethodColor(selectedEndpoint.method)}` }, selectedEndpoint.method),
              React.createElement('code', { className: 'text-sm font-mono bg-gray-100 px-3 py-1 rounded-lg' }, selectedEndpoint.path)
            ),
            selectedEndpoint.error ? 
              React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded-xl p-4' },
                React.createElement('div', { className: 'flex items-center mb-2' },
                  React.createElement('ion-icon', { name: 'alert-circle-outline', className: 'text-red-600 mr-2' }),
                  React.createElement('h3', { className: 'text-red-800 font-semibold' }, 'Error')
                ),
                React.createElement('p', { className: 'text-red-600' }, selectedEndpoint.error)
              ) :
              React.createElement('div', null,
                React.createElement('div', { className: 'flex items-center mb-3' },
                  React.createElement('ion-icon', { name: 'checkmark-circle-outline', className: 'text-green-600 mr-2' }),
                  React.createElement('h3', { className: 'font-semibold text-gray-900' }, 'Response Body')
                ),
                React.createElement('pre', { className: 'bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto border' },
                  JSON.stringify(selectedEndpoint.actualResponse || selectedEndpoint.response, null, 2)
                )
              )
          ) :
          React.createElement('div', { className: 'bg-gray-50 rounded-xl p-12 text-center' },
            React.createElement('ion-icon', { name: 'code-slash-outline', className: 'text-6xl text-gray-400 mb-4' }),
            React.createElement('p', { className: 'text-gray-600 text-lg' }, 'Select an endpoint to test and view its response')
          )
      )
    )
  );
};

// Export as default for dynamic import
window.APIPage = APIPage;