import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
}

// Log file path (same as server logger)
const LOG_FILE = path.join(process.cwd(), 'logs', 'server.log');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Check if log file exists
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ logs: [], message: 'No log file found' });
    }

    // Read log file
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);

    // Parse and filter logs
    const logs: LogEntry[] = [];
    
    for (let idx = 0; idx < lines.length; idx++) {
      try {
        const parsed = JSON.parse(lines[idx]);
        const entry: LogEntry = {
          id: String(idx),
          timestamp: new Date(parsed.timestamp).toLocaleString(),
          level: parsed.level as LogEntry['level'],
          message: parsed.message,
          stack: parsed.stack || undefined,
        };
        
        if (level === 'all' || entry.level === level) {
          logs.push(entry);
        }
      } catch {
        // Skip invalid JSON lines
      }
    }

    // Newest first, limited
    const result = logs.reverse().slice(0, limit);

    return NextResponse.json({ logs: result });
  } catch (error) {
    console.error('[Admin Logs] GET Error:', error);
    return NextResponse.json({ logs: [], error: 'Failed to read logs' });
  }
}

export async function POST(request: Request) {
  try {
    const { level, message, stack } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Ensure logs directory exists
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Append to log file
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level || 'info',
      message,
      stack: stack || null,
    });

    fs.appendFileSync(LOG_FILE, entry + '\n');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Logs] POST Error:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    // Read and filter logs older than 24h
    const cutoff = Date.now() - 86400000;
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
    fs.writeFileSync(LOG_FILE, recentLines.join('\n') + (recentLines.length ? '\n' : ''));

    return NextResponse.json({
      success: true,
      deleted,
      message: `Cleared ${deleted} old logs`,
    });
  } catch (error) {
    console.error('[Admin Logs] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
  }
}
