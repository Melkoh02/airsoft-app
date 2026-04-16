import { useEffect, useState } from "react";
import type { ButtonSource } from "../types";
import { createButtonSource, type ButtonSourceAdapter } from "../buttonSource";

export function useButtonSource(kind: ButtonSource): ButtonSourceAdapter {
  const [source] = useState<ButtonSourceAdapter>(() => createButtonSource(kind));

  useEffect(() => {
    source.start();
    return () => {
      source.stop();
    };
  }, [source]);

  return source;
}
