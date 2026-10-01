import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';

export type WordsState = 'below' | 'in' | 'out';

/**
 * Plays a line in and out as it enters and leaves view. Entering always starts from below
 * the baseline; leaving lifts the words out above it.
 */
export function useInOut(visible: boolean): WordsState {
  const [state, setState] = useState<WordsState>('below');
  const current = useRef(state);
  current.current = state;

  useEffect(() => {
    if (visible) {
      if (current.current === 'in') return;
      // Park below the baseline without a transition, then rise in on the next frames.
      setState('below');
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setState('in'));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    if (current.current === 'in') setState('out');
  }, [visible]);

  return state;
}

/** A line set word by word; each word is masked at its baseline and slides through it. */
export default function Words({ text, state }: { text: string; state: WordsState }) {
  const words = text.split(' ');
  return (
    <span className="words" data-state={state}>
      {words.map((w, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="words__mask">
            <span className="words__word" style={{ '--i': i } as CSSProperties}>
              {w}
            </span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}
