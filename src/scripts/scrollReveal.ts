const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        const animation = el.dataset.reveal || 'fade-up';
        const delay = parseInt(el.dataset.delay || '0', 10);
        const duration = parseInt(el.dataset.duration || '700', 10);
        const stagger = parseInt(el.dataset.stagger || '0', 10);

        revealNow(el, animation, duration, delay);
        observer.unobserve(el);

        if (el.dataset.counter !== undefined) {
          animateCounter(el);
        }

        if (stagger > 0) {
          const children = el.querySelectorAll<HTMLElement>('[data-reveal-stagger-item]');
          children.forEach((child, i) => {
            revealNow(
              child,
              child.dataset.reveal || animation,
              duration,
              delay + (i + 1) * stagger,
            );
            observer.unobserve(child);
          });
        }
      }
    });
  },
  { threshold: 0.1, rootMargin: '-40px' },
);

function animateCounter(el: HTMLElement) {
  const target = parseFloat(el.dataset.target || '0');
  const suffix = el.dataset.suffix || '';
  const duration = parseInt(el.dataset.duration || '2000', 10);
  let start: number | null = null;

  function step(timestamp: number) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(eased * target);
    el.textContent = formatNumber(current) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = formatNumber(target) + suffix;
  }
  requestAnimationFrame(step);
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}

let progressBar: HTMLElement | null = null;

function initProgressBar() {
  progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;
  window.addEventListener(
    'scroll',
    () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      progressBar!.style.transform = `scaleX(${progress})`;
    },
    { passive: true },
  );
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
 * Tailwind's .opacity-0 is !important, and a stylesheet override loses to it on
 * source order no matter how specific the selector is. The only thing that wins
 * is Tailwind's own ! utilities, so reduced motion reveals via !opacity-100.
 * Without this, 58 opacity-0 elements are invisible for users who ask for less
 * motion, which is the exact opposite of what they requested.
 */
function revealNow(el: HTMLElement, animation: string, duration: number, delay = 0) {
  el.style.animationDelay = `${delay}ms`;
  el.style.animationDuration = `${duration}ms`;
  el.classList.remove('opacity-0');
  el.classList.add('!opacity-100');
  el.classList.add(`animate-${animation}`);
  el.dataset.revealed = 'true';
}

export function initScrollReveal() {
  if (prefersReducedMotion()) {
    document
      .querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-stagger-item]')
      .forEach((el) => revealNow(el, el.dataset.reveal || 'fade-up', 1));
    return;
  }

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (el.dataset.revealed !== 'true') observer.observe(el);
  });
}

export function initScrollProgress() {
  initProgressBar();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initScrollReveal();
      initScrollProgress();
    });
  } else {
    initScrollReveal();
    initScrollProgress();
  }

  const liveObserver = new MutationObserver(() => {
    document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])').forEach((el) => {
      observer.observe(el);
    });
  });
  liveObserver.observe(document.body, { childList: true, subtree: true });
}
