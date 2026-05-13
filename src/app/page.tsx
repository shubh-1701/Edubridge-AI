"use client";

import { motion } from "framer-motion";
import { Sparkles, BrainCircuit, Globe2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-blue-500/30 overflow-hidden relative w-full">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10 max-w-6xl">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-500/10 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-xl font-bold font-heading text-white tracking-tight">EduBridge</span>
        </div>
        <div>
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white mr-6 transition-colors">Sign In</Link>
          <Link href="/login" className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/25">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="container mx-auto px-6 pt-24 pb-32 relative z-10 text-center max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-white leading-tight mb-6">
            Hyper-Personalized Learning for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Every Student</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience an AI tutor that dynamically adapts to your exact school standard, language, and cognitive level. Learn faster with personalized roadmaps and interactive flashcards.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/login" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] flex items-center justify-center group">
              Start Learning Free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-sm">
            <BrainCircuit className="w-12 h-12 text-blue-400 mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">Adaptive Intelligence</h3>
            <p className="text-slate-400 leading-relaxed">The AI perfectly calibrates its vocabulary and analogies based on whether you are in Class 6 or College.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Globe2 className="w-32 h-32" /></div>
            <Globe2 className="w-12 h-12 text-emerald-400 mb-6 relative z-10" />
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">Native Multilingual</h3>
            <p className="text-slate-400 leading-relaxed relative z-10">Break down language barriers. Learn complex topics seamlessly in Hindi, Spanish, French, or English.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-sm">
            <Sparkles className="w-12 h-12 text-purple-400 mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">Visual Gamification</h3>
            <p className="text-slate-400 leading-relaxed">Earn XP, level up your rank, flip interactive flashcards, and follow personalized dynamic study roadmaps.</p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
