const fs = require('fs');
const path = process.argv[2];
let content = fs.readFileSync(path, 'utf8');

// Replace the old fetch call
const oldCode = `'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,`;

const newCode = `'Content-Type': 'application/json',
                'Authorization': \`Bearer \${apiKey}\`,
            },
            body: JSON.stringify({
                query: enhancedQuery,`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(path, content);
console.log('Updated');
