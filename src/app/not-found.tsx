"use client";

import Link from "next/link";
import { SearchX, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 text-center max-w-md">
        <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-3xl inline-block mb-8 shadow-2xl backdrop-blur-sm">
          <SearchX className="w-16 h-16 text-blue-400" />
        </div>
        
        <h1 className="text-5xl font-bold font-heading text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-200 mb-4">Page Not Found</h2>
        
        <p className="text-slate-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl font-medium flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 group"
          >
            <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-8 py-3.5 rounded-2xl font-medium flex items-center justify-center transition-all group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
