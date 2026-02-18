import { NextResponse } from 'next/server';
import redis from '@/lib/kv';

export const dynamic = 'force-dynamic';

const MEMORY_KEY = 'franky:memory';

// Default structure if nothing synced yet
const DEFAULT_FILES = ['MEMORY.md', 'SOUL.md', 'AGENTS.md', 'USER.md', 'FRANKY-RULES.md', 'HEARTBEAT.md'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  try {
    let memoryCache = await redis.get(MEMORY_KEY) || {};

    if (file) {
      // Return specific file content
      const content = memoryCache[file];
      if (content) {
        return NextResponse.json({ file, content });
      }
      return NextResponse.json({ file, content: `[File "${file}" not synced yet. Run sync from local machine.]` });
    }

    // List all synced files
    const files = Object.keys(memoryCache);
    if (files.length === 0) {
      return NextResponse.json({ 
        files: DEFAULT_FILES,
        note: 'No files synced yet. Memory files need to be pushed from local machine.'
      });
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ files: DEFAULT_FILES, error: 'Redis error' });
  }
}

// POST to sync/update files
export async function POST(request) {
  try {
    const body = await request.json();
    let memoryCache = await redis.get(MEMORY_KEY) || {};
    
    if (body.files && typeof body.files === 'object') {
      // Bulk sync multiple files
      for (const [filename, content] of Object.entries(body.files)) {
        memoryCache[filename] = content;
      }
      await redis.set(MEMORY_KEY, memoryCache);
      return NextResponse.json({ success: true, synced: Object.keys(body.files) });
    }
    
    if (body.file && body.content) {
      // Single file sync
      memoryCache[body.file] = body.content;
      await redis.set(MEMORY_KEY, memoryCache);
      return NextResponse.json({ success: true, synced: [body.file] });
    }
    
    return NextResponse.json({ error: 'Invalid request. Send {file, content} or {files: {name: content}}' }, { status: 400 });
  } catch (e) {
    console.error('Redis error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT to update a single file (for editing from dashboard)
export async function PUT(request) {
  try {
    const { file, content } = await request.json();
    if (!file || content === undefined) {
      return NextResponse.json({ error: 'file and content required' }, { status: 400 });
    }
    
    let memoryCache = await redis.get(MEMORY_KEY) || {};
    memoryCache[file] = content;
    await redis.set(MEMORY_KEY, memoryCache);
    
    return NextResponse.json({ success: true, updated: file });
  } catch (e) {
    console.error('Redis error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
