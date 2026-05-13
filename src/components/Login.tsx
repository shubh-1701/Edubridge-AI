"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Sparkles, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);

    try {
      if (auth) {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
        localStorage.setItem("edu_user_id", auth.currentUser?.uid || email);
      } else {
        // Fallback Mock Login
        await new Promise(resolve => setTimeout(resolve, 1000));
        localStorage.setItem("edu_user_id", email);
      }

      localStorage.setItem("edu_auth_token", "mock_token_" + Date.now());
      toast.success("Successfully authenticated!");
      
      const hasProfile = !!localStorage.getItem("edu_profile");
      if (hasProfile) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center mb-8 relative z-10">
          <div className="bg-blue-500/10 p-3 rounded-2xl inline-block mb-4">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold font-heading mb-2">EduBridge AI</h1>
          <p className="text-slate-400">Welcome back! Please sign in to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 disabled:bg-blue-600/50 text-white py-3.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] flex items-center justify-center mt-6"
          >
            {isLoading ? (
              <span className="flex items-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Authenticating...</span>
            ) : isLogin ? (
              <span className="flex items-center"><LogIn className="w-5 h-5 mr-2" /> Sign In</span>
            ) : (
              <span className="flex items-center"><UserPlus className="w-5 h-5 mr-2" /> Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
