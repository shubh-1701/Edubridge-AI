import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "EduBridge AI",
  description: "Hyper-personalized learning assistant",
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
