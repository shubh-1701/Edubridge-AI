import { Sparkles, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl relative z-10 shadow-2xl flex flex-col items-center">
          <div className="bg-blue-500/10 p-4 rounded-2xl mb-4 relative overflow-hidden">
            <Sparkles className="w-8 h-8 text-blue-400 absolute opacity-30 animate-ping" />
            <Sparkles className="w-8 h-8 text-blue-400 relative z-10" />
          </div>
          <div className="flex items-center space-x-3 mt-2">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <h2 className="text-lg font-bold text-white tracking-wide font-heading">Loading...</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
