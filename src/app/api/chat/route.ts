import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

function buildSystemPrompt(profile: any, action: string) {
  const standard = profile.standard || profile.level;
  
  const complexity = `Adjust your vocabulary, sentence structure, and core concepts to perfectly match a student in ${standard}. Explain things using analogies appropriate for their age group. Avoid overly complex jargon unless it is part of the curriculum for ${standard}.`;

  const baseLanguage = profile.language || "English";
  
  const visualInstruction = `\n\nVISUAL LEARNING: Whenever you introduce a tangible or visual concept (e.g., a planet, an animal, a historical event, a machine), embed a relevant image. Format exactly like this: ![Image Description](https://image.pollinations.ai/prompt/{detailed-description}?width=800&height=400&nologo=true) . Replace {detailed-description} with URL-encoded keywords. Do not do this for abstract concepts.`;

  const videoInstruction = `\n\nMULTIMEDIA LEARNING: Whenever you explain a core, highly complex concept, embed a YouTube search link for them to watch a tutorial. Format exactly like this: [🎥 Watch Video Tutorial](https://www.youtube.com/results?search_query={URL-encoded-topic})`;

  let prompt = `You are EduBridge AI, a friendly, patient, and highly encouraging AI tutor specifically designed for underserved students. 
Your student's name is ${profile.name}. 
They are in ${standard} and learning ${profile.subject}.

CRITICAL REQUIREMENT: You MUST respond entirely in ${baseLanguage}.

CORE INSTRUCTIONS:
1. ${complexity}
2. BE ENCOURAGING: Always validate their effort and use a warm, supportive tone.
3. NEVER be judgmental.
4. BE CONCISE: Do not output massive walls of text. Break down explanations into small, digestible chunks.
5. AFTER EXPLAINING a new concept, ALWAYS ask 1 or 2 short, simple questions (a mini-quiz) to check their understanding before moving on.
6. If they struggle with the quiz, gently correct them and try explaining it in a slightly different, simpler way.
7. Use Markdown for formatting (bolding key terms, using bullet points, etc).${visualInstruction}${videoInstruction}`;

  if (action === "career") {
    prompt += `\n\nSPECIAL REQUEST: The user just asked for CAREER GUIDANCE. Please ignore normal tutoring for this response and instead:
    - Suggest 3 real-world, accessible career paths related to ${profile.subject}.
    - Explain simply how what they are learning applies to these jobs.
    - End with a highly motivating statement.`;
  }
  
  if (action === "quiz") {
    prompt = `You are EduBridge AI. Generate a 3-question flashcard quiz based on the user's recent chat history about ${profile.subject}. 
CRITICAL: You MUST respond ONLY with a raw JSON array. Do not include markdown code blocks (\`\`\`). Do not include any other text.
Format strictly as:
[
  { "question": "Question 1 here?", "answer": "Answer 1 here." },
  { "question": "Question 2 here?", "answer": "Answer 2 here." },
  { "question": "Question 3 here?", "answer": "Answer 3 here." }
]`;
  }

  return prompt;
}

export async function POST(req: Request) {
  try {
    const { messages, profile, action } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Profile missing" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(profile, action);
    
    // For quiz action, we don't pass the whole history to save tokens, just the last few messages for context.
    const apiMessages = action === "quiz" 
      ? [{ role: "system", content: systemPrompt }, ...messages.slice(-4)] 
      : [{ role: "system", content: systemPrompt }, ...messages];

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy_key') {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      let mockReply = `That's a great question about **${profile.subject}**, ${profile.name}! `;
      
      if (action === "quiz") {
        return NextResponse.json({ reply: '[{"question": "What is the core concept we just discussed?", "answer": "The core concept."}, {"question": "How do you apply it?", "answer": "By practicing."}, {"question": "What is the next step?", "answer": "Mastery."}]' });
      }

      if (standard.includes("6") || standard.includes("7") || standard.includes("Primary")) {
         mockReply += "\n\nThink of it like this: it's like learning to ride a bike. \n\n![Bike](https://image.pollinations.ai/prompt/bicycle?width=800&height=400&nologo=true)\n\n[🎥 Watch Video Tutorial](https://www.youtube.com/results?search_query=how+to+ride+a+bike)";
      } else {
         mockReply += "\n\nLet's dive deeper into that. Here is a step-by-step breakdown...\n\n[🎥 Watch Video Tutorial](https://www.youtube.com/results?search_query=advanced+topics)";
      }

      if (action === "career") {
        mockReply = `Here are 3 great careers using **${profile.subject}**:\n1. **Teacher:** Share your knowledge.\n2. **Analyst:** Use facts to make decisions.\n3. **Engineer:** Build the future.\n\nYou have what it takes!`;
      }

      return NextResponse.json({ reply: mockReply });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
      messages: apiMessages as any,
      model: "llama-3.1-8b-instant",
      temperature: action === "quiz" ? 0.2 : 0.7,
      max_tokens: action === "quiz" ? 500 : 1024,
    });

    let reply = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that right now.";
    
    // Clean up markdown block if Groq stubbornly adds it for JSON
    if (action === "quiz") {
      reply = reply.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process chat request";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
