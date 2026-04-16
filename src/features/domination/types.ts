export type Team = {
  id: string;
  name: string;
  color: string;
};

export type ButtonSource = "simulated" | "switcher";

export type Game = {
  id: string;
  name: string;
  teams: [Team, Team];
  roundDurationMs: number;
  roundCount: number;
  countdownDurationMs: number;
  buttonSource: ButtonSource;
  createdAt: number;
  updatedAt: number;
};

export type GameInput = Omit<Game, "id" | "createdAt" | "updatedAt">;

export type RoundResult = {
  index: number;
  durationMs: number;
  dominationMsByTeam: Record<string, number>;
  neutralMs: number;
  winnerTeamId: string | null;
};

export type MatchStatus = "in_progress" | "completed" | "aborted";

export type Match = {
  id: string;
  gameId: string;
  startedAt: number;
  endedAt: number | null;
  status: MatchStatus;
  rounds: RoundResult[];
};
