import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get('audio');
  const apiKey = formData.get('apiKey');

  if (!apiKey || !(audio instanceof File) || !audio.size) {
    return NextResponse.json({ error: 'API key and valid audio file are required' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: apiKey as string });

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (error: unknown) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
