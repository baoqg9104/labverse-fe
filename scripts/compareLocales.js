const fs = require('fs');
const path = require('path');

function collectKeys(obj, prefix = '') {
  const keys = [];
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      keys.push(p);
      keys.push(...collectKeys(obj[k], p));
    }
  }
  return keys;
}

function main() {
  const root = path.resolve(__dirname, '..', 'src', 'locales');
  const enPath = path.join(root, 'en.json');
  const viPath = path.join(root, 'vi.json');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));

  const enKeys = new Set(collectKeys(en));
  const viKeys = new Set(collectKeys(vi));

  const missingInVi = [...enKeys].filter(k => !viKeys.has(k)).sort();
  const missingInEn = [...viKeys].filter(k => !enKeys.has(k)).sort();

  console.log('Missing keys in vi.json (present in en.json):');
  if (missingInVi.length === 0) console.log('  None'); else missingInVi.forEach(k => console.log('  ' + k));
  console.log('\nExtra keys in vi.json (not in en.json):');
  if (missingInEn.length === 0) console.log('  None'); else missingInEn.forEach(k => console.log('  ' + k));
}

main();
