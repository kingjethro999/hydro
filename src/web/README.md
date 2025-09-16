# Hydro Web Interface

A modern Single Page Application (SPA) for the Hydro CLI tool, providing an interactive web interface for code analysis, plugin management, and AI-powered insights.

## Features

- **Single Page Application** with client-side routing
- **Interactive Command Demos** with live terminal simulations
- **Plugin Marketplace** for discovering and installing plugins
- **AI Assistant Interface** for code analysis and suggestions
- **Analytics Dashboard** for project insights
- **Responsive Design** that works on all devices

## Quick Start

### Start the Web Server

```bash
# From the project root
hydro web

# Or with custom options
hydro web --port 3000 --host localhost --open
```

### Direct Server Start

```bash
# Navigate to web directory
cd src/web

# Install dependencies
npm install

# Start the server
npm start
```

## Pages

- **Home** (`/`) - Landing page with hero section and features overview
- **Features** (`/features`) - Detailed feature descriptions
- **Plugins** (`/plugins`) - Plugin marketplace and management
- **Commands** (`/commands`) - Interactive command reference with examples
- **Versions** (`/versions`) - Version information and changelog

## API Endpoints

- `GET /api/health` - Server health check
- `GET /api/commands` - Available CLI commands
- `GET /api/plugins` - Available plugins

## Development

> **Note**: The web folder has been cleaned up. Old unused files have been moved to the `ignore/` folder for reference. The current implementation uses a clean SPA structure with Express server and client-side routing.

### Project Structure

```
src/web/
├── public/           # Static assets served by Express
│   ├── index.html    # Main HTML template
│   ├── app.js        # SPA application logic
│   ├── styles.css    # Application styles
│   └── favicon.svg   # Favicon
├── ignore/           # Unused files (old implementation)
│   ├── index.html    # Old HTML file
│   ├── index.js      # Old JavaScript file
│   ├── page_routing.js # Old routing implementation
│   └── README.md     # Explanation of ignored files
├── server.js         # Express server
├── start.js          # Server entry point
├── package.json      # Dependencies and scripts
└── README.md         # This documentation
```

### Adding New Pages

1. Add route to `routes` object in `app.js`
2. Create page method (e.g., `getNewPage()`)
3. Add navigation link in `index.html`
4. Implement page-specific functionality

### Styling

The application uses a custom CSS framework with:
- CSS Grid and Flexbox for layouts
- CSS Custom Properties for theming
- Responsive design with mobile-first approach
- Smooth animations and transitions

## Deployment

The web interface can be deployed to any static hosting service or containerized with Docker.

### Environment Variables

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: localhost)
- `NODE_ENV` - Environment (development/production)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details.
