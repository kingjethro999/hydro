# Hydro Web Interface

A modern, interactive web interface for the Hydro development environment catalyst.

## Features

- **Interactive Terminal Demo**: Try Hydro's commands with realistic terminal output
- **Real-time Analytics Dashboard**: View project metrics and analyzer status
- **Plugin Marketplace**: Browse and manage Hydro plugins
- **Comprehensive Documentation**: Complete guides and API reference
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Built with Tailwind CSS and smooth animations

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

## Development

### Project Structure

```
src/web/
├── public/                 # Static files served by Express
│   ├── index.html         # Main HTML file
│   ├── index.js           # Main JavaScript application
│   └── page_routing.js    # Client-side routing
├── server.js              # Express server
├── start.js               # Entry point
└── package.json           # Dependencies and scripts
```

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start with file watching for development
- `npm run build` - Build for production (currently no build step needed)

### API Endpoints

The web interface includes several API endpoints:

- `GET /api/health` - Server health check
- `GET /api/version` - Hydro version information
- `GET /api/status` - Server status and metrics
- `GET /api/plugins` - Available plugins
- `GET /api/commands` - Hydro commands reference
- `GET /api/ai/capabilities` - AI features and capabilities
- `GET /api/analysis/status` - Project analysis metrics

### Customization

#### Styling
The interface uses Tailwind CSS with custom Hydro color scheme:
- `hydro-blue`: #3B82F6
- `hydro-purple`: #8B5CF6
- `hydro-cyan`: #06B6D4
- `hydro-green`: #10B981
- `hydro-orange`: #F59E0B
- `hydro-red`: #EF4444

#### JavaScript Features
- **HydroWebApp**: Main application class with state management
- **HydroRouter**: Client-side routing system
- **Interactive Demos**: Terminal simulation with typing animations
- **Real-time Updates**: Live data from API endpoints
- **Responsive Design**: Mobile-first approach

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance

The web interface is optimized for performance:
- Lazy loading of images and content
- Intersection Observer for animations
- Throttled scroll and resize handlers
- Minimal JavaScript bundle size
- Efficient DOM updates

## Integration with Hydro CLI

The web interface is designed to work alongside the Hydro CLI:

1. **Command Reference**: Shows all available Hydro commands
2. **Interactive Demos**: Demonstrates CLI functionality
3. **Plugin Management**: Install and manage plugins
4. **Analysis Results**: Display CLI analysis output
5. **Documentation**: Complete guides for CLI usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see the main project LICENSE file for details.