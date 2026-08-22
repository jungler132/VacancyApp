let listener: (() => void) | null = null;

export function noteShellReady() {
  listener?.();
}

export function onShellReady(cb: () => void): () => void {
  listener = cb;
  return () => {
    if (listener === cb) listener = null;
  };
}
