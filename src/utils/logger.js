const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const COLORS = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  reset: '\x1b[0m'
};

const threshold = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(level, ...args) {
  if (LEVELS[level] < threshold) return;
  const prefix = `${COLORS[level]}[${timestamp()}] [${level.toUpperCase()}]${COLORS.reset}`;
  const stream = level === 'error' ? console.error : console.log;
  stream(prefix, ...args);
}

module.exports = {
  debug: (...a) => log('debug', ...a),
  info: (...a) => log('info', ...a),
  warn: (...a) => log('warn', ...a),
  error: (...a) => log('error', ...a)
};
