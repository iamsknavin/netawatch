"use client";

import Link from "next/link";
import { useState } from "react";
import { stateToSlug } from "@/lib/utils";

interface StateData {
  name: string;
  d: string;
}

// Simplified Indian state SVG paths (approximate, good for click targets)
const STATES: StateData[] = [
  { name: "Jammu & Kashmir", d: "M 145 45 L 175 35 L 195 50 L 180 75 L 155 70 Z" },
  { name: "Himachal Pradesh", d: "M 165 75 L 185 70 L 195 90 L 175 100 Z" },
  { name: "Punjab", d: "M 140 80 L 165 75 L 170 95 L 148 100 Z" },
  { name: "Haryana", d: "M 155 100 L 175 95 L 178 115 L 158 118 Z" },
  { name: "Delhi", d: "M 163 112 L 172 110 L 173 118 L 164 120 Z" },
  { name: "Uttarakhand", d: "M 180 90 L 205 85 L 210 105 L 185 110 Z" },
  { name: "Uttar Pradesh", d: "M 175 110 L 240 100 L 250 140 L 180 148 Z" },
  { name: "Rajasthan", d: "M 120 110 L 168 112 L 170 175 L 115 178 Z" },
  { name: "Gujarat", d: "M 100 165 L 145 168 L 148 215 L 95 220 Z" },
  { name: "Madhya Pradesh", d: "M 148 155 L 230 148 L 235 200 L 145 205 Z" },
  { name: "Bihar", d: "M 240 115 L 280 108 L 285 145 L 242 148 Z" },
  { name: "Jharkhand", d: "M 248 148 L 290 145 L 288 178 L 248 180 Z" },
  { name: "West Bengal", d: "M 285 118 L 315 110 L 320 178 L 288 180 Z" },
  { name: "Odisha", d: "M 258 178 L 295 178 L 300 220 L 255 225 Z" },
  { name: "Chhattisgarh", d: "M 220 178 L 258 178 L 260 225 L 218 228 Z" },
  { name: "Maharashtra", d: "M 145 205 L 235 200 L 240 255 L 142 258 Z" },
  { name: "Telangana", d: "M 185 250 L 238 250 L 240 285 L 185 288 Z" },
  { name: "Andhra Pradesh", d: "M 190 285 L 260 278 L 268 330 L 188 335 Z" },
  { name: "Karnataka", d: "M 148 258 L 195 255 L 198 315 L 145 320 Z" },
  { name: "Goa", d: "M 140 302 L 155 300 L 157 315 L 142 318 Z" },
  { name: "Kerala", d: "M 158 315 L 178 312 L 182 370 L 158 375 Z" },
  { name: "Tamil Nadu", d: "M 178 315 L 240 320 L 235 385 L 175 388 Z" },
  { name: "Assam", d: "M 318 115 L 360 108 L 365 135 L 318 140 Z" },
  { name: "Meghalaya", d: "M 320 138 L 358 135 L 360 155 L 320 158 Z" },
  { name: "Arunachal Pradesh", d: "M 320 88 L 390 78 L 395 115 L 320 118 Z" },
  { name: "Nagaland", d: "M 360 115 L 390 110 L 392 138 L 358 140 Z" },
  { name: "Manipur", d: "M 360 138 L 390 135 L 392 162 L 358 165 Z" },
  { name: "Mizoram", d: "M 340 155 L 365 152 L 365 180 L 340 182 Z" },
  { name: "Tripura", d: "M 330 155 L 345 152 L 343 178 L 328 180 Z" },
  { name: "Sikkim", d: "M 298 108 L 318 105 L 320 122 L 298 125 Z" },
];

interface IndiaMapProps {
  className?: string;
}

export function IndiaMap({ className }: IndiaMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 500 420"
        className="w-full h-full"
        role="img"
        aria-label="Map of India — click a state to filter politicians"
      >
        {STATES.map((state) => {
          const slug = stateToSlug(state.name);
          const isHovered = hovered === state.name;

          return (
            <Link key={state.name} href={`/state/${slug}`}>
              <path
                d={state.d}
                fill={isHovered ? "#e8c547" : "#1a1a24"}
                stroke="#2a2a3a"
                strokeWidth="1"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHovered(state.name)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{state.name}</title>
              </path>
            </Link>
          );
        })}
      </svg>

      {/* Hovered state label */}
      {hovered && (
        <div className="absolute bottom-2 left-2 bg-surface border border-border px-2 py-1 rounded-sm">
          <p className="font-mono text-xs text-text-primary">{hovered}</p>
        </div>
      )}
    </div>
  );
}
