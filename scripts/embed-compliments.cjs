/**
 * Встраивает data/compliments.json в исходник для сборки.
 * В проде не нужен доступ к файловой системе — данные уже в бандле.
 * Запуск: node scripts/embed-compliments.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const inputPath = path.join(ROOT, 'data', 'compliments.json');
const outDir = path.join(ROOT, 'src', 'data');
const outPath = path.join(outDir, 'complimentsData.generated.ts');

const raw = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(raw);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const content = `// AUTO-GENERATED from data/compliments.json — do not edit. Run: npm run embed-compliments\n\nexport const complimentsData = ${JSON.stringify(data)};\n`;

fs.writeFileSync(outPath, content, 'utf8');
console.log('[embed-compliments] Written', outPath);
