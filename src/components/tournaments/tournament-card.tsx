"use client";

import { motion } from "framer-motion";
import { ExternalLink, MapPin } from "lucide-react";
import type { Tournament } from "@/types/tournament";

const timeControlIcon: Record<string, string> = {
  STANDARD: "⏱",
  RAPID: "♟",
  BLITZ: "⚡",
  UNKNOWN: "?",
};

const timeControlLabel: Record<string, string> = {
  STANDARD: "Standard",
  RAPID: "Rapid",
  BLITZ: "Blitz",
  UNKNOWN: "Unknown",
};

function formatDate(dateStr: string | null): { label: string; highlight: boolean } | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return { label: "Today", highlight: true };
  if (d.getTime() === tomorrow.getTime()) return { label: "Tomorrow", highlight: true };

  return {
    label: date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    highlight: false,
  };
}

interface TournamentCardProps {
  tournament: Tournament;
  index: number;
}

export function TournamentCard({ tournament, index }: TournamentCardProps) {
  const dateInfo = formatDate(tournament.startDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Header — entire area tappable, opens tournament page */}
        <a
          href={tournament.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start justify-between gap-2 px-4 pt-4 pb-2 group"
        >
          <h3 className="font-semibold text-[16px] leading-snug line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
            {tournament.name}
          </h3>
          <ExternalLink className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-blue-500 mt-0.5 transition-colors" />
        </a>

        {/* Meta row: ⚡ Blitz · 👥 19 · 🎯 1053 */}
        <div className="px-4 pb-1.5 flex items-center gap-2 text-[13px] text-gray-500 overflow-hidden">
          <span className="whitespace-nowrap">
            {timeControlIcon[tournament.timeControl]} {timeControlLabel[tournament.timeControl]}
          </span>
          {tournament.playerCount != null && (
            <>
              <span className="text-gray-300">·</span>
              <span className="whitespace-nowrap">👥 {tournament.playerCount}</span>
            </>
          )}
          {tournament.averageRating != null && (
            <>
              <span className="text-gray-300">·</span>
              <span className="whitespace-nowrap">🎯 {tournament.averageRating}</span>
            </>
          )}
        </div>

        {/* Date row — stronger contrast, semibold, highlights today/tomorrow */}
        {dateInfo && (
          <div
            className={`px-4 pb-3 flex items-center gap-1.5 text-[13px] font-semibold ${
              dateInfo.highlight ? "text-amber-600" : "text-gray-800"
            }`}
          >
            📅 {dateInfo.label}
          </div>
        )}

        {/* Optional: Location — only shown when available */}
        {tournament.city && (
          <div className="px-4 pb-3 -mt-1 flex items-center gap-1.5 text-[13px] text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{tournament.city}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
