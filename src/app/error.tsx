"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Caught by global error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-800 border border-red-500/30 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="bg-red-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Something went wrong!</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all shadow-lg"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Try again
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all"
          >
            <Home className="w-4 h-4 mr-2" /> Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
