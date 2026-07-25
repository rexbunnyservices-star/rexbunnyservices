import { useState } from "preact/hooks";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    service: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", company: "", phone: "", service: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div class="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <svg class="mx-auto mb-3 h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <h3 class="text-lg font-bold text-green-800">Message Sent!</h3>
        <p class="mt-1 text-sm text-green-600">We'll get back to you within 24 hours.</p>
        <button onClick={() => setStatus("idle")} class="mt-4 text-sm font-medium text-green-700 underline hover:text-green-600">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="name" class="mb-1 block text-sm font-medium text-gray-700">Name *</label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onInput={(e) => setForm({ ...form, name: (e.target as HTMLInputElement).value })}
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Your name"
          />
        </div>
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email *</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onInput={(e) => setForm({ ...form, email: (e.target as HTMLInputElement).value })}
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="you@company.com"
          />
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="company" class="mb-1 block text-sm font-medium text-gray-700">Company</label>
          <input
            id="company"
            type="text"
            value={form.company}
            onInput={(e) => setForm({ ...form, company: (e.target as HTMLInputElement).value })}
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Company name"
          />
        </div>
        <div>
          <label for="phone" class="mb-1 block text-sm font-medium text-gray-700">Phone</label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onInput={(e) => setForm({ ...form, phone: (e.target as HTMLInputElement).value })}
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>
      <div>
        <label for="service" class="mb-1 block text-sm font-medium text-gray-700">Service Interested In</label>
        <select
          id="service"
          value={form.service}
          onChange={(e) => setForm({ ...form, service: (e.target as HTMLSelectElement).value })}
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">Select a service</option>
          <option value="seo">SEO Services</option>
          <option value="aeo">Answer Engine Optimization (AEO)</option>
          <option value="geo">Generative Engine Optimization (GEO)</option>
          <option value="web-development">Web Development</option>
          <option value="ai-visual">AI Visual Services</option>
          <option value="other">Other / Not Sure</option>
        </select>
      </div>
      <div>
        <label for="message" class="mb-1 block text-sm font-medium text-gray-700">Message *</label>
        <textarea
          id="message"
          required
          rows={4}
          value={form.message}
          onInput={(e) => setForm({ ...form, message: (e.target as HTMLTextAreaElement).value })}
          class="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          placeholder="Tell us about your project or goals..."
        />
      </div>
      {status === "error" && (
        <p class="text-sm text-red-600">Something went wrong. Please try again or email us directly.</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        class="w-full rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
