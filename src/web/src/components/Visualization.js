const { useState, useEffect } = React;

// Progress Bar Component
const ProgressBar = ({ value, max, label, color = 'blue', showPercentage = true }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600'
  };

  return React.createElement('div', { className: 'space-y-2' },
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('span', { className: 'text-sm font-medium text-gray-700' }, label),
      showPercentage && React.createElement('span', { className: 'text-sm text-gray-500' }, `${Math.round(percentage)}%`)
    ),
    React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
      React.createElement('div', {
        className: `h-2 rounded-full transition-all duration-500 ${colorClasses[color]}`,
        style: { width: `${percentage}%` }
      })
    )
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, color, trend, description }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return React.createElement('div', { className: 'bg-white rounded-xl shadow-lg p-6 border border-gray-100' },
    React.createElement('div', { className: 'flex items-center justify-between mb-4' },
      React.createElement('div', { className: `w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}` },
        React.createElement('ion-icon', { name: icon, className: 'text-2xl' })
      ),
      trend && React.createElement('div', { className: `flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}` },
        React.createElement('ion-icon', { name: trend > 0 ? 'trending-up-outline' : 'trending-down-outline', className: 'mr-1' }),
        React.createElement('span', null, `${Math.abs(trend)}%`)
      )
    ),
    React.createElement('h3', { className: 'text-2xl font-bold text-gray-900 mb-1' }, value),
    React.createElement('p', { className: 'text-sm text-gray-600' }, title),
    description && React.createElement('p', { className: 'text-xs text-gray-500 mt-2' }, description)
  );
};

// Chart Component (Mock)
const Chart = ({ type, data, title, height = 200 }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return React.createElement('div', { className: 'bg-white rounded-xl shadow-lg p-6 border border-gray-100' },
    title && React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-4' }, title),
    React.createElement('div', { 
      className: `relative overflow-hidden rounded-lg ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`,
      style: { height: `${height}px` }
    },
      // Mock chart visualization
      React.createElement('div', { className: 'flex items-end justify-between h-full p-4 bg-gradient-to-t from-gray-50 to-white' },
        ...data.map((value, index) =>
          React.createElement('div', {
            key: index,
            className: 'bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg mx-1 transition-all duration-1000',
            style: { 
              height: `${(value / Math.max(...data)) * (height - 32)}px`,
              width: `${100 / data.length - 2}%`,
              animationDelay: `${index * 100}ms`
            }
          })
        )
      ),
      !isLoaded && React.createElement('div', { className: 'absolute inset-0 flex items-center justify-center' },
        React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' })
      )
    )
  );
};

// Donut Chart Component (Mock)
const DonutChart = ({ data, title, size = 200 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return React.createElement('div', { className: 'bg-white rounded-xl shadow-lg p-6 border border-gray-100' },
    title && React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-4 text-center' }, title),
    React.createElement('div', { className: 'flex items-center justify-center' },
      React.createElement('div', { className: 'relative', style: { width: `${size}px`, height: `${size}px` } },
        // SVG Donut Chart
        React.createElement('svg', {
          width: size,
          height: size,
          className: 'transform -rotate-90'
        },
          ...data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const circumference = 2 * Math.PI * (size / 2 - 10);
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -(cumulativePercentage / 100) * circumference;
            cumulativePercentage += percentage;

            return React.createElement('circle', {
              key: index,
              cx: size / 2,
              cy: size / 2,
              r: size / 2 - 10,
              fill: 'none',
              stroke: colors[index % colors.length],
              strokeWidth: 20,
              strokeDasharray,
              strokeDashoffset,
              className: 'transition-all duration-1000',
              style: { animationDelay: `${index * 200}ms` }
            });
          }),
          React.createElement('circle', {
            cx: size / 2,
            cy: size / 2,
            r: size / 2 - 30,
            fill: 'white'
          })
        ),
        React.createElement('div', { className: 'absolute inset-0 flex items-center justify-center' },
          React.createElement('div', { className: 'text-center' },
            React.createElement('div', { className: 'text-2xl font-bold text-gray-900' }, total),
            React.createElement('div', { className: 'text-sm text-gray-500' }, 'Total')
          )
        )
      )
    ),
    React.createElement('div', { className: 'mt-4 space-y-2' },
      ...data.map((item, index) =>
        React.createElement('div', { key: index, className: 'flex items-center justify-between text-sm' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('div', {
              className: 'w-3 h-3 rounded-full mr-2',
              style: { backgroundColor: colors[index % colors.length] }
            }),
            React.createElement('span', { className: 'text-gray-700' }, item.label)
          ),
          React.createElement('span', { className: 'font-semibold text-gray-900' }, item.value)
        )
      )
    )
  );
};

// Timeline Component
const Timeline = ({ events, title }) => {
  return React.createElement('div', { className: 'bg-white rounded-xl shadow-lg p-6 border border-gray-100' },
    title && React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-6' }, title),
    React.createElement('div', { className: 'space-y-4' },
      ...events.map((event, index) =>
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
  );
};

// Heatmap Component
const Heatmap = ({ data, title }) => {
  const maxValue = Math.max(...data.flat());
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeks = Array.from({ length: Math.ceil(data.length / 7) }, (_, i) => i);

  return React.createElement('div', { className: 'bg-white rounded-xl shadow-lg p-6 border border-gray-100' },
    title && React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-4' }, title),
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
        ...days.map(day =>
          React.createElement('div', { key: day, className: 'text-xs text-gray-500 text-center py-1' }, day)
        ),
        ...data.map((value, index) =>
          React.createElement('div', {
            key: index,
            className: 'w-3 h-3 rounded-sm transition-all duration-300 hover:scale-110',
            style: { 
              backgroundColor: value > 0 ? `rgba(59, 130, 246, ${value / maxValue})` : '#f3f4f6'
            },
            title: `Value: ${value}`
          })
        )
      )
    )
  );
};

// Export components
window.ProgressBar = ProgressBar;
window.MetricCard = MetricCard;
window.Chart = Chart;
window.DonutChart = DonutChart;
window.Timeline = Timeline;
window.Heatmap = Heatmap;

