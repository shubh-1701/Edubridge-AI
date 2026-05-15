"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, Download, Briefcase, ArrowLeft, Volume2, Mic, MicOff, HelpCircle, Play, Camera, X, PhoneCall, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import Flashcard from "./Flashcard";
import { saveData, loadData } from "@/lib/db";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCallMode, setIsCallMode] = useState(false);
  const isCallModeRef = useRef(false);
  const [profile, setProfile] = useState<{name: string, subject: string, level?: string, standard?: string, language?: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const initProfile = async () => {
      const userId = localStorage.getItem("edu_user_id");
      if (!userId) {
        router.push("/login");
        return;
      }

      const p = await loadData("edu_profile");
      if (p) {
        setProfile(p);
        
        const savedChats = await loadData("edu_chats");
        if (savedChats && Array.isArray(savedChats) && savedChats.length > 0) {
          setMessages(savedChats);
        } else {
          const standard = p.standard || p.level;
          const greetingLang = p.language === "Spanish" ? "Hola" : p.language === "French" ? "Bonjour" : p.language === "Hindi" ? "नमस्ते" : "Hi";
          setMessages([
            {
              role: "assistant",
              content: `${greetingLang} ${p.name}! I'm excited to help you learn **${p.subject}** for **${standard}**. \n\nWhat specific topic would you like to start with?`
            }
          ]);
        }
      } else {
        router.push("/onboarding");
      }
    };
    initProfile();

    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (isCallModeRef.current) {
          // If in call mode, handle it globally
          window.dispatchEvent(new CustomEvent('voice_call_transcript', { detail: transcript }));
        } else {
          setInput(prev => prev + (prev ? " " : "") + transcript);
        }
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    isCallModeRef.current = isCallMode;
    
    const handleVoiceCallTranscript = (e: any) => {
      const transcript = e.detail;
      if (transcript && transcript.trim()) {
        handleVoiceCallSubmit(transcript);
      }
    };

    window.addEventListener('voice_call_transcript', handleVoiceCallTranscript);
    return () => window.removeEventListener('voice_call_transcript', handleVoiceCallTranscript);
  }, [isCallMode, messages, profile]); // Depend on messages to send full history

  const handleVoiceCallSubmit = async (transcript: string) => {
    const userMessage: Message = { role: "user" as const, content: transcript };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], profile })
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        speakText(data.reply);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      saveData("edu_chats", messages);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (profile?.language) {
        const langMap: any = { "Spanish": "es-ES", "French": "fr-FR", "Hindi": "hi-IN", "English": "en-US" };
        recognitionRef.current.lang = langMap[profile.language] || "en-US";
      }
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        toast.error("Speech Recognition is not supported in this browser.");
      }
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const cleanText = text.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (profile?.language) {
        const langMap: any = { "Spanish": "es-ES", "French": "fr-FR", "Hindi": "hi-IN", "English": "en-US" };
        utterance.lang = langMap[profile.language] || "en-US";
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: React.FormEvent, customAction?: "career" | "quiz") => {
    if (e) e.preventDefault();
    if ((!input.trim() && !imagePreview && !customAction) || isLoading) return;

    let userMessageContent = input;
    if (customAction === "career") {
      userMessageContent = "How can I use this in my future career?";
    } else if (customAction === "quiz") {
      userMessageContent = "Quiz me on what we just learned!";
    }

    const userMessage: Message = { role: "user" as const, content: userMessageContent, imageUrl: imagePreview || undefined };
    setMessages(prev => [...prev, userMessage]);
    if (!customAction) {
      setInput("");
      setImagePreview(null);
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          profile,
          action: customAction 
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch response");
      }
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      
      if (!customAction) {
        const xpStr = await loadData("edu_xp");
        const currentXP = parseInt(xpStr || "0");
        await saveData("edu_xp", (currentXP + 10).toString());
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Oops! Something went wrong.";
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${errorMessage}\n\nPlease try asking again or checking your API key.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (typeof window === "undefined" || !chatContainerRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const element = chatContainerRef.current;
    const opt: any = {
      margin:       1,
      filename:     `${profile?.subject}_Notes.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const renderMessageContent = (content: string, isAssistant: boolean) => {
    if (isAssistant) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed[0]?.question && parsed[0]?.answer) {
          return (
            <div className="flex flex-col space-y-4 w-full min-w-[280px]">
              {parsed.map((card, idx) => (
                <Flashcard key={idx} question={card.question} answer={card.answer} />
              ))}
            </div>
          );
        }
      } catch(e) {
        // Not JSON, continue to normal render
      }
    }

    return (
      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700">
        <ReactMarkdown
          components={{
            a: ({node, ...props}) => {
              if (props.children?.toString().includes("Watch Video Tutorial")) {
                return (
                  <a {...props} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-xl no-underline transition-colors mt-2 shadow-lg shadow-red-900/20">
                    <Play className="w-4 h-4 mr-2" /> {props.children}
                  </a>
                );
              }
              return <a {...props} />;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-x border-slate-800 shadow-2xl relative">
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.push("/dashboard")} className="text-slate-400 hover:text-white mr-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-blue-500/20 p-2 rounded-lg hidden sm:block">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">EduBridge AI</h1>
            <p className="text-xs text-slate-400 hidden sm:block">{profile.subject} • {profile.standard || profile.level}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsCallMode(true)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors" title="Voice Call Mode">
            <PhoneCall className="w-4 h-4 md:mr-1.5" /> <span className="hidden md:inline">Call Tutor</span>
          </button>
          <button onClick={() => handleSubmit(undefined, "quiz")} className="text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors" title="Quiz Me">
            <HelpCircle className="w-4 h-4 md:mr-1.5" /> <span className="hidden md:inline">Quiz Me</span>
          </button>
          <button onClick={() => handleSubmit(undefined, "career")} className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors" title="Career Guidance">
            <Briefcase className="w-4 h-4 md:mr-1.5" /> <span className="hidden md:inline">Career</span>
          </button>
          <button onClick={downloadPDF} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors" title="Download PDF Notes">
            <Download className="w-4 h-4 md:mr-1.5" /> <span className="hidden md:inline">PDF</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6" id="chat-container" ref={chatContainerRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex space-x-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-blue-600" : "bg-slate-700"}`}>
                {msg.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-400" />}
              </div>
              <div className={`rounded-2xl px-5 py-4 relative group ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm shadow-sm"}`}>
                
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Uploaded" className="max-w-full h-auto rounded-xl mb-3 max-h-64 object-contain" />
                )}
                
                {renderMessageContent(msg.content, msg.role === "assistant")}

                {msg.role === "assistant" && (
                  <button 
                    onClick={() => speakText(msg.content)}
                    className="absolute -right-10 bottom-2 p-2 text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Read Aloud"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-slate-400 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col">
        {imagePreview && (
          <div className="mb-3 relative w-32 h-32 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg group">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={() => setImagePreview(null)} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors" type="button">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={e => handleSubmit(e)} className="flex items-end space-x-2 bg-slate-800 p-2 rounded-2xl border border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <label htmlFor="image-upload" className="p-3 rounded-xl transition-all cursor-pointer flex-shrink-0 mb-1 ml-1 bg-slate-700 text-slate-400 hover:text-white" title="Upload Image">
             <Camera className="w-5 h-5" />
          </label>
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-all flex-shrink-0 mb-1 ml-1 ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
            title="Voice Input"
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 outline-none text-slate-200"
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={(!input.trim() && !imagePreview) || isLoading}
            className="bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white p-3 rounded-xl transition-all hover:bg-blue-500 flex-shrink-0 mb-1 mr-1"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Full Screen Call UI */}
      <AnimatePresence>
        {isCallMode && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
            <div className="absolute top-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Live Call with EduBridge AI</h2>
              <p className="text-slate-400">Tap the microphone to speak.</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
              <div className="relative mb-12">
                {isLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-32 h-32 rounded-full border-4 border-dashed border-emerald-500 flex items-center justify-center">
                    <Bot className="w-16 h-16 text-emerald-400" />
                  </motion.div>
                ) : isListening ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500">
                    <Mic className="w-16 h-16 text-emerald-400" />
                  </motion.div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
                    <Bot className="w-16 h-16 text-slate-500" />
                  </div>
                )}
              </div>
              
              <div className="text-center min-h-[60px] text-lg text-slate-300 px-4">
                {isLoading ? "Thinking..." : isListening ? "Listening..." : "Tap below to talk"}
              </div>
            </div>

            <div className="absolute bottom-12 flex items-center justify-center w-full space-x-8">
              <button onClick={() => setIsCallMode(false)} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-xl transition-all hover:scale-105">
                <PhoneOff className="w-8 h-8" />
              </button>
              <button 
                onClick={toggleListening} 
                disabled={isLoading}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all ${isListening ? 'bg-emerald-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-500 hover:scale-105'}`}
              >
                {isListening ? <Mic className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
