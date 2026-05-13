"use client";
import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  question: string;
  answer: string;
}

export default function Flashcard({ question, answer }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative w-full min-h-[12rem] cursor-pointer perspective-1000 my-4" onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div 
        className="w-full h-full absolute preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl border border-indigo-400 p-6 flex flex-col items-center justify-center text-center">
          <span className="text-indigo-200 text-xs font-bold tracking-widest uppercase mb-2">Flashcard</span>
          <p className="text-white font-medium text-lg leading-relaxed">{question}</p>
          <span className="text-white/50 text-xs absolute bottom-4">Click to flip</span>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden bg-slate-800 rounded-2xl shadow-xl border border-slate-600 p-6 flex flex-col items-center justify-center text-center rotate-y-180">
          <span className="text-green-400 text-xs font-bold tracking-widest uppercase mb-2">Answer</span>
          <p className="text-slate-200 font-medium leading-relaxed">{answer}</p>
          <span className="text-slate-500 text-xs absolute bottom-4">Click to flip back</span>
        </div>
      </motion.div>
    </div>
  );
}
