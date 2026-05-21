import { NEUTRAL_OWNER } from "./matchEngine";
import type { ButtonSource } from "./types";

export type ButtonPressEvent = {
  teamId: string;
  at: number;
};

export type ButtonPressListener = (event: ButtonPressEvent) => void;

export type ConnectionListener = (connected: boolean) => void;

export type ButtonSourceConfig = {
  host: string;
  teamAId: string;
  teamBId: string;
};

export interface ButtonSourceAdapter {
  readonly kind: ButtonSource;
  readonly isConnected: boolean;
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
  onPress(listener: ButtonPressListener): () => void;
  onConnectionChange?(listener: ConnectionListener): () => void;
}

export class SimulatedButtonSource implements ButtonSourceAdapter {
  readonly kind: ButtonSource = "simulated";
  readonly isConnected = true;
  private listeners = new Set<ButtonPressListener>();

  start() {}

  stop() {
    this.listeners.clear();
  }

  onPress(listener: ButtonPressListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  trigger(teamId: string): void {
    const event: ButtonPressEvent = { teamId, at: Date.now() };
    this.listeners.forEach((listener) => listener(event));
  }
}

const DEFAULT_SWITCHER_PORT = 8765;
const INITIAL_RECONNECT_DELAY_MS = 500;
const MAX_RECONNECT_DELAY_MS = 5000;

function buildSwitcherUrl(host: string): string {
  const trimmed = host.trim().replace(/^ws:\/\//i, "");
  const hasPort = /:\d+$/.test(trimmed);
  const withPort = hasPort ? trimmed : `${trimmed}:${DEFAULT_SWITCHER_PORT}`;
  return `ws://${withPort}/`;
}

type SwitcherStateValue = "blue" | "red" | "neutral";

export class SwitcherButtonSource implements ButtonSourceAdapter {
  readonly kind: ButtonSource = "switcher";
  private _isConnected = false;
  private ws: WebSocket | null = null;
  private listeners = new Set<ButtonPressListener>();
  private connListeners = new Set<ConnectionListener>();
  private readonly url: string;
  private readonly teamAId: string;
  private readonly teamBId: string;
  private stopped = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;

  constructor(config: ButtonSourceConfig) {
    this.url = buildSwitcherUrl(config.host);
    this.teamAId = config.teamAId;
    this.teamBId = config.teamBId;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closeSocket();
    this.setConnected(false);
    this.listeners.clear();
    this.connListeners.clear();
  }

  onPress(listener: ButtonPressListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connListeners.add(listener);
    listener(this._isConnected);
    return () => {
      this.connListeners.delete(listener);
    };
  }

  private closeSocket(): void {
    if (!this.ws) return;
    const ws = this.ws;
    this.ws = null;
    ws.onopen = null;
    ws.onmessage = null;
    ws.onerror = null;
    ws.onclose = null;
    try {
      ws.close();
    } catch {
      // ignore
    }
  }

  private setConnected(value: boolean): void {
    if (this._isConnected === value) return;
    this._isConnected = value;
    this.connListeners.forEach((listener) => listener(value));
  }

  private connect(): void {
    if (this.stopped) return;
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;
      this.setConnected(true);
    };
    ws.onmessage = (event) => {
      this.handleMessage(typeof event.data === "string" ? event.data : "");
    };
    ws.onerror = () => {
      // onclose will follow with cleanup
    };
    ws.onclose = () => {
      this.setConnected(false);
      this.ws = null;
      this.scheduleReconnect();
    };
  }

  private handleMessage(raw: string): void {
    if (!raw) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!parsed || typeof parsed !== "object") return;
    const msg = parsed as { type?: string; value?: string; at?: number };
    if (msg.type !== "state") return;
    const teamId = this.mapStateToTeamId(msg.value);
    if (teamId === null) return;
    const at = typeof msg.at === "number" ? msg.at : Date.now();
    this.listeners.forEach((listener) => listener({ teamId, at }));
  }

  private mapStateToTeamId(value: string | undefined): string | null {
    switch (value as SwitcherStateValue | undefined) {
      case "blue":
        return this.teamAId;
      case "red":
        return this.teamBId;
      case "neutral":
        return NEUTRAL_OWNER;
      default:
        return null;
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return;
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, MAX_RECONNECT_DELAY_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

export function createButtonSource(
  kind: ButtonSource,
  config?: ButtonSourceConfig,
): ButtonSourceAdapter {
  if (kind === "simulated") return new SimulatedButtonSource();
  if (!config) {
    throw new Error("SwitcherButtonSource requires host and team config");
  }
  return new SwitcherButtonSource(config);
}

export function isSimulated(source: ButtonSourceAdapter): source is SimulatedButtonSource {
  return source instanceof SimulatedButtonSource;
}
