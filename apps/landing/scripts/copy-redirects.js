// scripts/copy-redirects.js
import { copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const source = resolve(__dirname, '../public/_redirects');
const dest = resolve(__dirname, '../dist/_redirects');

console.log('📁 Copying _redirects from:', source);
console.log('📁 To:', dest);

if (existsSync(source)) {
  copyFileSync(source, dest);
  console.log('✅ _redirects copied to dist');
} else {
  console.error('❌ _redirects not found at:', source);
  process.exit(1);
}