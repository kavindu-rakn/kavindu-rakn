import Lenis from 'lenis';

/**
 * Lenis momentum scrolling, off entirely under prefers-reduced-motion.
 *
 * In-page links are handled by one delegated listener: Lenis animates the
 * scroll, then focus moves to the target so keyboard and screen-reader users
 * land where the link said (the skip link depends on this). Without Lenis the
 * browser's native fragment navigation does the same. Both stop below the
 * fixed header via the root's `scroll-padding-top`.
 */
export function initSmoothScroll() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lenis: Lenis | null = null;
  let raf = 0;

  const loop = (time: number) => {
    lenis?.raf(time);
    raf = requestAnimationFrame(loop);
  };

  function start() {
    if (lenis || reducedMotion.matches) return;
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(raf);
    lenis?.destroy();
    lenis = null;
  }

  const focusTarget = (el: HTMLElement) => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };

  document.addEventListener('click', (e) => {
    if (!lenis || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
    const id = link?.getAttribute('href')?.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    e.preventDefault();
    history.pushState(null, '', `#${id}`);
    // Lenis already subtracts the root's scroll-padding-top (the header height).
    lenis.scrollTo(id === 'hero' ? 0 : target, {
      duration: 1.1,
      onComplete: () => focusTarget(target),
    });
  });

  start();
  reducedMotion.addEventListener('change', () => (reducedMotion.matches ? stop() : start()));
}
