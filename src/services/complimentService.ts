import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const COMPLIMENTS_PATH = join(process.cwd(), 'data', 'compliments.json');

interface ComplimentData {
  compliments: Record<string, string[]>;
}

export class ComplimentService {
  private static data: ComplimentData | null = null;

  private static loadData() {
    const pathsToTry = [
      join(process.cwd(), 'data', 'compliments.json'),
      join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', 'data', 'compliments.json'),
      join(fileURLToPath(new URL('.', import.meta.url)), '..', 'data', 'compliments.json'),
    ];

    let lastError = '';
    for (const p of pathsToTry) {
      try {
        console.log(`[ComplimentService] Trying path: ${p}`);
        const raw = readFileSync(p, 'utf8');
        this.data = JSON.parse(raw);
        console.log(`[ComplimentService] Successfully loaded from: ${p}`);
        return;
      } catch (err: any) {
        lastError = err.message;
      }
    }

    console.error(`[ComplimentService] All paths failed. Last error: ${lastError}`);
    console.error(`[ComplimentService] Current CWD: ${process.cwd()}`);
    // Don't set this.data permanently to fallback so we can retry if file appears later
    // but for the current call, return a default
  }

  static getRandomCompliment(): string {
    if (!this.data) {
      this.loadData();
    }
    
    if (!this.data) {
      return 'Ты солнышко! (ошибка загрузки базы)';
    }
    
    const categories = Object.keys(this.data.compliments);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const options = this.data.compliments[randomCategory];
    
    return options[Math.floor(Math.random() * options.length)];
  }
}
