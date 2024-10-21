import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get('audio') as File;
  const apiKey = formData.get('apiKey') as string;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 1000 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 1500 });
  }
}
