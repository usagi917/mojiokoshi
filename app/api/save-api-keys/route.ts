import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { openAIKey, geminiKey } = await request.json();

  // 環境変数の設定（本番環境では適切な方法で保存してください）
  process.env.OPENAI_API_KEY = openAIKey;
  process.env.GEMINI_API_KEY = geminiKey;

  return NextResponse.json({ message: 'APIキーが保存されました' });
}