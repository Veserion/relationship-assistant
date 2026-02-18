import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const COMPLIMENTS_PATH = join(__dirname, '..', 'data', 'compliments.json');

interface ComplimentData {
  compliments: Record<string, string[]>;
}

export class ComplimentService {
  private static data: ComplimentData | null = null;

  private static loadData() {
    try {
      const raw = readFileSync(COMPLIMENTS_PATH, 'utf8');
      this.data = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to load compliments.json:', err);
      this.data = { compliments: { cute: ['Ты солнышко!'] } };
    }
  }

  static getRandomCompliment(): string {
    if (!this.data) this.loadData();
    
    const categories = Object.keys(this.data!.compliments);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const options = this.data!.compliments[randomCategory];
    
    return options[Math.floor(Math.random() * options.length)];
  }
}
