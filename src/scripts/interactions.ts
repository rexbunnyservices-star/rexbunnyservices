function isTouchDevice(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

const smoothEase = "cubic-bezier(0.22, 1, 0.36, 1)";

function initTilt() {
  if (isTouchDevice()) return;
  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015,1.015,1.015)`;
      card.style.transition = "transform 0.08s linear";
      card.style.willChange = "transform";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
      card.style.transition = `transform 0.6s ${smoothEase}`;
      card.style.willChange = "auto";
    });
  });
}

function initMagnetic() {
  if (isTouchDevice()) return;
  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
    btn.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      btn.style.transition = "transform 0.08s linear";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0, 0)";
      btn.style.transition = `transform 0.6s ${smoothEase}`;
    });
  });
}

function initCursorGlow() {
  if (isTouchDevice()) return;
  const glow = document.getElementById("cursor-glow");
  if (glow) return;
  const el = document.createElement("div");
  el.id = "cursor-glow";
  Object.assign(el.style, {
    position: "fixed",
    pointerEvents: "none",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle at center, rgba(249,115,22,0.07) 0%, rgba(124,58,237,0.03) 40%, transparent 70%)",
    transform: "translate(-50%, -50%)",
    zIndex: "1",
    transition: "opacity 0.6s ease-out",
    opacity: "0",
    willChange: "transform",
  });
  document.body.prepend(el);

  const hero = document.querySelector<HTMLElement>("[data-cursor-glow]");
  if (!hero) return;

  let tick: number | null = null;
  const onMove = (e: MouseEvent) => {
    if (tick) cancelAnimationFrame(tick);
    tick = requestAnimationFrame(() => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.opacity = "1";
    });
  };
  const onLeave = () => { el.style.opacity = "0"; };

  hero.addEventListener("mousemove", onMove, { passive: true });
  hero.addEventListener("mouseleave", onLeave);
}

function initNavScroll() {
  const nav = document.querySelector("nav");
  if (!nav) return;
  let lastScroll = 0;
  window.addEventListener("scroll", () => {
    const current = window.scrollY;
    if (current > 80) {
      nav.classList.add("nav-scrolled");
    } else {
      nav.classList.remove("nav-scrolled");
    }
    if (current > 300) {
      nav.style.transform = current > lastScroll ? "translateY(-100%)" : "translateY(0)";
    } else {
      nav.style.transform = "translateY(0)";
    }
    lastScroll = current;
  }, { passive: true });
}

export function initInteractions() {
  initTilt();
  initMagnetic();
  initCursorGlow();
  initNavScroll();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInteractions);
  } else {
    initInteractions();
  }

  const liveObserver = new MutationObserver(() => {
    initTilt();
    initMagnetic();
  });
  liveObserver.observe(document.body, { childList: true, subtree: true });
}
