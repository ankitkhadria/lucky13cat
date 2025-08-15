#!/usr/bin/env node

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const MAX_SIZE = 13312; // 13KB limit for JS13kGames

async function checkSize() {
  try {
    console.log('📏 Checking zip size...');
    
    const zipPath = join(projectRoot, 'dist/game.zip');
    
    // Check if zip file exists
    try {
      await fs.access(zipPath);
    } catch (error) {
      console.error('❌ game.zip not found! Run "npm run zip" first.');
      process.exit(1);
    }
    
    // Get file size
    const stats = await fs.stat(zipPath);
    const sizeBytes = stats.size;
    const sizeKB = (sizeBytes / 1024).toFixed(2);
    const maxSizeKB = (MAX_SIZE / 1024).toFixed(2);
    const percentage = ((sizeBytes / MAX_SIZE) * 100).toFixed(1);
    
    console.log(`📦 Zip file size: ${sizeBytes} bytes (${sizeKB} KB)`);
    console.log(`🎯 Size limit: ${MAX_SIZE} bytes (${maxSizeKB} KB)`);
    console.log(`📊 Usage: ${percentage}%`);
    
    if (sizeBytes <= MAX_SIZE) {
      const remaining = MAX_SIZE - sizeBytes;
      const remainingKB = (remaining / 1024).toFixed(2);
      console.log(`✅ Size check PASSED! ${remaining} bytes (${remainingKB} KB) remaining.`);
      
      // Show size breakdown
      console.log('\n📋 Size breakdown:');
      console.log(`   Used: ${sizeBytes.toLocaleString()} bytes`);
      console.log(`   Remaining: ${remaining.toLocaleString()} bytes`);
      console.log(`   Total limit: ${MAX_SIZE.toLocaleString()} bytes`);
      
      // Performance indicator
      if (percentage < 50) {
        console.log('🟢 Excellent compression! Well under the limit.');
      } else if (percentage < 80) {
        console.log('🟡 Good compression. Consider optimizing if adding more features.');
      } else if (percentage < 95) {
        console.log('🟠 Close to the limit. Be careful with new additions.');
      } else {
        console.log('🔴 Very close to the limit! Optimize before adding anything.');
      }
      
      process.exit(0);
    } else {
      const excess = sizeBytes - MAX_SIZE;
      const excessKB = (excess / 1024).toFixed(2);
      console.log(`❌ Size check FAILED! Exceeds limit by ${excess} bytes (${excessKB} KB).`);
      
      console.log('\n💡 Optimization suggestions:');
      console.log('   • Remove unused code and variables');
      console.log('   • Simplify complex expressions');
      console.log('   • Reduce string literals');
      console.log('   • Optimize sprite drawing functions');
      console.log('   • Consider removing non-essential features');
      console.log('   • Use shorter variable names');
      console.log('   • Compress audio generation code');
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Size check failed:', error);
    process.exit(1);
  }
}

// Additional function to analyze the uncompressed size
async function analyzeSourceSize() {
  try {
    const indexPath = join(projectRoot, 'dist/index.html');
    
    try {
      const htmlContent = await fs.readFile(indexPath, 'utf8');
      const htmlSize = Buffer.byteLength(htmlContent, 'utf8');
      const htmlKB = (htmlSize / 1024).toFixed(2);
      
      console.log(`📄 Uncompressed HTML: ${htmlSize} bytes (${htmlKB} KB)`);
      
      // Extract JavaScript size (rough estimate)
      const scriptMatch = htmlContent.match(/<script>(.*?)<\/script>/s);
      if (scriptMatch) {
        const jsSize = Buffer.byteLength(scriptMatch[1], 'utf8');
        const jsKB = (jsSize / 1024).toFixed(2);
        console.log(`⚙️  JavaScript code: ${jsSize} bytes (${jsKB} KB)`);
        
        const cssMatch = htmlContent.match(/<style>(.*?)<\/style>/s);
        if (cssMatch) {
          const cssSize = Buffer.byteLength(cssMatch[1], 'utf8');
          console.log(`🎨 CSS code: ${cssSize} bytes`);
        }
        
        const htmlOnlySize = htmlSize - jsSize - (cssMatch ? Buffer.byteLength(cssMatch[1], 'utf8') : 0);
        console.log(`📰 HTML markup: ${htmlOnlySize} bytes`);
      }
      
    } catch (error) {
      console.log('ℹ️  index.html not found, skipping source analysis');
    }
    
  } catch (error) {
    console.warn('⚠️  Could not analyze source size:', error.message);
  }
}

// Run size check with source analysis
async function main() {
  await analyzeSourceSize();
  await checkSize();
}

main().catch(console.error);