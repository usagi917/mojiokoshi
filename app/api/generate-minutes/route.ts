import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { text, apiKey } = await request.json();
    
    if (!apiKey || typeof apiKey !== 'string') {
      console.error('APIキーが設定されていません。');
      return NextResponse.json({ error: 'APIキーが設定されていません。' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "以下のテキストから議事録を生成してください。" },
        { role: "user", content: text }
      ],
    });

    if (completion.choices && completion.choices.length > 0) {
      return NextResponse.json({ minutes: completion.choices[0].message.content });
    } else {
      console.error('Unexpected response format:', completion);
      return NextResponse.json({ error: 'Unexpected response from OpenAI API' }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Minutes generation error:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Minutes generation failed' }, { status: 500 });
  }
}