const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        const animation = el.dataset.reveal || "fade-up";
        const delay = parseInt(el.dataset.delay || "0", 10);
        el.style.animationDelay = `${delay}ms`;
        el.classList.add(`animate-${animation}`);
        el.dataset.revealed = "true";
        observer.unobserve(el);

        if (el.dataset.counter !== undefined) {
          animateCounter(el);
        }
      }
    });
  },
  { threshold: 0.1, rootMargin: "-60px" }
);

function animateCounter(el: HTMLElement) {
  const target = parseFloat(el.dataset.target || "0");
  const suffix = el.dataset.suffix || "";
  const duration = parseInt(el.dataset.duration || "1500", 10);
  let start: number | null = null;

  function step(timestamp: number) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = formatNumber(current) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = formatNumber(target) + suffix;
  }
  requestAnimationFrame(step);
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

let progressBar: HTMLElement | null = null;

function initProgressBar() {
  progressBar = document.getElementById("scroll-progress");
  if (!progressBar) return;
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    progressBar!.style.transform = `scaleX(${progress})`;
  });
}

export function initScrollReveal() {
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    if (el.dataset.revealed !== "true") observer.observe(el);
  });
}

export function initScrollProgress() {
  initProgressBar();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initScrollReveal();
      initScrollProgress();
    });
  } else {
    initScrollReveal();
    initScrollProgress();
  }

  const observerForDynamic = new MutationObserver(() => {
    document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])").forEach((el) => {
      observer.observe(el);
    });
  });
  observerForDynamic.observe(document.body, { childList: true, subtree: true });
}
