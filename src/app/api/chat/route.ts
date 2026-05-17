import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

function buildSystemPrompt(profile: any, action: string, cognitiveState?: any) {
  const standard = profile.standard || profile.level;
  
  const complexity = `Adjust your vocabulary, sentence structure, and core concepts to perfectly match a student in ${standard}. Explain things using analogies appropriate for their age group. Avoid overly complex jargon unless it is part of the curriculum for ${standard}.`;

  const baseLanguage = profile.language || "English";
  
  const visualInstruction = `\n\nVISUAL LEARNING: Whenever you introduce a tangible or visual concept (e.g., a planet, an animal, a historical event, a machine), embed a relevant image. Format exactly like this: ![Image Description](https://image.pollinations.ai/prompt/{detailed-description}?width=800&height=400&nologo=true) . Replace {detailed-description} with URL-encoded keywords. Do not do this for abstract concepts.`;

  const videoInstruction = `\n\nMULTIMEDIA LEARNING: Whenever you explain a core, highly complex concept, embed a YouTube search link for them to watch a tutorial. Format exactly like this: [🎥 Watch Video Tutorial](https://www.youtube.com/results?search_query={URL-encoded-topic})`;

  let prompt = `You are EduBridge AI, a friendly, patient, and highly encouraging AI tutor specifically designed for underserved students. 
Your student's name is ${profile.name}. 
They are in ${standard} and learning ${profile.subject}.
`;

  if (cognitiveState) {
    prompt += `\nCRITICAL PEDAGOGICAL CONTEXT (COGNITIVE STATE):
- Current Complexity Tolerance: Level ${cognitiveState.complexityLevel || 5}/10
- Mastered Concepts: ${cognitiveState.masteredConcepts?.join(", ") || "None yet"}
- Struggling Concepts: ${cognitiveState.strugglingConcepts?.join(", ") || "None yet"}
- Estimated Learning Style: ${cognitiveState.learningStyle || "General"}
ADAPT your explanation strictly to this cognitive state. Bridge their specific struggling concepts using analogies related to their mastered concepts. Adjust vocabulary to match their complexity tolerance.\n\n`;
  }

  prompt += `CRITICAL REQUIREMENT: You MUST respond entirely in ${baseLanguage}.

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
  
  if (action === "analyze_state") {
    prompt = `You are an expert Educational Data Scientist analyzing a chat log between an AI Tutor and a student (${profile.name}, studying ${profile.subject}).
Analyze the provided recent chat history and determine the student's CURRENT cognitive state.
CRITICAL: You MUST respond ONLY with a raw JSON object. Do not include markdown blocks. Do not include any text outside the JSON.
Format exactly as:
{
  "complexityLevel": 5,
  "masteredConcepts": ["Concept 1", "Concept 2"],
  "strugglingConcepts": ["Concept 3"],
  "learningStyle": "Visual"
}
Rules:
- complexityLevel: Integer 1-10. Increase if they are answering well, decrease if struggling.
- masteredConcepts: Max 5 recent concepts they demonstrated understanding of.
- strugglingConcepts: Max 3 concepts they are currently confused about.
- learningStyle: e.g. Visual, Analytical, Practical, etc. based on what analogies worked.`;
  }

  return prompt;
}

export async function POST(req: Request) {
  try {
    const { messages, profile, action, cognitiveState } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Profile missing" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(profile, action, cognitiveState);
    
    const formattedMessages = messages.map((msg: any) => {
      if (msg.role === "user" && msg.imageUrl) {
        return {
          role: "user",
          content: [
            { type: "text", text: msg.content || "Analyze this image." },
            { type: "image_url", image_url: { url: msg.imageUrl } }
          ]
        };
      }
      return { role: msg.role, content: msg.content };
    });

    // For quiz and analyze_state, we don't pass the whole history to save tokens, just the last few messages for context.
    const apiMessages = (action === "quiz" || action === "analyze_state")
      ? [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-6)] 
      : [{ role: "system", content: systemPrompt }, ...formattedMessages];
    
    // Determine if we need the vision model
    const hasVision = messages.some((msg: any) => msg.imageUrl);

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy_key') {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      let mockReply = `That's a great question about **${profile.subject}**, ${profile.name}! `;
      
      if (action === "quiz") {
        return NextResponse.json({ reply: '[{"question": "What is the core concept we just discussed?", "answer": "The core concept."}, {"question": "How do you apply it?", "answer": "By practicing."}, {"question": "What is the next step?", "answer": "Mastery."}]' });
      }
      if (action === "analyze_state") {
        return NextResponse.json({ reply: '{"complexityLevel": 6, "masteredConcepts": ["Basic principles", "Foundations"], "strugglingConcepts": ["Advanced edge cases"], "learningStyle": "Visual & Practical"}' });
      }
      const std = profile.standard || profile.level || "";
      if (std.includes("6") || std.includes("7") || std.includes("Primary")) {
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
      model: hasVision ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.1-8b-instant",
      temperature: (action === "quiz" || action === "analyze_state") ? 0.2 : 0.7,
      max_tokens: action === "quiz" ? 500 : (action === "analyze_state" ? 400 : 1024),
    });

    let reply = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that right now.";
    
    // Clean up markdown block if Groq stubbornly adds it for JSON
    if (action === "quiz" || action === "analyze_state") {
      reply = reply.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process chat request";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
