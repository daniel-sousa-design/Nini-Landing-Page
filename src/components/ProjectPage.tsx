import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Lenis from 'lenis';
import { DESCRIPTION_PLACEHOLDER, FACTS_PLACEHOLDER, type Thumb } from '../content';
import { SCRIPT } from '../logoPaths';
import Words, { useInOut } from './Words';
import Footer from './Footer';

type Props = {
  project: Thumb;
  onHome: () => void;
  /** Called once the full-screen photograph is ready to replace the opening transition. */
  onReady: () => void;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** True while the element is at least partly inside the scroll container's view. */
function useInView(ref: RefObject<Element | null>, root: RefObject<Element | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      root: root.current,
      rootMargin: '0px 0px -12% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, root]);
  return inView;
}

/**
 * Project page, shared by every project. The opening screen shows the photograph full
 * screen, a 20% black shade fading in, and, all at the same moment, the title rising word
 * by word in the centre, the nav arriving at the top and the date / client / location
 * facts at the foot. Below it: the "About project" description, then the footer.
 */
export default function ProjectPage({ project, onHome, onReady }: Props) {
  const reduced = useReducedMotion() ?? false;
  const state = useInOut(true);
  const facts = project.facts ?? FACTS_PLACEHOLDER;
  const description = project.description ?? DESCRIPTION_PLACEHOLDER;

  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const about = useRef<HTMLElement>(null);
  const aboutInView = useInView(about, scroller);
  const aboutState = useInOut(aboutInView);
  const [onPhoto, setOnPhoto] = useState(true);

  // The page scrolls on its own, with the same eased feel as the home page.
  useEffect(() => {
    const wrapper = scroller.current;
    const inner = content.current;
    if (!wrapper || !inner) return;
    const lenis = new Lenis({ wrapper, content: inner, lerp: reduced ? 1 : 0.085, smoothWheel: !reduced, autoRaf: true });
    // The nav reads light over the photograph and ink once the page has scrolled past it.
    const onScroll = () => setOnPhoto(wrapper.scrollTop < wrapper.clientHeight - 40);
    wrapper.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      wrapper.removeEventListener('scroll', onScroll);
      lenis.destroy();
    };
  }, [reduced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onHome();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onHome]);

  return (
    <article className="project" aria-labelledby="project-title">
      <div ref={scroller} className="project__scroller" data-lenis-prevent>
        <div ref={content}>
          <section className="project__opening">
            <img
              className="project__img"
              src={project.src}
              alt=""
              draggable={false}
              ref={(img) => {
                if (img?.complete) onReady();
              }}
              onLoad={onReady}
            />
            <motion.div
              className="project__shade"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 1.2, ease: EASE }}
            />
            <h1 id="project-title" className="project__title">
              <Words text={project.title} state={state} />
            </h1>
            <dl className="project__facts">
              {(
                [
                  ['Date', facts.date],
                  ['Client', facts.client],
                  ['Location', facts.location],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="project__fact">
                  <dt><Words text={label} state={state} /></dt>
                  <dd><Words text={value} state={state} /></dd>
                </div>
              ))}
            </dl>
          </section>

          <section ref={about} className="project__about" aria-labelledby="project-about">
            <h2 id="project-about" className="project__about-title">
              <Words text="About project" state={aboutState} />
            </h2>
            <motion.div
              className="project__about-text"
              initial={{ opacity: 0, y: 24 }}
              animate={aboutInView || reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 1.1, ease: EASE, delay: aboutInView ? 0.2 : 0 }}
            >
              {description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </motion.div>
          </section>

          <Footer />
        </div>
      </div>

      <header className="project__nav" data-on-photo={onPhoto || undefined}>
        <a
          className="project__home"
          href="/"
          aria-label="Nini Andrade Silva — home"
        >
          <span className="words" data-state={state}>
            <span className="words__mask">
              <span className="words__word" style={{ '--i': 0 } as CSSProperties}>
                <svg viewBox="0 0 522 165" aria-hidden="true">
                  <path d={SCRIPT} fill="currentColor" />
                </svg>
              </span>
            </span>
          </span>
        </a>
        <nav className="project__menu" aria-label="Primary">
          <button type="button"><Words text="Menu" state={state} /></button>
          <a href="#" hrefLang="pt" lang="pt"><Words text="PT" state={state} /></a>
        </nav>
      </header>
    </article>
  );
}
