import { complimentsData } from '../data/complimentsData.generated.js';

const categories = Object.keys(complimentsData.compliments);

export class ComplimentService {
  static getRandomCompliment(): string {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const options = complimentsData.compliments[randomCategory as keyof typeof complimentsData.compliments];
    return options[Math.floor(Math.random() * options.length)];
  }
}
