export interface ScrapedTournament {
  chessResultsId: string;
  name: string;
  city?: string;
  startDate?: Date;
  endDate?: Date;
  timeControl: "STANDARD" | "RAPID" | "BLITZ" | "UNKNOWN";
  status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
  playerCount?: number;
  averageRating?: number;
  roundCount?: number;
  chiefArbiter?: string;
  organizer?: string;
  url: string;
  players?: ScrapedPlayer[];
}

export interface ScrapedPlayer {
  name: string;
  fideId?: string;
  rating?: number;
  federation?: string;
  title?: string;
  rank?: number;
  points?: number;
}

// Client-side tournament type (serializable)
export interface Tournament {
  id: string;
  chessResultsId: string;
  name: string;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
  timeControl: "STANDARD" | "RAPID" | "BLITZ" | "UNKNOWN";
  status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
  playerCount: number | null;
  averageRating: number | null;
  roundCount: number | null;
  chiefArbiter: string | null;
  organizer: string | null;
  url: string;
  lastScrapedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type TimeControlFilter = "ALL" | "STANDARD" | "RAPID" | "BLITZ";
export type StatusFilter = "ALL" | "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
