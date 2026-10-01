import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll, type MotionValue } from 'motion/react';
import { ReactLenis, useLenis } from 'lenis/react';
import { CAPTION_TWO, GROUP_ONE, GROUP_TWO, slug, type Thumb } from './content';
import { computeLayout, type Layout } from './layout';
import { clamp, mix } from './timeline';
import { useViewport } from './useViewport';
import { useRoute } from './router';
import Logo from './components/Logo';
import Hero from './components/Hero';
import FloatingField from './components/FloatingField';
import Stones from './components/Stones';
import Caption from './components/Caption';
import CursorLabel from './components/CursorLabel';
import Footer, { Brands } from './components/Footer';
import ExpandingImage, { type Opening } from './components/ExpandingImage';
import ProjectPage from './components/ProjectPage';

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** The page warms from sand to pale cream as you descend. */
function useBackgroundTone(scrollY: MotionValue<number>, layout: Layout) {
  const stops = useMemo(() => {
    const { VH, groupOne, stones, captionTwo, groupTwo, height } = layout;
    return [
      [0, '#d3cdbc'],
      [VH * 0.9, '#d3cdbc'],
      [groupOne[4].rect.y - VH * 0.4, '#ede7d7'],
      [stones.y, '#ede7d7'],
      [captionTwo.y - VH * 0.5, '#f3eee1'],
      [groupTwo[2].rect.y - VH * 0.5, '#f8f5ea'],
      [height - VH * 0.6, '#fbf8ed'],
    ].map(([s, c]) => [s as number, hex(c as string)] as const);
  }, [layout]);

  const paint = (s: number) => {
    let i = 0;
    while (i < stops.length - 2 && s > stops[i + 1][0]) i++;
    const [s0, c0] = stops[i];
    const [s1, c1] = stops[i + 1];
    const t = clamp((s - s0) / Math.max(1, s1 - s0), 0, 1);
    const rgb = c0.map((v, k) => Math.round(mix(v, c1[k], t)));
    document.documentElement.style.setProperty('--page', `rgb(${rgb.join(',')})`);
  };

  useMotionValueEvent(scrollY, 'change', paint);
  useEffect(() => paint(scrollY.get()));
}

/** A heavier glide over the hero, the regular one afterwards. */
function ScrollPacing({ VH, reduced }: { VH: number; reduced: boolean }) {
  useLenis((lenis) => {
    if (reduced) return;
    lenis.options.lerp = mix(0.06, 0.09, clamp(lenis.scroll / VH, 0, 1));
  }, [VH, reduced]);
  return null;
}

/** Holds the home page still while a project is opening or open. */
function ScrollLock({ locked }: { locked: boolean }) {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    if (locked) lenis.stop();
    else lenis.start();
  }, [lenis, locked]);
  return null;
}

const PROJECTS: Thumb[] = [...GROUP_ONE, ...GROUP_TWO].filter((t) => !t.decorative);

export default function App() {
  const { W, VH } = useViewport();
  const layout = useMemo(() => computeLayout(W, VH), [W, VH]);
  const reduced = useReducedMotion() ?? false;
  const { scrollY } = useScroll();
  useBackgroundTone(scrollY, layout);

  const shared = { scrollY, VH, reduced };
  const thumbs = useMemo(() => [...layout.groupOne, ...layout.groupTwo], [layout]);

  // Opening a project: the clicked image grows to full screen, and only once it fills the
  // screen does the project page take over (and the URL change).
  const { route, go, home, openProject } = useRoute();
  const [opening, setOpening] = useState<Opening | null>(null);
  const hiddenThumb = useRef<HTMLElement | null>(null);

  const open = useCallback(
    (item: Thumb, el: HTMLElement) => {
      if (opening) return;
      const from = el.getBoundingClientRect();
      el.style.visibility = 'hidden'; // the growing copy stands in for it
      hiddenThumb.current = el;
      setOpening({ src: item.src, from, slug: slug(item.title) });
    },
    [opening],
  );

  const project = route.name === 'project' ? PROJECTS.find((t) => slug(t.title) === route.slug) : undefined;

  // Unknown project (or a purely stylistic image): back to the home page.
  useEffect(() => {
    if (route.name === 'project' && !project) go('/');
  }, [route, project, go]);

  // Back on the home page: put the clicked image back where it was.
  useEffect(() => {
    if (route.name !== 'home') return;
    setOpening(null);
    if (hiddenThumb.current) hiddenThumb.current.style.visibility = '';
    hiddenThumb.current = null;
  }, [route.name]);

  return (
    <ReactLenis root options={{ lerp: reduced ? 1 : 0.06, smoothWheel: !reduced }}>
      <ScrollPacing VH={VH} reduced={reduced} />
      <Logo scrollY={scrollY} layout={layout} reduced={reduced} />

      <main className="stage" style={{ height: layout.height }}>
        <Hero scrollY={scrollY} layout={layout} reduced={reduced} />
        <Stones rect={layout.stones} {...shared} />
        <Caption text={CAPTION_TWO} rect={layout.captionTwo} {...shared} />
        <FloatingField items={thumbs} W={W} mobile={layout.mobile} onOpen={open} {...shared} />
      </main>

      <Brands />
      <Footer />
      <CursorLabel />

      <ScrollLock locked={!!opening || route.name === 'project'} />
      {opening && (
        <ExpandingImage key={`opening-${opening.slug}`} opening={opening} reduced={reduced} onDone={() => openProject(opening.slug)} />
      )}
      {project && <ProjectPage key={`project-${route.name === 'project' ? route.slug : ''}`} project={project} onHome={home} onReady={() => setOpening(null)} />}
    </ReactLenis>
  );
}
