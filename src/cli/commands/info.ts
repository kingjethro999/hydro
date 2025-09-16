/**
 * Info command - Start web server with Hydro documentation and information
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { BaseCommand } from './base';
import { logger } from '@/core/logger';

import type { CommandOptions } from '@/types';

export class InfoCommand extends BaseCommand {
  constructor() {
    super('info', 'Start web server with Hydro documentation and information');
    
    this.command
      .option('--port <port>', 'Port to run the server on', '3000')
      .option('--host <host>', 'Host to bind the server to', 'localhost')
      .option('--open', 'Open browser automatically', false)
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      port?: string;
      host?: string;
      open?: boolean;
    }
  ): Promise<void> {
    const port = parseInt(options.port || '3000', 10);
    const host = options.host || 'localhost';
    const shouldOpen = options.open || false;

    try {
      // Start the web server
      await this.startWebServer(port, host, shouldOpen);
    } catch (error) {
      logger.error('Failed to start web server', error as Error);
      throw error;
    }
  }

  /**
   * Start the web server
   */
  private async startWebServer(port: number, host: string, shouldOpen: boolean): Promise<void> {
    const server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve, reject) => {
      server.listen(port, host, () => {
        const url = `http://${host}:${port}`;
        
        logger.success(`Hydro Info Server started successfully!`);
        logger.info(`🌐 Server running at: ${url}`);
        logger.info(`📚 Documentation and information available at: ${url}`);
        logger.info(`\nPress Ctrl+C to stop the server`);
        
        if (shouldOpen) {
          this.openBrowser(url);
        }

        // Handle graceful shutdown
        process.on('SIGINT', () => {
          logger.info('\n🛑 Shutting down server...');
          server.close(() => {
            logger.success('Server stopped successfully');
            process.exit(0);
          });
        });

        resolve();
      });

      server.on('error', (error) => {
        if ((error as any).code === 'EADDRINUSE') {
          logger.error(`Port ${port} is already in use. Try a different port with --port`);
        } else {
          logger.error('Server error:', error);
        }
        reject(error);
      });
    });
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(req: any, res: any): void {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      // Route requests
      if (pathname === '/' || pathname === '/index.html') {
        this.serveIndex(res);
      } else if (pathname === '/api/version') {
        this.serveVersionAPI(res);
      } else if (pathname === '/api/status') {
        this.serveStatusAPI(res);
      } else if (pathname.startsWith('/assets/')) {
        this.serveAsset(pathname, res);
      } else {
        this.serve404(res);
      }
    } catch (error) {
      this.serve500(res, error as Error);
    }
  }

  /**
   * Serve the main index page
   */
  private serveIndex(res: any): void {
    const htmlPath = join(__dirname, '../../web/index.html');
    
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      // Fallback HTML if file doesn't exist
      const fallbackHtml = this.generateFallbackHTML();
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fallbackHtml);
    }
  }

  /**
   * Serve version API
   */
  private async serveVersionAPI(res: any): Promise<void> {
    try {
      const { VersionCommand } = await import('./version');
      const versionCmd = new VersionCommand();
      
      // This would need to be refactored to expose the version info directly
      const versionInfo = {
        hydro: {
          version: '1.0.0',
          name: 'hydro-cli',
          description: 'The Unified Development Environment Catalyst',
        },
        timestamp: new Date().toISOString(),
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(versionInfo, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get version info' }));
    }
  }

  /**
   * Serve status API
   */
  private async serveStatusAPI(res: any): Promise<void> {
    try {
      const status = {
        server: 'running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get status' }));
    }
  }

  /**
   * Serve static assets
   */
  private serveAsset(pathname: string, res: any): void {
    const assetPath = join(__dirname, '../../web', pathname);
    
    if (existsSync(assetPath)) {
      const content = readFileSync(assetPath);
      const ext = pathname.split('.').pop();
      const contentType = this.getContentType(ext || '');
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      this.serve404(res);
    }
  }

  /**
   * Serve 404 page
   */
  private serve404(res: any): void {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>404 - Page Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p>The requested page could not be found.</p>
        <a href="/">← Back to Home</a>
      </body>
      </html>
    `);
  }

  /**
   * Serve 500 error page
   */
  private serve500(res: any, error: Error): void {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>500 - Server Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>500 - Server Error</h1>
        <p>An internal server error occurred.</p>
        <a href="/">← Back to Home</a>
      </body>
      </html>
    `);
  }

  /**
   * Get content type for file extension
   */
  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
    };
    return types[ext] || 'text/plain';
  }

  /**
   * Open browser to URL
   */
  private openBrowser(url: string): void {
    const { exec } = require('child_process');
    const start = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${start} ${url}`, (error: any) => {
      if (error) {
        logger.debug('Could not open browser automatically');
      }
    });
  }

  /**
   * Generate fallback HTML if web files don't exist
   */
  private generateFallbackHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hydro - Development Environment Catalyst</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .container { 
            background: white; border-radius: 20px; padding: 40px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 600px; text-align: center;
        }
        h1 { color: #2c3e50; margin-bottom: 20px; font-size: 2.5em; }
        p { color: #7f8c8d; font-size: 1.2em; line-height: 1.6; margin-bottom: 30px; }
        .btn { 
            background: #3498db; color: white; padding: 15px 30px; 
            border: none; border-radius: 10px; font-size: 1.1em; 
            cursor: pointer; text-decoration: none; display: inline-block;
            transition: all 0.3s ease;
        }
        .btn:hover { background: #2980b9; transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Hydro</h1>
        <p>The Unified Development Environment Catalyst</p>
        <p>Hydro is starting up... The web interface will be available shortly.</p>
        <a href="/" class="btn">Refresh Page</a>
    </div>
</body>
</html>
    `;
  }
}
