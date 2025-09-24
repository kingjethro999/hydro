const { useState, useEffect } = React;

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetch('/api/analysis/status')
      .then(response => response.json())
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching analytics:', error);
        setLoading(false);
      });
  }, []);

  const timeRanges = [
    { value: '1d', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  // Mock data for visualizations
  const complexityTrend = [3.2, 3.1, 3.4, 3.0, 3.3, 3.2, 3.1];
  const coverageData = [78.5, 79.2, 77.8, 80.1, 79.5, 78.9, 79.3];
  const fileTypes = [
    { label: 'TypeScript', value: 45 },
    { label: 'JavaScript', value: 32 },
    { label: 'CSS', value: 15 },
    { label: 'JSON', value: 8 }
  ];
  const activityHeatmap = [
    [2, 5, 3, 1, 4, 2, 0],
    [1, 3, 4, 2, 3, 1, 2],
    [4, 2, 1, 5, 2, 4, 3],
    [3, 4, 2, 1, 5, 3, 1],
    [2, 1, 5, 3, 2, 4, 2],
    [1, 3, 2, 4, 1, 3, 0],
    [0, 2, 1, 2, 3, 1, 2]
  ];
  const recentEvents = [
    {
      title: 'Security scan completed',
      description: 'Found 2 vulnerabilities, 1 high priority',
      time: '2 minutes ago',
      icon: 'shield-checkmark-outline'
    },
    {
      title: 'Complexity analysis updated',
      description: 'Average complexity improved by 0.1 points',
      time: '15 minutes ago',
      icon: 'analytics-outline'
    },
    {
      title: 'New plugin installed',
      description: 'Performance Analyzer v2.1.0 activated',
      time: '1 hour ago',
      icon: 'extension-puzzle-outline'
    },
    {
      title: 'Code generation completed',
      description: 'Generated 5 React components with tests',
      time: '2 hours ago',
      icon: 'construct-outline'
    }
  ];

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center py-12' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }),
      React.createElement('span', { className: 'ml-3 text-gray-600' }, 'Loading analytics...')
    );
  }

  return React.createElement('div', { className: 'space-y-8' },
    // Header
    React.createElement('div', { className: 'flex items-center justify-between' },
      React.createElement('div', null,
        React.createElement('h1', { className: 'text-4xl font-bold text-gray-900 mb-4 flex items-center' },
          React.createElement('ion-icon', { name: 'analytics-outline', className: 'mr-4 text-blue-600' }),
          'Analytics Dashboard'
        ),
        React.createElement('p', { className: 'text-xl text-gray-600' }, 'Comprehensive insights into your project\'s development metrics and trends.')
      ),
      React.createElement('div', { className: 'flex space-x-2' },
        ...timeRanges.map((range) =>
          React.createElement('button', {
            key: range.value,
            onClick: () => setTimeRange(range.value),
            className: `px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
              timeRange === range.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`
          }, range.label)
        )
      )
    ),

    // Key Metrics
    analytics && React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' },
      React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-6 border border-gray-100' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center' },
            React.createElement('ion-icon', { name: 'folder-outline', className: 'text-2xl text-blue-600' })
          ),
          React.createElement('div', { className: 'ml-4' },
            React.createElement('p', { className: 'text-sm font-medium text-gray-600' }, 'Total Files'),
            React.createElement('p', { className: 'text-2xl font-bold text-gray-900' }, analytics.metrics.totalFiles)
          )
        ),
        React.createElement('div', { className: 'mt-4' },
          React.createElement('div', { className: 'flex items-center text-sm text-green-600' },
            React.createElement('ion-icon', { name: 'trending-up-outline', className: 'mr-1' }),
            React.createElement('span', null, '+12% from last week')
          )
        )
      ),
      React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-6 border border-gray-100' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center' },
            React.createElement('ion-icon', { name: 'document-text-outline', className: 'text-2xl text-green-600' })
          ),
          React.createElement('div', { className: 'ml-4' },
            React.createElement('p', { className: 'text-sm font-medium text-gray-600' }, 'Lines of Code'),
            React.createElement('p', { className: 'text-2xl font-bold text-gray-900' }, analytics.metrics.totalLines.toLocaleString())
          )
        ),
        React.createElement('div', { className: 'mt-4' },
          React.createElement('div', { className: 'flex items-center text-sm text-green-600' },
            React.createElement('ion-icon', { name: 'trending-up-outline', className: 'mr-1' }),
            React.createElement('span', null, '+8% from last week')
          )
        )
      ),
      React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-6 border border-gray-100' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center' },
            React.createElement('ion-icon', { name: 'git-branch-outline', className: 'text-2xl text-purple-600' })
          ),
          React.createElement('div', { className: 'ml-4' },
            React.createElement('p', { className: 'text-sm font-medium text-gray-600' }, 'Complexity Score'),
            React.createElement('p', { className: 'text-2xl font-bold text-gray-900' }, analytics.metrics.complexityScore)
          )
        ),
        React.createElement('div', { className: 'mt-4' },
          React.createElement('div', { className: 'flex items-center text-sm text-red-600' },
            React.createElement('ion-icon', { name: 'trending-down-outline', className: 'mr-1' }),
            React.createElement('span', null, '-0.1 from last week')
          )
        )
      ),
      React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-6 border border-gray-100' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center' },
            React.createElement('ion-icon', { name: 'checkmark-circle-outline', className: 'text-2xl text-orange-600' })
          ),
          React.createElement('div', { className: 'ml-4' },
            React.createElement('p', { className: 'text-sm font-medium text-gray-600' }, 'Test Coverage'),
            React.createElement('p', { className: 'text-2xl font-bold text-gray-900' }, `${analytics.metrics.testCoverage}%`)
          )
        ),
        React.createElement('div', { className: 'mt-4' },
          React.createElement('div', { className: 'flex items-center text-sm text-green-600' },
            React.createElement('ion-icon', { name: 'trending-up-outline', className: 'mr-1' }),
            React.createElement('span', null, '+2% from last week')
          )
        )
      )
    ),

    // Charts Section
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-8' },
      // Complexity Trend Chart
      React.createElement('div', null,
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-6 border border-gray-100' },
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-6' }, 'Complexity Trend'),
          React.createElement('div', { className: 'h-64 flex items-end justify-between' },
            ...complexityTrend.map((value, index) =>
              React.createElement('div', {
                key: index,
                className: 'bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg mx-1 transition-all duration-1000 hover:from-blue-600 hover:to-blue-400',
                style: { 
                  height: `${(value / 5) * 200}px`,
                  width: `${100 / complexityTrend.length - 2}%`,
                  animationDelay: `${index * 100}ms`
                },
                title: `Day ${index + 1}: ${value}`
              })
            )
          ),
          React.createElement('div', { className: 'flex justify-between text-xs text-gray-500 mt-2' },
            ...Array.from({ length: complexityTrend.length }, (_, i) =>
              React.createElement('span', { key: i }, `D${i + 1}`)
            )
          )
        )
      ),

      // File Types Distribution
      React.createElement('div', null,
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-6 border border-gray-100' },
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-6' }, 'File Types Distribution'),
          React.createElement('div', { className: 'space-y-4' },
            ...fileTypes.map((type, index) =>
              React.createElement('div', { key: index, className: 'space-y-2' },
                React.createElement('div', { className: 'flex justify-between items-center' },
                  React.createElement('span', { className: 'text-sm font-medium text-gray-700' }, type.label),
                  React.createElement('span', { className: 'text-sm text-gray-500' }, `${type.value}%`)
                ),
                React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                  React.createElement('div', {
                    className: `h-2 rounded-full transition-all duration-1000 ${
                      index === 0 ? 'bg-blue-600' :
                      index === 1 ? 'bg-green-600' :
                      index === 2 ? 'bg-yellow-600' : 'bg-purple-600'
                    }`,
                    style: { width: `${type.value}%`, animationDelay: `${index * 200}ms` }
                  })
                )
              )
            )
          )
        )
      )
    ),

    // Activity Heatmap and Recent Events
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-8' },
      // Activity Heatmap
      React.createElement('div', null,
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-6 border border-gray-100' },
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Development Activity'),
          React.createElement('div', { className: 'space-y-2' },
            React.createElement('div', { className: 'flex justify-between text-xs text-gray-500 mb-2' },
              React.createElement('span', null, 'Less'),
              React.createElement('div', { className: 'flex space-x-1' },
                ...Array.from({ length: 5 }, (_, i) =>
                  React.createElement('div', {
                    key: i,
                    className: 'w-3 h-3 rounded-sm',
                    style: { backgroundColor: `rgba(59, 130, 246, ${0.2 + i * 0.2})` }
                  })
                )
              ),
              React.createElement('span', null, 'More')
            ),
            React.createElement('div', { className: 'grid grid-cols-7 gap-1' },
              ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day =>
                React.createElement('div', { key: day, className: 'text-xs text-gray-500 text-center py-1' }, day)
              ),
              ...activityHeatmap.flat().map((value, index) =>
                React.createElement('div', {
                  key: index,
                  className: 'w-3 h-3 rounded-sm transition-all duration-300 hover:scale-110',
                  style: { 
                    backgroundColor: value > 0 ? `rgba(59, 130, 246, ${value / 5})` : '#f3f4f6'
                  },
                  title: `Activity: ${value}`
                })
              )
            )
          )
        )
      ),

      // Recent Events Timeline
      React.createElement('div', null,
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-6 border border-gray-100' },
          React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-6' }, 'Recent Activity'),
          React.createElement('div', { className: 'space-y-4' },
            ...recentEvents.map((event, index) =>
              React.createElement('div', { key: index, className: 'flex items-start' },
                React.createElement('div', { className: 'flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4' },
                  React.createElement('ion-icon', { name: event.icon, className: 'text-blue-600 text-sm' })
                ),
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('h4', { className: 'font-semibold text-gray-900' }, event.title),
                  React.createElement('p', { className: 'text-gray-600 text-sm' }, event.description),
                  React.createElement('span', { className: 'text-xs text-gray-500' }, event.time)
                )
              )
            )
          )
        )
      )
    ),

    // Analyzer Status Grid
    analytics && React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-6 border border-gray-100' },
      React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-6' }, 'Analyzer Performance'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
        ...Object.entries(analytics.analyzers).map(([name, config]) =>
          React.createElement('div', { key: name, className: 'border border-gray-200 rounded-xl p-4' },
            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
              React.createElement('h3', { className: 'font-semibold text-gray-900 capitalize' }, name),
              React.createElement('span', { className: `px-2 py-1 rounded-full text-xs font-semibold ${
                config.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }` }, config.enabled ? 'Active' : 'Inactive')
            ),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', { className: 'flex justify-between text-sm' },
                React.createElement('span', { className: 'text-gray-600' }, 'Last Run'),
                React.createElement('span', { className: 'text-gray-900' }, new Date(config.lastRun).toLocaleDateString())
              ),
              React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                React.createElement('div', {
                  className: 'h-2 bg-blue-600 rounded-full transition-all duration-500',
                  style: { width: config.enabled ? '100%' : '0%' }
                })
              )
            )
          )
        )
      )
    ),

    // Summary Statistics
    React.createElement('div', { className: 'bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white' },
      React.createElement('h2', { className: 'text-2xl font-bold mb-6' }, 'Project Health Summary'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '85%'),
          React.createElement('p', { className: 'text-blue-100' }, 'Code Quality')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '78%'),
          React.createElement('p', { className: 'text-blue-100' }, 'Test Coverage')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '2'),
          React.createElement('p', { className: 'text-blue-100' }, 'Security Issues')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '0'),
          React.createElement('p', { className: 'text-blue-100' }, 'Circular Dependencies')
        )
      )
    )
  );
};

window.AnalyticsPage = AnalyticsPage;