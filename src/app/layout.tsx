import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: {
    template: '%s | EduBridge AI',
    default: 'EduBridge AI - Your Hyper-Personalized AI Tutor',
  },
  description: "Experience an AI tutor that dynamically adapts to your exact school standard, language, and cognitive level. Learn faster with personalized roadmaps.",
  keywords: ["AI tutor", "personalized learning", "flashcards", "study roadmap", "education AI", "EduBridge"],
  authors: [{ name: "EduBridge Team" }],
  openGraph: {
    title: 'EduBridge AI',
    description: 'Hyper-personalized learning assistant that adapts to your cognitive level.',
    url: 'https://edubridge-ai-psi.vercel.app',
    siteName: 'EduBridge AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduBridge AI',
    description: 'Hyper-personalized learning assistant for students.',
  },
  verification: {
    google: "htTgGWah9NPYFZ94lnIUtK3QzAO-XbcVnfmOo-j09Zo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-slate-900 text-slate-50 selection:bg-blue-500/30 min-h-screen flex flex-col`}>
        <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
        {children}
      </body>
    </html>
  );
}
