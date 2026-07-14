import { useState } from "preact/hooks";

interface FormState {
  name: string;
  phone: string;
  email: string;
  preferred_unit: string;
  budget: string;
  message: string;
}

export default function Tower7LeadForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    preferred_unit: "",
    budget: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/t7-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div class="rounded-xl border border-green-500/30 bg-dark-900 p-8 text-center">
        <div class="mb-4 text-4xl">✅</div>
        <h3 class="mb-2 text-2xl font-bold text-white">Thank you! We'll be in touch shortly.</h3>
        <p class="text-sm text-dark-300">
          One of our Tower 7 specialists will call you about your preferred unit and a free site-visit slot.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-dark-700 bg-dark-900 px-4 py-3 text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} class="rounded-xl border border-dark-800 bg-dark-900/50 p-8">
      <h3 class="mb-1 text-2xl font-bold text-white">Register Your Interest</h3>
      <p class="mb-6 text-sm text-dark-400">
        Get floor plans, live pricing & a free site-visit slot for Tower 7, Aspire Silicon City.
      </p>

      <div class="mb-4">
        <input
          type="text"
          placeholder="Full Name *"
          value={form.name}
          onInput={(e) => update("name", (e.target as HTMLInputElement).value)}
          required
          class={inputClass}
        />
      </div>
      <div class="mb-4">
        <input
          type="tel"
          placeholder="Phone Number *"
          value={form.phone}
          onInput={(e) => update("phone", (e.target as HTMLInputElement).value)}
          required
          class={inputClass}
        />
      </div>
      <div class="mb-4">
        <input
          type="email"
          placeholder="Email (optional)"
          value={form.email}
          onInput={(e) => update("email", (e.target as HTMLInputElement).value)}
          class={inputClass}
        />
      </div>
      <div class="mb-4">
        <select
          value={form.preferred_unit}
          onChange={(e) => update("preferred_unit", (e.target as HTMLSelectElement).value)}
          class={inputClass}
        >
          <option value="">Preferred Unit (optional)</option>
          <option value="4 BHK + Study">4 BHK + Study (3,342 sq ft)</option>
          <option value="Duplex Penthouse">Duplex Penthouse (Floors 36–37)</option>
        </select>
      </div>
      <div class="mb-4">
        <input
          type="text"
          placeholder="Budget (optional)"
          value={form.budget}
          onInput={(e) => update("budget", (e.target as HTMLInputElement).value)}
          class={inputClass}
        />
      </div>
      <div class="mb-4">
        <textarea
          placeholder="Anything else? (optional)"
          rows="3"
          value={form.message}
          onInput={(e) => update("message", (e.target as HTMLTextAreaElement).value)}
          class={inputClass}
        />
      </div>

      {status === "error" && (
        <p class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        class="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting..." : "Get Tower 7 Details →"}
      </button>
      <p class="mt-3 text-center text-xs text-dark-500">
        By registering you agree to be contacted about Tower 7. We're a marketing partner — the
        developer (NBCC) pays our commission, so it costs you nothing extra.
      </p>
    </form>
  );
}
