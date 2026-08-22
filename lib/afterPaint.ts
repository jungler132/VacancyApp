export function afterFirstPaint(run: () => void): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const frame = requestAnimationFrame(() => {
    timer = setTimeout(() => {
      if (!cancelled) run();
    }, 0);
  });
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
    if (timer) clearTimeout(timer);
  };
}
