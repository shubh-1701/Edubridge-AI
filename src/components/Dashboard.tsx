"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Flame, Trophy, Play, Settings, Star, LogOut, Trash2, Edit3, Map, CheckCircle2, Loader2, MessageSquare, Link } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { loadData, removeData } from "@/lib/db";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface RoadmapStep {
  step: number;
  title: string;
  description: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<{name: string, subject: string, level?: string, standard?: string, language?: string} | null>(null);
  const [xp, setXp] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initData = async () => {
      const userId = localStorage.getItem("edu_user_id");
      if (!userId) {
        router.push("/login");
        return;
      }
      
      const p = await loadData("edu_profile");
      if (p) {
        setProfile(p);
        fetchRoadmap(p);
      } else {
        router.push("/onboarding");
      }
      
      const storedXp = await loadData("edu_xp");
      setXp(parseInt(storedXp || "0"));
    };
    initData();

    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRoadmap = async (userProfile: any) => {
    const cacheKey = `edu_roadmap_${userProfile.subject}`;
    const cached = await loadData(cacheKey);
    if (cached) {
      setRoadmap(cached);
      return;
    }
    
    setIsLoadingRoadmap(true);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: userProfile })
      });
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        // We use localStorage directly here for the cache to avoid uploading this to Firebase
        // since it can just be re-generated, but using saveData is fine too.
        localStorage.setItem(cacheKey, JSON.stringify(data.roadmap));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  if (!profile) return null;

  let rank = "Novice";
  let nextGoal = 50;
  if (xp >= 100) {
    rank = "Master";
    nextGoal = 500;
  } else if (xp >= 50) {
    rank = "Scholar";
    nextGoal = 100;
  }
  
  const progressPercent = Math.min(100, Math.round((xp / nextGoal) * 100));

  const handleAction = async (action: "clear_chat" | "edit_profile" | "logout" | "send_feedback" | "link_class") => {
    if (action === "clear_chat") {
      if (confirm("Are you sure you want to clear your chat history?")) {
        await removeData("edu_chats");
        toast.success("Chat history cleared!");
      }
    } else if (action === "send_feedback") {
      const feedback = window.prompt("We'd love to hear your thoughts! What can we improve?");
      if (feedback && feedback.trim()) {
        try {
          const { db } = await import("@/lib/firebase");
          if (db) {
            const { collection, addDoc } = await import("firebase/firestore");
            await addDoc(collection(db, "feedback"), {
              userId: localStorage.getItem("edu_user_id") || "anonymous",
              name: profile?.name || "Unknown",
              feedback: feedback.trim(),
              timestamp: new Date().toISOString()
            });
            toast.success("Thank you for your feedback! 🚀");
          } else {
            toast.success("Thank you for your feedback! (Saved locally)");
          }
        } catch (e) {
          console.error("Feedback error:", e);
          toast.error("Failed to send feedback.");
        }
      }
    } else if (action === "link_class") {
      const code = window.prompt("Enter your teacher's 6-character Class Code:");
      if (code && code.trim()) {
        try {
          const { db } = await import("@/lib/firebase");
          if (db) {
            const { doc, setDoc } = await import("firebase/firestore");
            const userId = localStorage.getItem("edu_user_id");
            if (userId) {
              await setDoc(doc(db, "users", userId), { 
                classCode: code.trim().toUpperCase(),
                xp: xp,
                name: profile?.name,
                subject: profile?.subject,
                standard: profile?.standard || profile?.level
              }, { merge: true });
              toast.success("Successfully linked to class!");
            }
          }
        } catch(e) {
          toast.error("Failed to link class.");
        }
      }
    } else if (action === "edit_profile") {
      if (confirm("This will reset your learning profile but keep your XP. Continue?")) {
        await removeData("edu_profile");
        window.location.reload();
      }
    } else if (action === "logout") {
      if (confirm("Are you sure you want to log out completely?")) {
        await removeData("edu_profile");
        localStorage.removeItem("edu_auth_token");
        await removeData("edu_chats");
        await removeData("edu_xp");
        router.push("/login");
      }
    }
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-x border-slate-800 shadow-2xl overflow-y-auto">
      <header className="px-8 py-6 border-b border-slate-800 bg-slate-900 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold font-heading">Welcome back, {profile.name}!</h1>
          <p className="text-slate-400">Ready to master {profile.subject}?</p>
        </div>
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`p-2 rounded-xl transition-colors ${showSettings ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'}`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="flex flex-col">
                  <button onClick={() => handleAction("edit_profile")} className="flex items-center px-4 py-3 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-left text-sm border-b border-slate-700/50">
                    <Edit3 className="w-4 h-4 mr-3 text-blue-400" /> Edit Profile
                  </button>
                  <button onClick={() => handleAction("link_class")} className="flex items-center px-4 py-3 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-left text-sm border-b border-slate-700/50">
                    <Link className="w-4 h-4 mr-3 text-indigo-400" /> Join Class
                  </button>
                  <button onClick={() => handleAction("clear_chat")} className="flex items-center px-4 py-3 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-left text-sm border-b border-slate-700/50">
                    <Trash2 className="w-4 h-4 mr-3 text-orange-400" /> Clear Chat History
                  </button>
                  <button onClick={() => handleAction("send_feedback")} className="flex items-center px-4 py-3 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-left text-sm border-b border-slate-700/50">
                    <MessageSquare className="w-4 h-4 mr-3 text-emerald-400" /> Send Feedback
                  </button>
                  <button onClick={() => handleAction("logout")} className="flex items-center px-4 py-3 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-left text-sm">
                    <LogOut className="w-4 h-4 mr-3" /> Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="p-8 space-y-8 flex-1">
        {/* Gamification Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-slate-800 border border-slate-700 p-6 rounded-3xl"
        >
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Current Rank</p>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center">
                <Star className="w-6 h-6 mr-2 text-purple-400" /> {rank}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{xp}</span>
              <span className="text-slate-400 text-sm ml-1">XP</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-900 rounded-full h-3 mb-2 overflow-hidden border border-slate-700">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} 
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
            />
          </div>
          <p className="text-xs text-right text-slate-500">{Math.max(0, nextGoal - xp)} XP to next rank</p>
        </motion.div>

        {/* Study Roadmap */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-3xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-emerald-500/20 p-2 rounded-xl">
              <Map className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Your Learning Roadmap</h3>
          </div>
          
          {isLoadingRoadmap ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="ml-3 text-slate-400 text-sm">Generating your personalized path...</span>
            </div>
          ) : roadmap.length > 0 ? (
            <div className="relative border-l-2 border-slate-700 ml-4 space-y-6">
              {roadmap.map((step, index) => {
                const isCompleted = xp >= (index + 1) * 30; // Mock progression based on XP
                return (
                  <div key={index} className="relative pl-6">
                    <div className={`absolute -left-[11px] top-1 rounded-full p-0.5 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <h4 className={`font-bold text-sm mb-1 ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>Step {step.step}: {step.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">Unable to load roadmap.</p>
          )}
        </motion.div>

        {/* Current Focus */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="bg-slate-800 border border-slate-700 p-8 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BookOpen className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <h2 className="text-lg text-slate-400 font-medium mb-1">Current Subject</h2>
            <h3 className="text-4xl font-bold text-white mb-6">{profile.subject}</h3>
            
            <div className="flex items-center space-x-4">
              <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">{profile.language || 'English'}</span>
              <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">{profile.standard || profile.level}</span>
            </div>

            <button 
              onClick={() => router.push("/chat")}
              className="mt-8 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-medium transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center group w-full justify-center"
            >
              Resume Learning <Play className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform fill-current" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
