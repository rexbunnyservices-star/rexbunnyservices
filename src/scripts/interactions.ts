function isTouchDevice(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function initTilt() {
  if (isTouchDevice()) return;
  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
      card.style.transition = "transform 0.1s ease-out";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
      card.style.transition = "transform 0.5s ease-out";
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
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
      btn.style.transition = "transform 0.1s ease-out";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0, 0)";
      btn.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    });
  });
}

function initCursorGlow() {
  if (isTouchDevice()) return;
  const glow = document.createElement("div");
  glow.id = "cursor-glow";
  Object.assign(glow.style, {
    position: "fixed",
    pointerEvents: "none",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle at center, rgba(249,115,22,0.08) 0%, transparent 70%)",
    transform: "translate(-50%, -50%)",
    zIndex: "1",
    transition: "opacity 0.3s",
    opacity: "0",
  });
  document.body.prepend(glow);

  const heroSection = document.querySelector<HTMLElement>("[data-cursor-glow]");
  if (!heroSection) return;

  const onMouse = (e: MouseEvent) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
    glow.style.opacity = "1";
  };

  heroSection.addEventListener("mousemove", onMouse);
  heroSection.addEventListener("mouseleave", () => { glow.style.opacity = "0"; });
}

export function initInteractions() {
  initTilt();
  initMagnetic();
  initCursorGlow();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInteractions);
  } else {
    initInteractions();
  }

  const interactionObserver = new MutationObserver(() => {
    initTilt();
    initMagnetic();
  });
  interactionObserver.observe(document.body, { childList: true, subtree: true });
}
