# 🚀 Deploy to AWS - Quick Guide

This guide will help you deploy the latest changes (including the glassmorphism event styling and proper line spacing) to AWS immediately.

## ⚡ Quick Deploy Steps

### 1. Update Cache Versions
```bash
npm run update-css-version
```
This updates both CSS and JS versions to bust browser cache.

### 2. Commit Changes
```bash
git add .
git commit -m "Update events styling with glassmorphism and fix line spacing"
git push origin main
```

### 3. Deploy to AWS

**Option A: Using PM2 (Recommended)**
```bash
# SSH into your AWS instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Navigate to your project
cd /path/to/loyalist-app

# Pull latest changes
git pull origin main

# Restart the application
pm2 restart loyalist-app

# Or restart all apps
pm2 restart all

# Check logs
pm2 logs loyalist-app
```

**Option B: Using systemd**
```bash
# SSH into your AWS instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Navigate to your project
cd /path/to/loyalist-app

# Pull latest changes
git pull origin main

# Restart the service
sudo systemctl restart your-app-service

# Check status
sudo systemctl status your-app-service
```

### 4. Clear CloudFront Cache (If Using CloudFront)
```bash
# Via AWS CLI
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*.css" "/*.js" "/index.html"
```

**Or via AWS Console:**
1. Go to CloudFront Console
2. Select your distribution
3. Go to "Invalidations" tab
4. Click "Create Invalidation"
5. Enter paths: `/*.css`, `/*.js`, `/index.html`
6. Click "Create Invalidation"

## 🔍 Verify Deployment

### Check Version Numbers
Open your browser DevTools (F12) and check:
```
Network Tab → Refresh Page → Look for:
- style.css?v=1763065592209
- script.js?v=1763065592209
```

### Test Line Spacing
1. Go to the homepage
2. Check the "Upcoming Events" section
3. Verify that paragraphs with line breaks display correctly
4. Check that glassmorphism styling is applied

### Quick Test URLs
```
# Homepage
https://your-domain.com/

# Direct CSS check
https://your-domain.com/style.css?v=1763065592209

# Direct JS check
https://your-domain.com/script.js?v=1763065592209
```

## 🐛 Troubleshooting

### Changes Not Showing Up?

**1. Hard Refresh Browser**
- Chrome/Firefox: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Safari: `Cmd + Option + R`

**2. Check Server Logs**
```bash
pm2 logs loyalist-app --lines 100
# or
sudo journalctl -u your-app-service -f
```

**3. Verify Server is Running**
```bash
pm2 status
# or
sudo systemctl status your-app-service
```

**4. Check Node.js Process**
```bash
ps aux | grep node
netstat -tulpn | grep :3000  # or your port
```

**5. Manual Cache Clear on Server**
```bash
# SSH into server
cd /path/to/loyalist-app

# Clear npm cache
npm cache clean --force

# Restart with --update-env
pm2 restart loyalist-app --update-env
```

### Still Not Working?

**Check file permissions:**
```bash
ls -la public/style.css
ls -la public/script.js
# Should be readable (r-- or rw-)
```

**Check if files are updated:**
```bash
# On server
cd /path/to/loyalist-app/public
tail -20 style.css  # Should show glassmorphism styles
tail -20 script.js  # Should show updated line break handling
```

**Verify git pull worked:**
```bash
git log -1  # Should show your latest commit
git status  # Should be clean
```

## 📋 What Was Fixed

### ✅ Glassmorphism Events Section
- Frosted glass background with blur effects
- Premium card styling with depth
- Smooth hover animations
- Custom gold gradient scrollbars

### ✅ Line Spacing Fix
- Proper handling of `\n`, `\r\n`, and `\r` line breaks
- Converts to HTML `<br>` tags
- Displays paragraphs with correct spacing

### ✅ Sharp Text Rendering
- Anti-aliased fonts
- Text shadows for clarity
- Optimized letter-spacing
- High contrast colors

### ✅ Cache Busting
- Automatic version updates for CSS/JS
- Server-side cache control headers
- Meta tags preventing aggressive caching

## 🎯 Expected Results

After deployment, you should see:
1. ✨ Beautiful glassmorphism design on events
2. 📝 Properly spaced paragraphs in event descriptions
3. 🔍 Crystal-clear, readable text
4. 📱 Responsive design on all devices
5. ⚡ Changes reflect immediately (no cache issues)

## 📞 Need Help?

If issues persist after following all steps:
1. Check the server error logs
2. Verify AWS security group allows your ports
3. Ensure DNS/CloudFront is pointing to correct origin
4. Contact AWS support if server-level issues

---

**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Version:** 1.0.0
