"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function EditorPage() {
  return (
    <div className="relative h-screen w-screen bg-[#E5E6DA] text-[#1D1E15] font-mono">
      {/* Header with back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full bg-[#1D1E15] px-4 py-2 text-sm font-medium text-[#E5E6DA] hover:bg-[#1D1E15]/80 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Page content */}
      <div className="flex flex-col items-center justify-center h-full px-8">
        <h1 className="font-serif text-4xl md:text-5xl font-medium mb-16 text-center tracking-tight italic">AI Tools Used</h1>
        
        <div className="space-y-8 w-full max-w-md">
          {/* ChatGPT */}
          <div className="flex items-center justify-center gap-4">
            <Image 
              src="/openai2.png" 
              alt="ChatGPT Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-xl font-medium">ChatGPT</span>
          </div>

          {/* Gemini */}
          <div className="flex items-center justify-center gap-4">
            <Image 
              src="/gemini2.png" 
              alt="Gemini Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-xl font-medium">Gemini</span>
          </div>

          {/* Claude */}
          <div className="flex items-center justify-center gap-4">
            <Image 
              src="/claude.png" 
              alt="Claude Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-xl font-medium">Claude</span>
          </div>

          {/* Cursor */}
          <div className="flex items-center justify-center gap-4">
            <Image 
              src="/cursor.png" 
              alt="Cursor Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-xl font-medium">Cursor</span>
          </div>

          {/* DeepSeek */}
          <div className="flex items-center justify-center gap-4">
            <Image 
              src="/deepseek.png" 
              alt="DeepSeek Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              unoptimized
            />
            <span className="text-xl font-medium">DeepSeek</span>
          </div>
        </div>
      </div>
    </div>
  );
}
