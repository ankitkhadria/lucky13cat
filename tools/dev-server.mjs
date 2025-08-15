#!/usr/bin/env node

import { build } from 'esbuild';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PORT = 3000;

async function createDevServer() {
  console.log('🚀 Starting development server...');
  
  // Create a simple development HTML template
  const devHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>Nine Lives: Shadow Alley - Development</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #000; 
      overflow: hidden; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      font-family: monospace;
    }
    canvas { 
      image-rendering: pixelated; 
      image-rendering: -moz-crisp-edges; 
      image-rendering: crisp-edges;
      max-width: 100vw; 
      max-height: 100vh; 
      object-fit: contain;
      border: 1px solid #333;
    }
    .dev-info {
      position: absolute;
      top: 10px;
      left: 10px;
      color: #fff;
      font-size: 12px;
      background: rgba(0,0,0,0.7);
      padding: 5px;
      border-radius: 3px;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div class="dev-info">DEV MODE</div>
  <script src="/game.js"></script>
</body>
</html>`;

  const server = createServer(async (req, res) => {
    const url = req.url;
    
    // Set CORS headers for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (url === '/' || url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(devHTML);
    } else if (url === '/game.js') {
      try {
        // Build the game on each request for live reload
        const buildResult = await build({
          entryPoints: [join(projectRoot, 'src/main.ts')],
          bundle: true,
          minify: false,
          target: 'es2020',
          format: 'iife',
          write: false,
          sourcemap: 'inline',
          define: {
            'process.env.NODE_ENV': '"development"'
          }
        });
        
        const jsCode = buildResult.outputFiles[0].text;
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(jsCode);
      } catch (error) {
        console.error('Build error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Build error: ' + error.message);
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });
  
  server.listen(PORT, () => {
    console.log(`🌐 Development server running at http://localhost:${PORT}`);
    console.log('📝 Hot reload enabled - changes will be rebuilt automatically');
    console.log('⏹️  Press Ctrl+C to stop');
  });
}

createDevServer().catch(console.error);