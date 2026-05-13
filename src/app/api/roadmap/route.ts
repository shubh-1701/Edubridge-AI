import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { profile } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Profile missing" }, { status: 400 });
    }

    const standard = profile.standard || profile.level;
    const systemPrompt = `You are EduBridge AI, an expert curriculum designer. The user is in ${standard} and studying ${profile.subject}. 
Generate a 5-step learning roadmap perfectly tailored for a student in ${standard}.
CRITICAL: You MUST respond ONLY with a raw JSON array. Do not include markdown code blocks (\`\`\`). Do not include any other text.
Format strictly as:
[
  { "step": 1, "title": "Step 1 Title", "description": "Short description of what to learn." },
  { "step": 2, "title": "Step 2 Title", "description": "Short description of what to learn." },
  { "step": 3, "title": "Step 3 Title", "description": "Short description of what to learn." },
  { "step": 4, "title": "Step 4 Title", "description": "Short description of what to learn." },
  { "step": 5, "title": "Step 5 Title", "description": "Short description of what to learn." }
]`;

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy_key') {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      return NextResponse.json({ 
        roadmap: [
          { step: 1, title: "Fundamentals", description: "Master the basic concepts." },
          { step: 2, title: "Core Principles", description: "Understand the underlying rules." },
          { step: 3, title: "Practical Application", description: "Apply what you know to simple problems." },
          { step: 4, title: "Advanced Topics", description: "Explore complex edge cases." },
          { step: 5, title: "Mastery Project", description: "Build a final project to prove your knowledge." }
        ] 
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 600,
    });

    let reply = chatCompletion.choices[0]?.message?.content || "[]";
    reply = reply.replace(/```json/gi, "").replace(/```/g, "").trim();

    const roadmap = JSON.parse(reply);

    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error("Roadmap API Error:", error);
    return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 });
  }
}
