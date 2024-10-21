import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { text, length, apiKey } = requestBody;

  // 入力チェック
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.error('Invalid input text:', text);
    return NextResponse.json({ error: 'Invalid input text' }, { status: 400 });
  }

  if (!apiKey || typeof apiKey !== 'string') {
    console.error('APIキーが設定されていません。');
    return NextResponse.json({ error: 'APIキーが設定されていません。' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  // 長さに応じたメッセージを生成
  let summaryInstruction = '';
  switch (length) {
    case 'short':
      summaryInstruction = '短く、簡潔に要約してください。';
      break;
    case 'medium':
      summaryInstruction = '中程度の長さで、要点を含めて要約してください。';
      break;
    case 'long':
      summaryInstruction = '詳細な要点も含めて、より長く要約してください。';
      break;
    default:
      console.error('Invalid length value:', length);
      return NextResponse.json({ error: 'Invalid length value' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `以下のテキストを箇条書きで重要なポイントを3つ挙げ、その後に${summaryInstruction}要約してください。` },
        { role: "user", content: text }
      ],
    });

    if (completion.choices && completion.choices.length > 0) {
      return NextResponse.json({ summary: completion.choices[0].message.content });
    } else {
      console.error('Unexpected response format:', completion);
      return NextResponse.json({ error: 'Unexpected response from OpenAI API' }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Summary generation error:', error,);
    return NextResponse.json({ error: 'Summary generation failed' }, { status: 500 });
  }
}
