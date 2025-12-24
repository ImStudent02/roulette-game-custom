/**
 * Server Logger Module
 * Logs to file and syncs with admin panel
 * 
 * Usage:
 *   const logger = require('./logger.cjs');
 *   logger.info('Server started');
 *   logger.warn('High bet detected');
 *   logger.error('Connection failed', error.stack);
 */

const fs = require('fs');
const path = require('path');

// Log file path
const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'server.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB max before rotation

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Format timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Format log entry
function formatEntry(level, message, stack) {
  const entry = {
    timestamp: getTimestamp(),
    level,
    message,
    stack: stack || null,
  };
  return JSON.stringify(entry);
}

// Rotate log file if too large
function rotateLogIfNeeded() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        const rotatedFile = LOG_FILE.replace('.log', `.${Date.now()}.log`);
        fs.renameSync(LOG_FILE, rotatedFile);
        
        // Keep only last 5 rotated files
        const files = fs.readdirSync(LOG_DIR)
          .filter(f => f.startsWith('server.') && f.endsWith('.log') && f !== 'server.log')
          .sort()
          .reverse();
        
        files.slice(5).forEach(f => {
          fs.unlinkSync(path.join(LOG_DIR, f));
        });
      }
    }
  } catch (e) {
    console.error('[Logger] Rotation error:', e.message);
  }
}

// Write to log file
function writeLog(level, message, stack) {
  try {
    rotateLogIfNeeded();
    const entry = formatEntry(level, message, stack);
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch (e) {
    // Fallback to console if file write fails
    console.error('[Logger] Write error:', e.message);
  }
}

// Logger methods
const logger = {
  info(message) {
    const entry = `[INFO] ${getTimestamp()} - ${message}`;
    console.log(entry);
    writeLog('info', message);
  },

  warn(message) {
    const entry = `[WARN] ${getTimestamp()} - ${message}`;
    console.warn(entry);
    writeLog('warn', message);
  },

  error(message, stack) {
    const entry = `[ERROR] ${getTimestamp()} - ${message}`;
    console.error(entry);
    if (stack) console.error(stack);
    writeLog('error', message, stack);
  },

  debug(message) {
    if (process.env.NODE_ENV === 'development') {
      const entry = `[DEBUG] ${getTimestamp()} - ${message}`;
      console.log(entry);
      writeLog('info', `[DEBUG] ${message}`);
    }
  },

  // Get log file path for admin API
  getLogFilePath() {
    return LOG_FILE;
  },

  // Read recent logs (for admin API)
  getRecentLogs(limit = 100, level = 'all') {
    try {
      if (!fs.existsSync(LOG_FILE)) return [];
      
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      
      // Parse and filter
      const logs = lines
        .map((line, idx) => {
          try {
            const parsed = JSON.parse(line);
            return {
              id: String(idx),
              ...parsed,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .filter(log => level === 'all' || log.level === level)
        .reverse() // Newest first
        .slice(0, limit);
      
      return logs;
    } catch (e) {
      console.error('[Logger] Read error:', e.message);
      return [];
    }
  },

  // Clear old logs
  clearOldLogs(olderThanMs = 86400000) {
    try {
      if (!fs.existsSync(LOG_FILE)) return 0;
      
      const cutoff = Date.now() - olderThanMs;
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      
      const recentLines = lines.filter(line => {
        try {
          const parsed = JSON.parse(line);
          return new Date(parsed.timestamp).getTime() > cutoff;
        } catch {
          return false;
        }
      });
      
      const deleted = lines.length - recentLines.length;
      fs.writeFileSync(LOG_FILE, recentLines.join('\n') + '\n');
      
      return deleted;
    } catch (e) {
      console.error('[Logger] Clear error:', e.message);
      return 0;
    }
  },
};

module.exports = logger;
