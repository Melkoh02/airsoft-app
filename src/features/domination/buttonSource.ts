import type { ButtonSource } from "./types";

export type ButtonPressEvent = {
  teamId: string;
  at: number;
};

export type ButtonPressListener = (event: ButtonPressEvent) => void;

export interface ButtonSourceAdapter {
  readonly kind: ButtonSource;
  readonly isConnected: boolean;
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
  onPress(listener: ButtonPressListener): () => void;
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

export class SwitcherButtonSource implements ButtonSourceAdapter {
  readonly kind: ButtonSource = "switcher";
  readonly isConnected = false;

  start() {
    // Hardware not yet implemented. Real impl will scan for the Switcher device
    // over USB (expo-usb-serial-port-for-android) and Bluetooth (react-native-ble-plx),
    // and bridge its button-press frames into the onPress listeners.
  }

  stop() {}

  onPress(_listener: ButtonPressListener): () => void {
    return () => {};
  }
}

export function createButtonSource(kind: ButtonSource): ButtonSourceAdapter {
  if (kind === "simulated") return new SimulatedButtonSource();
  return new SwitcherButtonSource();
}

export function isSimulated(source: ButtonSourceAdapter): source is SimulatedButtonSource {
  return source instanceof SimulatedButtonSource;
}
