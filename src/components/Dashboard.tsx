"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, Settings, Star, LogOut, Trash2, Edit3, Map, CheckCircle2, Loader2, MessageSquare, Link, Video, X, Users } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { loadData, removeData, saveData } from "@/lib/db";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface RoadmapStep {
  step: number;
  title: string;
  description: string;
}

interface CognitiveState {
  complexityLevel: number;
  masteredConcepts: string[];
  strugglingConcepts: string[];
  learningStyle: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<{name: string, subject: string, level?: string, standard?: string, language?: string} | null>(null);
  const [xp, setXp] = useState(0);
  const [cognitiveState, setCognitiveState] = useState<CognitiveState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [liveMeetingLink, setLiveMeetingLink] = useState<string | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
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
        if (p.subject) fetchRoadmap(p);
      } else {
        router.push("/onboarding");
      }
      
      const storedCustoms = await loadData("edu_custom_subjects");
      if (storedCustoms) setCustomSubjects(JSON.parse(storedCustoms));

      if (p && p.subject) {
        const storedXp = await loadData(`edu_xp_${p.subject}`);
        setXp(parseInt(storedXp || "0"));
        
        const cs = await loadData(`edu_cognitive_${p.subject}`);
        if (cs) setCognitiveState(cs);
      } else {
        setXp(0);
      }
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

  // Listen to Teacher Live Status
  useEffect(() => {
    let unsubscribe: any;
    
    const listenToTeacher = async (code: string) => {
      try {
        const { db } = await import("@/lib/firebase");
        if (db) {
          const { collection, query, where, onSnapshot } = await import("firebase/firestore");
          const q = query(collection(db, "users"), where("classCode", "==", code), where("role", "==", "teacher"));
          
          unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              const teacherDoc = snapshot.docs[0].data();
              // Only show the live button if the teacher is actually live AND their subject matches the student's current dashboard subject
              if (teacherDoc.isLive && teacherDoc.subject === profile?.subject) {
                setLiveMeetingLink(teacherDoc.meetingLink || null);
              } else {
                setLiveMeetingLink(null);
              }
            } else {
              setLiveMeetingLink(null);
            }
          });
        }
      } catch (e) {
        console.error("Failed to listen to teacher", e);
      }
    };

    if (profile && (profile as any).classCode) {
      listenToTeacher((profile as any).classCode);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [profile]);

  // Listen for available teachers for current subject
  useEffect(() => {
    if (!profile?.subject) {
      setAvailableTeachers([]);
      return;
    }
    
    let unsubscribe: any;
    const fetchTeachers = async () => {
      try {
        const { db } = await import("@/lib/firebase");
        if (db) {
          const { collection, query, where, onSnapshot } = await import("firebase/firestore");
          const q = query(
            collection(db, "users"), 
            where("role", "==", "teacher"),
            where("subject", "==", profile.subject)
          );
          
          unsubscribe = onSnapshot(q, (snapshot) => {
            const teachers: any[] = [];
            snapshot.forEach((doc) => {
              teachers.push({ id: doc.id, ...doc.data() });
            });
            setAvailableTeachers(teachers);
          });
        }
      } catch (e) {
        console.error("Failed to fetch available teachers", e);
      }
    };
    fetchTeachers();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [profile?.subject]);

  const connectWithTeacher = async (teacher: any) => {
    if (!teacher.classCode) {
      toast.error("This teacher has not generated a class code yet.");
      return;
    }
    try {
      const { db } = await import("@/lib/firebase");
      if (db) {
        const { doc, setDoc } = await import("firebase/firestore");
        const userId = localStorage.getItem("edu_user_id");
        if (userId) {
          await setDoc(doc(db, "users", userId), { classCode: teacher.classCode }, { merge: true });
          const newProfile = { ...profile, classCode: teacher.classCode };
          setProfile(newProfile as any);
          await saveData("edu_profile", newProfile);
          toast.success(`Successfully connected with ${teacher.name}!`);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect with teacher.");
    }
  };

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
      if (confirm("Are you sure you want to clear your chat history for all subjects?")) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("edu_chats_")) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        toast.success("Chat history cleared for all subjects!");
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
              
              setProfile(prev => prev ? { ...prev, classCode: code.trim().toUpperCase() } : null);
              const p = await loadData("edu_profile");
              if (p) await saveData("edu_profile", { ...p, classCode: code.trim().toUpperCase() });
              
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
        
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("edu_chats_") || key.startsWith("edu_xp_") || key.startsWith("edu_roadmap_") || key === "edu_custom_subjects")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        
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

        {/* Cognitive Profile */}
        {cognitiveState && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-slate-800 border border-slate-700 p-6 rounded-3xl"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-emerald-500/20 p-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white flex items-center">
                Cognitive Profile
                <span className="ml-3 text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded-full border border-slate-600 font-medium">Live Syncing</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                <p className="text-xs text-slate-400 font-medium mb-1">Complexity Tolerance</p>
                <div className="text-xl font-bold text-emerald-400">Level {cognitiveState.complexityLevel}<span className="text-sm text-slate-500">/10</span></div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                <p className="text-xs text-slate-400 font-medium mb-1">Learning Style</p>
                <div className="text-sm font-bold text-blue-400 mt-1">{cognitiveState.learningStyle || "Adaptive"}</div>
              </div>
            </div>
            
            {cognitiveState.masteredConcepts?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-400 font-medium mb-2">Recently Mastered</p>
                <div className="flex flex-wrap gap-2">
                  {cognitiveState.masteredConcepts.map((c, i) => (
                    <span key={i} className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">{c}</span>
                  ))}
                </div>
              </div>
            )}
            
            {cognitiveState.strugglingConcepts?.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">Focus Areas</p>
                <div className="flex flex-wrap gap-2">
                  {cognitiveState.strugglingConcepts.map((c, i) => (
                    <span key={i} className="text-xs bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-lg border border-orange-500/20">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

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
            
            <div className="relative inline-block mb-6">
              <select 
                value={profile.subject || ""} 
                onChange={async (e) => {
                  let newSubject = e.target.value;
                  if (!newSubject) return;

                  if (newSubject === "__custom__") {
                    const custom = window.prompt("Enter your custom subject (e.g. Astrophysics):");
                    if (!custom || !custom.trim()) return;
                    newSubject = custom.trim();
                    const updatedCustoms = [...customSubjects, newSubject];
                    setCustomSubjects(updatedCustoms);
                    await saveData("edu_custom_subjects", JSON.stringify(updatedCustoms));
                  }
                  
                  // Update local state
                  setProfile(prev => prev ? { ...prev, subject: newSubject } : null);
                  
                  // Update XP
                  const storedXp = await loadData(`edu_xp_${newSubject}`);
                  setXp(parseInt(storedXp || "0"));
                  
                  // Update localStorage
                  const p = await loadData("edu_profile");
                  if (p) await saveData("edu_profile", { ...p, subject: newSubject });
                  
                  // Update Firestore
                  try {
                    const { db } = await import("@/lib/firebase");
                    if (db) {
                      const { doc, setDoc } = await import("firebase/firestore");
                      const userId = localStorage.getItem("edu_user_id");
                      if (userId) {
                        await setDoc(doc(db, "users", userId), { subject: newSubject }, { merge: true });
                      }
                    }
                  } catch(err) { console.error(err) }
                  
                  // Refetch Roadmap
                  fetchRoadmap({ ...profile, subject: newSubject });
                }}
                className="bg-transparent text-4xl font-bold text-white focus:outline-none appearance-none cursor-pointer border-b-2 border-transparent hover:border-slate-600 transition-colors pb-1 pr-8 max-w-[280px] sm:max-w-md truncate"
              >
                <option value="" disabled className="text-lg bg-slate-800">Select a Subject</option>
                {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', ...customSubjects].map(sub => (
                  <option key={sub} value={sub} className="text-lg bg-slate-800">{sub}</option>
                ))}
                <option value="__custom__" className="text-lg bg-slate-800 text-blue-400 font-bold">+ Add Custom Subject</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 pb-1">
                ▼
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">{profile.language || 'English'}</span>
              <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">{profile.standard || profile.level}</span>
            </div>

            <div className="flex flex-col space-y-4 mt-8 w-full">
              {liveMeetingLink && (
                <a 
                  href={liveMeetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-500 animate-pulse text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] flex items-center justify-center group w-full no-underline"
                >
                  Join Live Video Class <Video className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              )}
              
              <button 
                onClick={() => profile.subject ? router.push("/chat") : toast.error("Please select a subject first.")}
                className={`px-8 py-4 rounded-2xl font-medium transition-all flex items-center group w-full justify-center ${profile.subject ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
              >
                {profile.subject ? `Resume ${profile.subject} Chat` : "Select Subject"} <Play className={`ml-2 w-5 h-5 ${profile.subject ? 'group-hover:translate-x-1' : ''} transition-transform fill-current`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Available Teachers */}
        {profile?.subject && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-slate-800 border border-slate-700 p-8 rounded-3xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-500/20 p-2 rounded-xl">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Available {profile.subject} Teachers</h3>
            </div>
            
            {availableTeachers.length === 0 ? (
              <p className="text-slate-500 text-sm italic">No teachers are currently available for {profile.subject}.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTeachers.map((teacher, i) => {
                  const isConnected = (profile as any).classCode === teacher.classCode;
                  return (
                    <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white">
                            {teacher.name?.charAt(0).toUpperCase() || "T"}
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{teacher.name || "Unknown Teacher"}</h4>
                            <div className="flex items-center mt-1">
                              <div className={`w-2 h-2 rounded-full mr-2 ${teacher.isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                              <span className="text-xs text-slate-400">{teacher.isLive ? 'Live Now' : 'Offline'}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 mb-4 line-clamp-2">{teacher.language ? `Speaks ${teacher.language}` : 'Ready to teach'}</p>
                      </div>
                      <button 
                        onClick={() => !isConnected && connectWithTeacher(teacher)}
                        disabled={isConnected}
                        className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${isConnected ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                      >
                        {isConnected ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
