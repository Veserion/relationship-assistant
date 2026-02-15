const PREFIX = '[Bot]';
const DEBUG = process.env.DEBUG !== 'false' && process.env.DEBUG !== '0';

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

function format(...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  return `${timestamp} ${PREFIX} ${args.map((a) => (typeof a === 'object' && a !== null ? safeStringify(a) : String(a))).join(' ')}`;
}

export const log = {
  info: (...args: unknown[]) => console.log(format('INFO', ...args)),
  warn: (...args: unknown[]) => console.warn(format('WARN', ...args)),
  error: (msg: string, err?: unknown) => {
    console.error(format('ERROR', msg));
    if (err instanceof Error) {
      console.error(err.stack);
    } else if (err !== undefined) {
      console.error(err);
    }
  },
  debug: (...args: unknown[]) => (DEBUG ? console.log(format('DEBUG', ...args)) : undefined),
};
