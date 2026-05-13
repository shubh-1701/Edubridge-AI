"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowRight, BookOpen, Sparkles, Globe } from "lucide-react";
import confetti from "canvas-confetti";
import { saveData } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [standard, setStandard] = useState("");
  const [language, setLanguage] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("edu_user_id")) {
      router.push("/login");
    }
  }, [router]);

  const handleComplete = async () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#a855f7', '#ffffff']
    });
    // We save standard instead of level now
    await saveData("edu_profile", { name, subject, level: standard, language, standard });
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 relative overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-md text-center">
            <div className="bg-blue-500/10 p-4 rounded-3xl inline-block mb-6">
              <Sparkles className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold font-heading mb-4">What should I call you?</h2>
            <input 
              type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-center text-xl focus:ring-2 focus:ring-blue-500 outline-none mb-8"
              onKeyDown={e => e.key === 'Enter' && name && setStep(2)}
            />
            <button onClick={() => setStep(2)} disabled={!name} className="bg-blue-600 disabled:bg-slate-700 text-white px-8 py-3.5 rounded-xl font-medium flex items-center justify-center mx-auto transition-all">
              Next <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-md">
            <div className="text-center mb-8">
              <GraduationCap className="w-10 h-10 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold font-heading mb-2">Which Standard are you in?</h2>
              <p className="text-slate-400">This helps us personalize your lessons.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'College'].map(std => (
                <button key={std} onClick={() => setStandard(std)} className={`w-full text-center px-4 py-3 rounded-xl border transition-all ${standard === std ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                  {std}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(3)} disabled={!standard} className="w-full bg-blue-600 disabled:bg-slate-700 text-white py-3.5 rounded-xl font-medium flex items-center justify-center transition-all">
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-md">
            <div className="text-center mb-8">
              <BookOpen className="w-10 h-10 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold font-heading mb-2">What do you want to learn?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography'].map(sub => (
                <button key={sub} onClick={() => setSubject(sub)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${subject === sub ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                  {sub}
                </button>
              ))}
            </div>
            <div className="mb-8">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">or enter your own</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>
              <input 
                type="text" 
                placeholder="e.g. Artificial Intelligence, Economics..." 
                value={!['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography'].includes(subject) ? subject : ""}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                onKeyDown={e => e.key === 'Enter' && subject && setStep(4)}
              />
            </div>
            <button onClick={() => setStep(4)} disabled={!subject} className="w-full bg-blue-600 disabled:bg-slate-700 text-white py-3.5 rounded-xl font-medium flex items-center justify-center transition-all">
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
            <div className="text-center mb-8">
              <Globe className="w-10 h-10 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold font-heading mb-2">Select Your Language</h2>
              <p className="text-slate-400">EduBridge adapts to you.</p>
            </div>
            <div className="space-y-3 mb-8">
              {['English', 'Spanish', 'French', 'Hindi'].map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)} className={`w-full text-left px-6 py-4 rounded-xl border transition-all ${language === lang ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                  {lang}
                </button>
              ))}
            </div>
            <button onClick={handleComplete} disabled={!language} className="w-full bg-emerald-600 disabled:bg-slate-700 text-white py-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg hover:shadow-emerald-500/25">
              Start Learning <Sparkles className="ml-2 w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
