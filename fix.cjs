const fs = require('fs');

let content = fs.readFileSync('src/components/marketplace/FilterSidebar.tsx', 'utf8');
content = content.replace(/<SelectTrigger className="rounded-2xl /g, '<SelectTrigger className="rounded-sm ');
content = content.replace(/<SelectContent className="rounded-2xl/g, '<SelectContent className="rounded-sm');
content = content.replace(/'all'/g, "'todos'");
content = content.replace(/value="all"/g, 'value="todos"');
fs.writeFileSync('src/components/marketplace/FilterSidebar.tsx', content);

let chipsContent = fs.readFileSync('src/components/marketplace/FilterChips.tsx', 'utf8');
chipsContent = chipsContent.replace(/'all'/g, "'todos'");
fs.writeFileSync('src/components/marketplace/FilterChips.tsx', chipsContent);

let marketContent = fs.readFileSync('src/pages/Marketplace.tsx', 'utf8');
marketContent = marketContent.replace(/'all'/g, "'todos'");
fs.writeFileSync('src/pages/Marketplace.tsx', marketContent);

console.log('Done');
