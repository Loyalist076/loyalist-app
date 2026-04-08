const fs = require('fs');
const path = require('path');

// 1. Create technical-report-manager.html
const adminSrc = path.join(__dirname, 'public/admin/corporate-presentation-manager.html');
const adminDest = path.join(__dirname, 'public/admin/technical-report-manager.html');
let adminHTML = fs.readFileSync(adminSrc, 'utf8');
adminHTML = adminHTML.replace(/Corporate Presentation/g, 'Technical Report')
                     .replace(/corporate-presentation/g, 'technical-reports')
                     .replace(/Corporate presentation/g, 'Technical report');
fs.writeFileSync(adminDest, adminHTML, 'utf8');

// 2. Add to admin dashboard
const dashboardPath = path.join(__dirname, 'public/admin/admin-dashboard.html');
let dbHTML = fs.readFileSync(dashboardPath, 'utf8');
if (!dbHTML.includes('technical-report-manager.html')) {
  dbHTML = dbHTML.replace(
    '<a href="corporate-presentation-manager.html">Corporate Presentation</a>',
    '<a href="corporate-presentation-manager.html">Corporate Presentation</a>\n        <a href="technical-report-manager.html">Technical Reports</a>'
  );
  fs.writeFileSync(dashboardPath, dbHTML, 'utf8');
}

console.log("Admin setup complete");
