const { useState, useEffect, useCallback, useMemo } = React;

const AIPage = () => {
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryType, setQueryType] = useState('analysis');
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const response = await fetch('/api/ai/capabilities');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCapabilities(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching AI capabilities:', error);
        setError('Failed to load AI capabilities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCapabilities();
  }, []);

  const aiTypes = useMemo(() => [
    {
      id: 'analysis',
      name: 'Code Analysis',
      icon: 'search-outline',
      description: 'Analyze code patterns, complexity, and quality',
      examples: [
        'What are the most complex functions in this file?',
        'How can I improve the performance of this component?',
        'Are there any security vulnerabilities in this code?'
      ]
    },
    {
      id: 'suggestion',
      name: 'Smart Suggestions',
      icon: 'bulb-outline',
      description: 'Get intelligent recommendations for improvements',
      examples: [
        'Suggest ways to reduce code duplication',
        'How can I make this function more readable?',
        'What design patterns should I use here?'
      ]
    },
    {
      id: 'explanation',
      name: 'Code Explanation',
      icon: 'book-outline',
      description: 'Understand complex code and algorithms',
      examples: [
        'Explain how this sorting algorithm works',
        'What does this regex pattern do?',
        'Break down this complex function for me'
      ]
    },
    {
      id: 'refactor',
      name: 'Refactoring',
      icon: 'construct-outline',
      description: 'Get suggestions for code refactoring',
      examples: [
        'How can I refactor this into smaller functions?',
        'Suggest a better architecture for this module',
        'Convert this class component to hooks'
      ]
    }
  ], []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    const userMessage = { type: 'user', content: query, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    
    setIsProcessing(true);
    setQuery('');
    setError(null);

    try {
      // Simulate AI response based on query type
      await new Promise(resolve => setTimeout(resolve, 2000));
      const responses = {
        analysis: `**Analysis Results for: "${query}"**

🔍 **Code Quality Assessment:**
- Complexity Score: 3.2/10 (Good)
- Maintainability: 85%
- Performance: Optimized
- Security: No vulnerabilities detected

📊 **Key Findings:**
- Function is well-structured with clear naming
- Consider extracting helper functions for better readability
- Memory usage is within acceptable limits

💡 **Recommendations:**
1. Add input validation for edge cases
2. Consider memoization for expensive calculations
3. Add comprehensive error handling`,
        
        suggestion: `**Smart Suggestions for: "${query}"**

🚀 **Performance Optimizations:**
- Use React.memo() to prevent unnecessary re-renders
- Implement virtual scrolling for large lists
- Consider code splitting for better bundle size

🏗️ **Architecture Improvements:**
- Extract custom hooks for reusable logic
- Implement proper state management with Context API
- Add TypeScript for better type safety

🔧 **Code Quality:**
- Use consistent naming conventions
- Add JSDoc comments for better documentation
- Implement proper error boundaries`,
        
        explanation: `**Code Explanation for: "${query}"**

📚 **How it works:**
This function implements a binary search algorithm to efficiently find elements in a sorted array.

🔍 **Step-by-step breakdown:**
1. **Initialization**: Sets left and right pointers to array boundaries
2. **Loop**: Continues while left ≤ right
3. **Midpoint**: Calculates middle index using integer division
4. **Comparison**: Compares target with middle element
5. **Adjustment**: Moves pointers based on comparison result

⚡ **Time Complexity**: O(log n) - Much faster than linear search
💾 **Space Complexity**: O(1) - Constant extra space

🎯 **Use Cases:**
- Searching in sorted arrays
- Finding insertion points
- Implementing auto-complete features`,
        
        refactor: `**Refactoring Suggestions for: "${query}"**

🔄 **Current Issues:**
- Function is too long (85 lines)
- Multiple responsibilities
- Hard to test individual parts

✨ **Proposed Refactoring:**

\`\`\`javascript
// 1. Extract data processing
const processUserData = (data) => { /* ... */ };

// 2. Extract validation logic
const validateInput = (input) => { /* ... */ };

// 3. Main function becomes orchestrator
const handleUserRegistration = async (userData) => {
  const validated = validateInput(userData);
  const processed = processUserData(validated);
  return await saveUser(processed);
};
\`\`\`

📈 **Benefits:**
- Better testability
- Improved readability
- Easier maintenance
- Single responsibility principle`
      };

      const aiResponse = {
        type: 'ai',
        content: responses[queryType] || responses.analysis,
        timestamp: new Date(),
        confidence: 0.92
      };
      
      setChatHistory(prev => [...prev, aiResponse]);
      setResponse(aiResponse.content);
    } catch (error) {
      console.error('Error processing AI request:', error);
      setError('Failed to process your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [query, queryType, isProcessing]);

  const exampleQueries = useMemo(() => [
    'How can I optimize this React component for better performance?',
    'Explain the time complexity of this sorting algorithm',
    'Suggest improvements for this function\'s readability',
    'What are potential security issues in this authentication code?',
    'How can I refactor this large component into smaller pieces?'
  ], []);

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center py-12' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }),
      React.createElement('span', { className: 'ml-3 text-gray-600' }, 'Loading AI capabilities...')
    );
  }

  if (error) {
    return React.createElement('div', { className: 'flex items-center justify-center py-12' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'text-red-600 text-lg font-semibold mb-2' }, 'Error'),
        React.createElement('p', { className: 'text-gray-600 mb-4' }, error),
        React.createElement('button', {
          onClick: () => window.location.reload(),
          className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
        }, 'Retry')
      )
    );
  }

  return React.createElement('div', { className: 'space-y-8' },
    // Header
    React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-6' },
      React.createElement('h1', { className: 'text-2xl font-semibold text-gray-900 mb-2' }, 'AI Assistant'),
      React.createElement('p', { className: 'text-gray-600' }, 
        'Intelligent code analysis, suggestions, explanations, and refactoring powered by advanced AI models.'
      )
    ),

    // AI Capabilities Overview
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' },
      ...aiTypes.map((type) =>
        React.createElement('div', { 
          key: type.id,
          className: `bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer ${queryType === type.id ? 'border-gray-400 bg-gray-50' : ''}`,
          onClick: () => setQueryType(type.id)
        },
          React.createElement('div', { className: 'w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3' },
            React.createElement('ion-icon', { name: type.icon, className: 'text-lg text-gray-600' })
          ),
          React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-2' }, type.name),
          React.createElement('p', { className: 'text-gray-600 text-sm mb-4' }, type.description),
          React.createElement('div', { className: 'space-y-2' },
            ...type.examples.slice(0, 2).map((example, index) =>
              React.createElement('div', { key: index, className: 'text-xs text-gray-500 bg-gray-50 p-2 rounded' }, example)
            )
          )
        )
      )
    ),

    // Chat Interface
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-8' },
      // Chat Input
      React.createElement('div', { className: 'lg:col-span-2' },
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg p-6 border border-gray-100' },
          React.createElement('h2', { className: 'text-xl font-bold text-gray-900 mb-4' }, 'Ask AI'),
          
          React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
            React.createElement('div', null,
              React.createElement('label', { htmlFor: 'query', className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                `${aiTypes.find(t => t.id === queryType)?.name} Query`
              ),
              React.createElement('textarea', {
                id: 'query',
                value: query,
                onChange: (e) => setQuery(e.target.value),
                placeholder: `Ask about ${aiTypes.find(t => t.id === queryType)?.name.toLowerCase()}...`,
                className: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none',
                rows: 4
              })
            ),
            
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('div', { className: 'flex space-x-2' },
                ...aiTypes.map((type) =>
                  React.createElement('button', {
                    key: type.id,
                    type: 'button',
                    onClick: () => setQueryType(type.id),
                    className: `px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                      queryType === type.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`
                  }, type.name)
                )
              ),
              React.createElement('button', {
                type: 'submit',
                disabled: isProcessing || !query.trim(),
                className: 'bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center'
              }, isProcessing ? 
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement('div', { className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' }),
                  'Processing...'
                ) : 
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement('ion-icon', { name: 'send-outline', className: 'mr-2' }),
                  'Ask AI'
                )
              )
            )
          )
        )
      ),

      // Sidebar
      React.createElement('div', { className: 'space-y-6' },
        // Example Queries
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg p-6 border border-gray-100' },
          React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-4' }, 'Example Queries'),
          React.createElement('div', { className: 'space-y-3' },
            ...exampleQueries.map((example, index) =>
              React.createElement('button', {
                key: index,
                onClick: () => setQuery(example),
                className: 'w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm text-gray-700'
              }, example)
            )
          )
        ),

        // AI Stats
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg p-6 border border-gray-100' },
          React.createElement('h3', { className: 'text-lg font-bold text-gray-900 mb-4' }, 'AI Statistics'),
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-600' }, 'Models Available'),
              React.createElement('span', { className: 'font-semibold text-gray-900' }, '4')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-600' }, 'Average Response Time'),
              React.createElement('span', { className: 'font-semibold text-gray-900' }, '1.2s')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-600' }, 'Accuracy'),
              React.createElement('span', { className: 'font-semibold text-green-600' }, '94%')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-600' }, 'Queries Today'),
              React.createElement('span', { className: 'font-semibold text-gray-900' }, '127')
            )
          )
        )
      )
    ),

    // Chat History
    chatHistory.length > 0 && React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg p-6 border border-gray-100' },
      React.createElement('h2', { className: 'text-xl font-bold text-gray-900 mb-6' }, 'Conversation History'),
      React.createElement('div', { className: 'space-y-4 max-h-96 overflow-y-auto' },
        ...chatHistory.map((message, index) =>
          React.createElement('div', { 
            key: index, 
            className: `flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}` 
          },
            React.createElement('div', { 
              className: `max-w-3xl p-4 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }` 
            },
              React.createElement('div', { className: 'flex items-start' },
                React.createElement('div', { className: `w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  message.type === 'user' ? 'bg-blue-700' : 'bg-blue-100'
                }` },
                  React.createElement('ion-icon', { 
                    name: message.type === 'user' ? 'person-outline' : 'chatbubbles-outline',
                    className: `text-sm ${message.type === 'user' ? 'text-white' : 'text-blue-600'}`
                  })
                ),
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('div', { className: 'whitespace-pre-wrap text-sm' }, message.content),
                  React.createElement('div', { className: `text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }` }, 
                    message.timestamp.toLocaleTimeString()
                  )
                )
              )
            )
          )
        )
      )
    ),

    // AI Capabilities Details
    capabilities && React.createElement('div', { className: 'bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white' },
      React.createElement('h2', { className: 'text-2xl font-bold mb-6' }, 'AI Capabilities'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '4'),
          React.createElement('p', { className: 'text-purple-100' }, 'AI Types')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '94%'),
          React.createElement('p', { className: 'text-purple-100' }, 'Accuracy')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '1.2s'),
          React.createElement('p', { className: 'text-purple-100' }, 'Avg Response')
        ),
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl font-bold mb-2' }, '24/7'),
          React.createElement('p', { className: 'text-purple-100' }, 'Availability')
        )
      )
    )
  );
};

window.AIPage = AIPage;