# Cache Busting Guide

This document explains how CSS caching is handled to ensure your style changes reflect immediately on AWS and other deployments.

## 🚀 Quick Start

**Before deploying to AWS, run:**
```bash
npm run update-css-version
```

This will automatically update the CSS version number to bust browser and CDN caches.

## 📋 What Was Implemented

### 1. **Version Query Parameters**
CSS files are loaded with a version parameter:
```html
<link rel="stylesheet" href="style.css?v=2.0.1" />
```

When you update the version, browsers will fetch the new CSS file instead of using the cached version.

### 2. **Cache Control Headers (server.js)**
The server now sets appropriate cache control headers:
- **CSS/JS files**: 5-minute cache with must-revalidate
- **Images**: 24-hour cache (can be cached longer)
- **HTML files**: No cache (always fresh)

### 3. **Meta Tags (index.html)**
Added meta tags to prevent aggressive browser caching:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

## 🔧 How to Use

### Manual Version Update
1. Open `public/index.html`
2. Find the line: `<link rel="stylesheet" href="style.css?v=2.0.1" />`
3. Change the version number (e.g., `v=2.0.2`)
4. Deploy to AWS

### Automatic Version Update
Run this command before deploying:
```bash
npm run update-css-version
```

This will automatically update the version to a timestamp, ensuring uniqueness.

### Using with Deploy Script
The `predeploy` script automatically runs the version updater:
```bash
npm run deploy
```

## 🌐 For AWS Deployment

### After Deploying CSS Changes:

1. **Update CSS version:**
   ```bash
   npm run update-css-version
   ```

2. **Restart your server:**
   ```bash
   pm2 restart loyalist-app
   # or
   sudo systemctl restart your-app-service
   ```

3. **Clear CloudFront cache (if using CloudFront):**
   - Go to AWS CloudFront Console
   - Select your distribution
   - Create invalidation for `/*.css`

### For Immediate Effect on AWS:
If you need changes to reflect immediately:
```bash
npm run update-css-version
git add .
git commit -m "Update CSS version"
git push
# Then deploy to AWS
```

## 🛠️ Troubleshooting

### Changes Still Not Showing?

1. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   - Or use incognito mode

2. **Hard refresh:**
   - Chrome/Firefox: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Safari: Cmd+Option+R

3. **Check the version loaded:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Refresh page
   - Check if `style.css?v=XXXXX` is being requested with the new version

4. **Server cache:**
   - Restart your Node.js server
   - Clear any server-side caching

5. **CDN/CloudFront cache:**
   - Create a cache invalidation
   - Or wait for the TTL to expire (5 minutes for CSS)

## 📝 Notes

- The version updater generates timestamps, ensuring each deploy has a unique version
- Cache control headers are set automatically by the server
- CSS/JS files cache for 5 minutes maximum
- HTML files are never cached
- Images cache for 24 hours (good for performance)

## 🔄 Workflow

```
Make CSS changes → npm run update-css-version → Deploy to AWS → Changes reflect immediately
```
