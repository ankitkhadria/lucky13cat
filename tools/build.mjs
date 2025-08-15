#!/usr/bin/env node

import { build } from 'esbuild';
import { minify } from 'terser';
import { minify as minifyHTML } from 'html-minifier-terser';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function buildGame() {
  console.log('🏗️  Building Nine Lives: Shadow Alley...');
  
  try {
    // Clean dist directory
    await fs.rm(join(projectRoot, 'dist'), { recursive: true, force: true });
    await fs.mkdir(join(projectRoot, 'dist'), { recursive: true });
    
    // Step 1: Bundle TypeScript with esbuild
    console.log('📦 Bundling with esbuild...');
    
    const buildResult = await build({
      entryPoints: [join(projectRoot, 'src/main.ts')],
      bundle: true,
      minify: false, // We'll do this in the next step
      target: 'es2020',
      format: 'iife',
      write: false,
      sourcemap: false,
      treeShaking: true,
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    
    let jsCode = buildResult.outputFiles[0].text;
    console.log(`📏 esbuild output: ${jsCode.length} characters`);
    
    // Step 2: Minify with Terser
    console.log('🗜️  Minifying with Terser...');
    
    const terserResult = await minify(jsCode, {
      compress: {
        passes: 3,
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'],
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        hoist_funs: true,
        hoist_props: true,
        hoist_vars: true,
        join_vars: true,
        sequences: true,
        dead_code: true,
        if_return: true,
        evaluate: true,
        side_effects: true,
        reduce_vars: true,
        collapse_vars: true
      },
      mangle: {
        toplevel: true,
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false
      }
    });
    
    if (terserResult.code) {
      jsCode = terserResult.code;
      console.log(`📏 Terser output: ${jsCode.length} characters`);
    }
    
    // Step 3: Apply Roadroller-like compression manually
    console.log('🚗 Applying manual compression...');
    jsCode = await applyManualCompression(jsCode);
    console.log(`📏 Manual compression: ${jsCode.length} characters`);
    
    // Step 4: Create inline HTML
    console.log('📝 Creating inline HTML...');
    
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Nine Lives: Shadow Alley</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;display:flex;justify-content:center;align-items:center;height:100vh;font-family:monospace}
canvas{image-rendering:pixelated;image-rendering:-moz-crisp-edges;image-rendering:crisp-edges;max-width:100vw;max-height:100vh;object-fit:contain}
</style>
</head>
<body>
<script>
${jsCode}
</script>
</body>
</html>`;
    
    // Step 5: Minify HTML
    console.log('🗜️  Minifying HTML...');
    
    const minifiedHTML = await minifyHTML(htmlTemplate, {
      removeComments: true,
      removeCommentsFromCDATA: true,
      removeCDATASectionsFromCDATA: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeOptionalTags: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyJS: true,
      minifyCSS: true
    });
    
    // Step 6: Write final HTML
    const outputPath = join(projectRoot, 'dist/index.html');
    await fs.writeFile(outputPath, minifiedHTML, 'utf8');
    
    const finalSize = Buffer.byteLength(minifiedHTML, 'utf8');
    console.log(`📏 Final HTML size: ${finalSize} bytes`);
    
    console.log('✅ Build complete!');
    console.log(`📁 Output: ${outputPath}`);
    
    return finalSize;
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

async function applyManualCompression(code) {
  // Apply various compression techniques
  
  // 1. Replace common patterns with shorter versions
  const replacements = [
    // Common JavaScript patterns
    [/\.prototype\./g, '.p.'],
    [/function\s+/g, 'function '],
    [/\s*=>\s*/g, '=>'],
    [/\s*\{\s*/g, '{'],
    [/\s*\}\s*/g, '}'],
    [/\s*\(\s*/g, '('],
    [/\s*\)\s*/g, ')'],
    [/\s*;\s*/g, ';'],
    [/\s*,\s*/g, ','],
    [/\s*\[\s*/g, '['],
    [/\s*\]\s*/g, ']'],
    
    // Game-specific patterns
    [/Math\.floor/g, '~~'],
    [/Math\.abs/g, 'Math.abs'],
    [/Math\.sqrt/g, 'Math.sqrt'],
    [/Math\.sin/g, 'Math.sin'],
    [/Math\.cos/g, 'Math.cos'],
    [/Math\.PI/g, 'Math.PI'],
    [/\.length/g, '.l'],
    
    // Remove unnecessary spaces around operators
    [/\s*\+\s*/g, '+'],
    [/\s*-\s*/g, '-'],
    [/\s*\*\s*/g, '*'],
    [/\s*\/\s*/g, '/'],
    [/\s*%\s*/g, '%'],
    [/\s*<\s*/g, '<'],
    [/\s*>\s*/g, '>'],
    [/\s*<=\s*/g, '<='],
    [/\s*>=\s*/g, '>='],
    [/\s*===\s*/g, '==='],
    [/\s*!==\s*/g, '!=='],
    [/\s*==\s*/g, '=='],
    [/\s*!=\s*/g, '!='],
    [/\s*&&\s*/g, '&&'],
    [/\s*\|\|\s*/g, '||'],
    [/\s*\?\s*/g, '?'],
    [/\s*:\s*/g, ':']
  ];
  
  for (const [pattern, replacement] of replacements) {
    code = code.replace(pattern, replacement);
  }
  
  // 2. Optimize number literals
  code = code.replace(/\.0+([^0-9])/g, '$1'); // Remove trailing zeros
  code = code.replace(/0\.([0-9]+)/g, '.$1'); // Remove leading zero from decimals
  
  // 3. Replace boolean literals in certain contexts
  code = code.replace(/true/g, '!0');
  code = code.replace(/false/g, '!1');
  
  // 4. Compress common constants
  code = code.replace(/360/g, '360'); // Keep as is for readability
  code = code.replace(/255/g, '255'); // Keep as is
  
  return code;
}

// Run the build
buildGame().catch(console.error);