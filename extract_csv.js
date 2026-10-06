const fs = require('fs');
const path = '/Users/geraldchristopherandreas/.gemini/antigravity/brain/2eda07e3-4d7d-4961-af98-2732b95276e8/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const parsed = JSON.parse(line);
    // Ignore model or system
    if (parsed.role === 'model' || parsed.role === 'system') continue;
    if (parsed.source === 'MODEL' || parsed.source === 'SYSTEM') continue;
    
    const content = parsed.content || (parsed.parts && parsed.parts[0] && parsed.parts[0].text) || '';
    if (content.includes('No,Branch,Target Ceklist BMT') && content.includes('SUBUR MAULANA')) {
      const startIndex = content.indexOf('No,Branch,Target Ceklist BMT');
      let csvData = content.substring(startIndex);
      
      if (csvData.includes('</USER_REQUEST>')) {
         csvData = csvData.split('</USER_REQUEST>')[0];
      }
      
      fs.writeFileSync('stores.csv', csvData.trim());
      console.log('Successfully extracted stores.csv!');
      process.exit(0);
    }
  } catch (e) {}
}
console.log('Could not extract stores.csv');
