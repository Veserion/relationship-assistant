import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const dbPath = process.env.DB_CONNECTION || './data/relationship_bot.db';
const absolutePath = path.resolve(dbPath);

if (fs.existsSync(absolutePath)) {
  try {
    fs.unlinkSync(absolutePath);
    console.log(`✅ Database at ${absolutePath} has been successfully reset.`);
    
    // Also remove WAL files if they exist
    const walFile = `${absolutePath}-wal`;
    const shmFile = `${absolutePath}-shm`;
    
    if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
    if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
    
  } catch (error) {
    console.error(`❌ Error resetting database: ${error}`);
    process.exit(1);
  }
} else {
  console.log(`ℹ️ Database file not found at ${absolutePath}, nothing to reset.`);
}
