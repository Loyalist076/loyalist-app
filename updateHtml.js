const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Replace Corporate Presentation links in navbar and footer
    const newPresentationLink = filePath.includes('public/page/') || filePath.includes('public/admin/') ? '../page/presentations.html' : 'page/presentations.html';
    
    // Replace <a href="image/loyalist.pdf" target="_blank" id="corporatePresentationLink">Corporate Presentation</a>
    // and <a href="../image/loyalist.pdf" target="_blank" class="corporate-presentation-link">Corporate Presentation</a>
    const oldLinkRegex = /<a href="[^"]*loyalist\.pdf"[^>]*>Corporate Presentation<\/a>/g;
    
    if (oldLinkRegex.test(content)) {
        let classOrId = filePath.includes('index.html') ? 'id="corporatePresentationLink"' : 'class="corporate-presentation-link"';
        if(filePath.includes('admin-dashboard.html')) {
            // inside admin dashboard it's different, do not touch or handle specially.
        } else {
            content = content.replace(oldLinkRegex, `<a href="${newPresentationLink}" ${classOrId}>Corporate Presentations</a>`);
            modified = true;
        }
    }

    // 2. Add Desantis to Navbar dropdowns
    // <li><a href="page/tully-project.html">Tully Project </a></li>  
    const tullyLinkRegex1 = /<li>\s*<a href="page\/tully-project\.html">Tully Project\s*<\/a>\s*<\/li>/g;
    if (tullyLinkRegex1.test(content)) {
        content = content.replace(tullyLinkRegex1, `<li><a href="page/tully-project.html">Tully Project </a></li>\n            <li><a href="page/desantis-project.html">Desantis Project</a></li>`);
        modified = true;
    }
    const tullyLinkRegex2 = /<li>\s*<a href="tully-project\.html">Tully Project\s*<\/a>\s*<\/li>/g;
    if (tullyLinkRegex2.test(content)) {
        content = content.replace(tullyLinkRegex2, `<li><a href="tully-project.html">Tully Project </a></li>\n            <li><a href="desantis-project.html">Desantis Project</a></li>`);
        modified = true;
    }
    const tullyLinkRegex3 = /<li>\s*<a href="\.\.\/page\/tully-project\.html">Tully Project\s*<\/a>\s*<\/li>/g;
    if (tullyLinkRegex3.test(content)) {
        content = content.replace(tullyLinkRegex3, `<li><a href="../page/tully-project.html">Tully Project </a></li>\n            <li><a href="../page/desantis-project.html">Desantis Project</a></li>`);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('uploads') && !fullPath.includes('image')) {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.html')) {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(path.join(__dirname, 'public'));
