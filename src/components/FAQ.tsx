interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export default function FAQ({ items }: FAQProps) {
  return (
    <div class="mx-auto max-w-3xl space-y-3">
      {items.map((item, i) => (
        <details class="group rounded-xl border border-dark-800 bg-dark-900 transition-colors open:border-brand-500/30">
          <summary class="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-white transition-colors hover:text-brand-400">
            {item.question}
            <svg
              class="h-4 w-4 text-dark-400 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div class="border-t border-dark-800 px-6 py-4 text-sm text-dark-300">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
