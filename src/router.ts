import { useCallback, useEffect, useState } from 'react';

export type Route = { name: 'home' } | { name: 'project'; slug: string };

/** Where the site lives: "/" locally, "/Nini-Landing-Page/" on GitHub Pages. */
export const HOME_PATH = import.meta.env.BASE_URL;

const parse = (path: string): Route => {
  const local = path.startsWith(HOME_PATH) ? path.slice(HOME_PATH.length) : path.replace(/^\//, '');
  const m = local.match(/^project\/([^/]+)\/?$/);
  return m ? { name: 'project', slug: decodeURIComponent(m[1]) } : { name: 'home' };
};

export const projectPath = (s: string) => `${HOME_PATH}project/${encodeURIComponent(s)}`;

/**
 * Two routes: the home composition and /project/<slug>. Uses the History API directly;
 * the browser's back and forward buttons move between them.
 */
export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(parse(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((path: string) => {
    if (path !== window.location.pathname) window.history.pushState(null, '', path);
    setRoute(parse(path));
  }, []);

  /** Back to the page we came from when there is one, otherwise straight home. */
  const home = useCallback(() => {
    if (window.history.state?.fromHome) window.history.back();
    else go(HOME_PATH);
  }, [go]);

  const openProject = useCallback((s: string) => {
    window.history.pushState({ fromHome: true }, '', projectPath(s));
    setRoute({ name: 'project', slug: s });
  }, []);

  return { route, go, home, openProject };
}
