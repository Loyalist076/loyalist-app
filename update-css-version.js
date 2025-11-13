#!/usr/bin/env node

/**
 * CSS Version Updater
 * Automatically increments the version number for CSS cache busting
 * Run this script before deploying to AWS to ensure CSS changes are reflected
 */

const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'public/index.html',
  // Add other HTML files here if needed
];

// Generate new version based on current timestamp
const newVersion = Date.now();

console.log('🔄 Updating CSS version for cache busting...\n');

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace the version in style.css link
    const oldVersion = content.match(/style\.css\?v=([^"]+)/);
    if (oldVersion) {
      console.log(`📄 ${filePath}`);
      console.log(`   Old version: ${oldVersion[1]}`);
      content = content.replace(
        /style\.css\?v=[^"]+/g,
        `style.css?v=${newVersion}`
      );
      console.log(`   New version: ${newVersion}`);

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`   ✅ Updated successfully\n`);
    } else {
      console.log(`⚠️  No version found in ${filePath}\n`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('✨ CSS version update complete!');
console.log('💡 Remember to restart your server for cache control headers to take effect.');
