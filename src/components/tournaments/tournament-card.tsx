"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock, ExternalLink, Calendar } from "lucide-react";
import type { Tournament } from "@/types/tournament";

const timeControlColors: Record<string, string> = {
  STANDARD: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  RAPID: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  BLITZ: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  UNKNOWN: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const timeControlLabels: Record<string, string> = {
  STANDARD: "Standard",
  RAPID: "Rapid",
  BLITZ: "Blitz",
  UNKNOWN: "Unknown",
};

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FINISHED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const statusLabels: Record<string, string> = {
  NOT_STARTED: "Upcoming",
  IN_PROGRESS: "In Progress",
  FINISHED: "Finished",
};

function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  if (!startDate) return null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const start = fmt(startDate);
  if (!endDate) return start;
  const end = fmt(endDate);
  return start === end ? start : `${start} – ${end}`;
}

interface TournamentCardProps {
  tournament: Tournament;
  index: number;
}

export function TournamentCard({ tournament, index }: TournamentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {tournament.name}
            </h3>
            <a
              href={tournament.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          {/* Player count and average rating below title */}
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            {tournament.playerCount && (
              <>
                <Users className="h-3 w-3" />
                <span>{tournament.playerCount} players</span>
              </>
            )}
            {tournament.averageRating && (
              <>
                {tournament.playerCount && <span>•</span>}
                <span>Rating-Ø: {tournament.averageRating}</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge
              variant="secondary"
              className={`${timeControlColors[tournament.timeControl]} text-xs`}
            >
              <Clock className="mr-1 h-3 w-3" />
              {timeControlLabels[tournament.timeControl]}
            </Badge>
            <Badge
              variant="secondary"
              className={`${statusColors[tournament.status]} text-xs`}
            >
              {statusLabels[tournament.status]}
            </Badge>
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {/* Date and Location in one row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {formatDateRange(tournament.startDate, tournament.endDate) && (
                <>
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className="truncate">{formatDateRange(tournament.startDate, tournament.endDate)}</span>
                  {tournament.city && <span>,</span>}
                </>
              )}
              {tournament.city && (
                <>
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{tournament.city}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
