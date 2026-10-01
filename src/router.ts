import { useCallback, useEffect, useState } from 'react';

export type Route = { name: 'home' } | { name: 'project'; slug: string };

const parse = (path: string): Route => {
  const m = path.match(/^\/project\/([^/]+)\/?$/);
  return m ? { name: 'project', slug: decodeURIComponent(m[1]) } : { name: 'home' };
};

export const projectPath = (s: string) => `/project/${encodeURIComponent(s)}`;

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
    else go('/');
  }, [go]);

  const openProject = useCallback((s: string) => {
    window.history.pushState({ fromHome: true }, '', projectPath(s));
    setRoute({ name: 'project', slug: s });
  }, []);

  return { route, go, home, openProject };
}
