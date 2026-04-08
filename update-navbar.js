const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const pageDir = path.join(__dirname, 'public/page');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let dirty = false;

    // Inside public/
    if (content.includes('<li><a href="page/presentations.html"') && !content.includes('page/technical-reports.html')) {
        content = content.replace(
            /(<li><a href="page\/presentations\.html".*?<\/a><\/li>)/,
            '$1\n            <li><a href="page/technical-reports.html">Technical Reports</a></li>'
        );
        dirty = true;
    }

    // Inside public/page/
    if (content.includes('<li><a href="../page/presentations.html"') && !content.includes('../page/technical-reports.html')) {
        content = content.replace(
            /(<li><a href="\.\.\/page\/presentations\.html".*?<\/a><\/li>)/,
            '$1\n            <li><a href="../page/technical-reports.html">Technical Reports</a></li>'
        );
        dirty = true;
    }
    
     if (content.includes('<li><a href="presentations.html"') && !content.includes('technical-reports.html')) {
        content = content.replace(
            /(<li><a href="presentations\.html".*?<\/a><\/li>)/,
            '$1\n            <li><a href="technical-reports.html">Technical Reports</a></li>'
        );
        dirty = true;
    }

    if (dirty) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated navbar in', filePath);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file === 'admin' || file === 'page' || file === 'components') {
                 traverse(fullPath);
            }
        } else if (file.endsWith('.html')) {
            processFile(fullPath);
        }
    }
}

traverse(publicDir);
