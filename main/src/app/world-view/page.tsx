"use client";

import React from "react";
import Globe from "@/components/lightswind/globe";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WorldViewPage() {
  return (
    <div className="relative h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header with back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-foreground border border-border hover:bg-card transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
          Atlantic Ocean View
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag to explore vessel tracking
        </p>
      </div>

      {/* Globe Container */}
      <div className="flex-1 flex items-center justify-center">
        <Globe
          className="w-full h-full"
          theta={0.25}
          dark={0}
          scale={1.1}
          diffuse={1.2}
          mapSamples={60000}
          mapBrightness={10}
          baseColor="#6FB8F0"
          markerColor="#FF6B6B"
          glowColor="#6FB8F0"
        />
      </div>
    </div>
  );
}
