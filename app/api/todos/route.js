import { NextResponse } from 'next/server';
import redis from '@/lib/kv';

export const dynamic = 'force-dynamic';

const TODOS_KEY = 'franky:todos';

export async function GET() {
  try {
    let todos = await redis.get(TODOS_KEY) || [];
    return NextResponse.json({ todos });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ todos: [], error: error.message });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    let todos = await redis.get(TODOS_KEY) || [];
    
    // Add new todo
    if (body.text) {
      const newTodo = {
        id: Date.now().toString(),
        text: body.text,
        completed: false,
        priority: body.priority || 'normal',
        createdAt: new Date().toISOString(),
        dueDate: body.dueDate || null,
        assignedAgent: body.assignedAgent || null
      };
      todos.unshift(newTodo); // Add to top
      await redis.set(TODOS_KEY, todos);
      return NextResponse.json({ success: true, todo: newTodo });
    }
    
    // Bulk replace
    if (body.todos && Array.isArray(body.todos)) {
      await redis.set(TODOS_KEY, body.todos);
      return NextResponse.json({ success: true, todos: body.todos });
    }
    
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    
    let todos = await redis.get(TODOS_KEY) || [];
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    
    todos[index] = { ...todos[index], ...updates };
    if (updates.completed) {
      todos[index].completedAt = new Date().toISOString();
    }
    
    await redis.set(TODOS_KEY, todos);
    return NextResponse.json({ success: true, todo: todos[index] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    
    let todos = await redis.get(TODOS_KEY) || [];
    todos = todos.filter(t => t.id !== id);
    await redis.set(TODOS_KEY, todos);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
