import { NextResponse } from 'next/server';
import redis from '@/lib/kv';

export const dynamic = 'force-dynamic';

const KNOWLEDGE_KEY = 'franky:knowledge';
const KNOWLEDGE_LIST_KEY = 'franky:knowledge:list';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  try {
    if (name) {
      // Return specific document
      const content = await redis.get(`${KNOWLEDGE_KEY}:${name}`);
      if (content) {
        return NextResponse.json({ name, content });
      }
      return NextResponse.json({ name, content: null, error: 'Document not found' });
    }

    // List all documents
    const docs = await redis.get(KNOWLEDGE_LIST_KEY) || [];
    return NextResponse.json({ docs });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ docs: [], error: 'Redis error' });
  }
}

export async function POST(request) {
  try {
    const { name, content } = await request.json();
    
    if (!name || !content) {
      return NextResponse.json({ error: 'name and content required' }, { status: 400 });
    }

    // Save the document content
    await redis.set(`${KNOWLEDGE_KEY}:${name}`, content);
    
    // Update the document list
    let docs = await redis.get(KNOWLEDGE_LIST_KEY) || [];
    const existingIndex = docs.findIndex(d => d.name === name);
    
    if (existingIndex >= 0) {
      docs[existingIndex].updatedAt = new Date().toISOString();
    } else {
      docs.push({
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    await redis.set(KNOWLEDGE_LIST_KEY, docs);
    
    return NextResponse.json({ success: true, name, message: 'Document saved' });
  } catch (e) {
    console.error('Redis error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    // Delete the document
    await redis.del(`${KNOWLEDGE_KEY}:${name}`);
    
    // Update the list
    let docs = await redis.get(KNOWLEDGE_LIST_KEY) || [];
    docs = docs.filter(d => d.name !== name);
    await redis.set(KNOWLEDGE_LIST_KEY, docs);
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
