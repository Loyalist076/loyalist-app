const fs = require('fs');
const path = require('path');

const prSrc = path.join(__dirname, 'public/page/press-release.html');
const trDest = path.join(__dirname, 'public/page/technical-reports.html');

let html = fs.readFileSync(prSrc, 'utf8');

// Title changes
html = html.replace(/<title>.*?<\/title>/, '<title>Loyalist Exploration - Technical Reports</title>');
html = html.replace(/<h1 class="section-title">Press Releases<\/h1>/, '<h1 class="section-title">Technical Reports</h1>');
html = html.replace(/<meta name="description" content="Stay up to date with Loyalist Exploration Limited's latest news, announcements and project updates in gold and silver exploration." \/>/, '<meta name="description" content="Read all of Loyalist Exploration Limited\'s technical reports and QP consents." />');

// Remove 'View All News' button
html = html.replace(/<div class="view-all-container">[\s\S]*?<\/div>/, '');

// JS Changes
// Remove old functions
html = html.replace(/const MONTH_NAMES = \[[\s\S]*?async function fetchNewsPDFs\(\) \{/m, 'async function fetchTechnicalReports() {');

// The rest of the fetch logic for technical reports: 
// They don't need to be grouped by date, just listed.
const fetchNewsPDFsRegex = /async function fetchNewsPDFs\(\) \{[\s\S]*?window\.onload = fetchNewsPDFs;/m;
const newFetchLogic = `async function fetchTechnicalReports() {
      try {
        const timestamp = new Date().getTime();
        const res = await fetch(\`/api/technical-reports?t=\${timestamp}\`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const reports = await res.json();
        const container = document.getElementById('newsContainer');
        container.innerHTML = '';

        if (reports.length === 0) {
           container.innerHTML = '<p style="text-align: center; color: #666; font-size: 18px;">No technical reports available at this time.</p>';
           return;
        }

        const row = document.createElement('div');
        row.className = 'news-items';

        reports.forEach(report => {
          const card = document.createElement('div');
          card.className = 'news-card';
          // Use the direct URL to the PDF stored in the report object
          card.innerHTML = \`
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <a href="\${report.url}" target="_blank" class="news-title">
                <i class="fas fa-file-pdf" style="margin-right: 8px;"></i> \${report.title}
              </a>
              <a href="\${report.url}" download target="_blank" title="Download PDF" class="download-btn" style="background: #D4B248; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 14px;">
                Download
              </a>
            </div>
          \`;
          row.appendChild(card);
        });
        container.appendChild(row);
      } catch (err) {
        console.error('Failed to load technical reports:', err);
        document.getElementById('newsContainer').innerHTML = '<p style="color:red; text-align: center;">Failed to load technical reports.</p>';
      }
    }

    window.onload = fetchTechnicalReports;`;

html = html.replace(fetchNewsPDFsRegex, newFetchLogic);

fs.writeFileSync(trDest, html, 'utf8');
console.log('Created technical-reports.html');
