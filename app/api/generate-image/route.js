import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // TODO: Integrate with Gemini API for actual image generation
    // For now, return a placeholder message
    return NextResponse.json({
      message: 'Image generation coming soon - use Franky directly for now',
      prompt: prompt
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
