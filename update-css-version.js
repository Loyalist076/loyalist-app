#!/usr/bin/env node

/**
 * CSS & JS Version Updater
 * Automatically increments the version number for CSS/JS cache busting
 * Run this script before deploying to AWS to ensure all changes are reflected
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

console.log('🔄 Updating CSS & JS versions for cache busting...\n');

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let updated = false;

    console.log(`📄 ${filePath}`);

    // Replace the version in style.css link
    const oldCssVersion = content.match(/style\.css\?v=([^"]+)/);
    if (oldCssVersion) {
      console.log(`   CSS Old version: ${oldCssVersion[1]}`);
      content = content.replace(
        /style\.css\?v=[^"]+/g,
        `style.css?v=${newVersion}`
      );
      console.log(`   CSS New version: ${newVersion}`);
      updated = true;
    }

    // Replace versions in script.js and other JS files
    const jsFiles = ['script.js', 'cache-utils.js', 'corporate-presentation-loader.js'];
    jsFiles.forEach(jsFile => {
      const regex = new RegExp(`${jsFile}\\?v=([^"]+)`, 'g');
      const oldJsVersion = content.match(regex);
      if (oldJsVersion) {
        console.log(`   JS (${jsFile}) Old version: ${oldJsVersion[0].split('=')[1]}`);
        content = content.replace(
          regex,
          `${jsFile}?v=${newVersion}`
        );
        console.log(`   JS (${jsFile}) New version: ${newVersion}`);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`   ✅ Updated successfully\n`);
    } else {
      console.log(`   ⚠️  No versions found\n`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('✨ CSS & JS version update complete!');
console.log('💡 Remember to restart your server for cache control headers to take effect.');
