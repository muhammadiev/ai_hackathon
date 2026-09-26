import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Always jump to top when the route changes (fixes "stuck at bottom of previous page"). */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const main = document.querySelector('.app-main');
    if (main) main.scrollTop = 0;
  }, [pathname]);
  return null;
}
