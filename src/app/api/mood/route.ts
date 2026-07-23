import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { Client } from 'pg';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

async function getDbClient() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text)
      return NextResponse.json(
        { error: 'Text input missing' },
        { status: 400 }
      );

    // 1. Ask Groq (Llama 3.1 8B) to analyze mood & pick matching hex colors freely
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analyzer. Analyze the emotional tone and energy of the user's input.
          Choose 2 background gradient hex colors that match the exact vibe, set a stress score (0 to 100), and write a short 1-phrase summary.
          
          Respond strictly in JSON format matching this schema:
          {
            "stress_level": 50,
            "primary_color": "#hex1",
            "secondary_color": "#hex2",
            "summary": "phrase description"
          }`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
    });

    const rawText = chatCompletion.choices[0]?.message?.content || '{}';
    const aiData = JSON.parse(rawText);

    // 2. Connect to local PostgreSQL DB and store log entry
    const db = await getDbClient();

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS mood_logs (
          id SERIAL PRIMARY KEY,
          raw_text TEXT,
          stress_level INT,
          color_one VARCHAR(7),
          color_two VARCHAR(7),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.query(
        'INSERT INTO mood_logs (raw_text, stress_level, color_one, color_two) VALUES ($1, $2, $3, $4)',
        [
          text,
          aiData.stress_level,
          aiData.primary_color,
          aiData.secondary_color,
        ]
      );
    } finally {
      await db.end();
    }

    return NextResponse.json(aiData);
  } catch (error: unknown) {
    console.error('API Error Details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'API execution error', details: errorMessage },
      { status: 500 }
    );
  }
}
