/**
 * Hydro Web Server - SPA Server
 * Serves the Hydro web interface as a Single Page Application
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Hydro Web Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/plugins', (req, res) => {
  res.json({
    plugins: [
      {
        id: 'performance-analyzer',
        name: 'Performance Analyzer',
        version: '1.0.0',
        description: 'Detects performance bottlenecks and optimization opportunities',
        author: 'Hydro Team',
        downloads: 1200,
        rating: 4.8,
        type: 'analyzer'
      },
      {
        id: 'accessibility-analyzer',
        name: 'Accessibility Analyzer',
        version: '1.0.0',
        description: 'Ensures WCAG compliance and accessibility standards',
        author: 'Hydro Team',
        downloads: 856,
        rating: 4.9,
        type: 'analyzer'
      },
      {
        id: 'custom-command',
        name: 'Custom Commands',
        version: '1.0.0',
        description: 'Additional utility commands for project insights',
        author: 'Hydro Team',
        downloads: 2100,
        rating: 4.7,
        type: 'command'
      }
    ]
  });
});

app.get('/api/commands', (req, res) => {
  res.json({
    commands: [
      {
        name: 'hydro init',
        description: 'Initialize Hydro configuration',
        category: 'setup',
        examples: [
          'hydro init',
          'hydro init --template advanced',
          'hydro init --force'
        ]
      },
      {
        name: 'hydro scan',
        description: 'Scan project files and generate analysis',
        category: 'analysis',
        examples: [
          'hydro scan',
          'hydro scan --full',
          'hydro scan --path src'
        ]
      },
      {
        name: 'hydro analyze',
        description: 'Run specific analysis operations',
        category: 'analysis',
        examples: [
          'hydro analyze --complexity',
          'hydro analyze --cycles',
          'hydro analyze --all'
        ]
      },
      {
        name: 'hydro ai',
        description: 'AI-powered code analysis and suggestions',
        category: 'ai',
        examples: [
          'hydro ai "How can I improve this function?"',
          'hydro ai --suggest',
          'hydro ai --explain src/utils/helpers.ts'
        ]
      },
      {
        name: 'hydro plugin',
        description: 'Manage and install plugins',
        category: 'plugins',
        examples: [
          'hydro plugin list',
          'hydro plugin install performance-analyzer',
          'hydro plugin remove old-plugin'
        ]
      },
      {
        name: 'hydro codemap',
        description: 'Generate visual code maps and dependency graphs',
        category: 'visualization',
        examples: [
          'hydro codemap --type dependencies',
          'hydro codemap --type complexity',
          'hydro codemap --output-format html'
        ]
      }
    ]
  });
});

// Serve the SPA for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Hydro Web Server running on http://localhost:${PORT}`);
  console.log(`📖 Documentation available at http://localhost:${PORT}/docs`);
  console.log(`🔌 Plugin marketplace at http://localhost:${PORT}/plugins`);
  console.log(`⚡ Commands reference at http://localhost:${PORT}/commands`);
  console.log(`🤖 AI Assistant at http://localhost:${PORT}/ai`);
  console.log(`📊 Analytics at http://localhost:${PORT}/analytics`);
  console.log(`\nPress Ctrl+C to stop the server`);
});

export default app;
