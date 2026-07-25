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
        <details class="group rounded-xl border border-gray-200 bg-white transition-colors open:border-brand-500/30">
          <summary class="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-gray-900 transition-colors hover:text-brand-600">
            {item.question}
            <svg
              class="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div class="border-t border-gray-200 px-6 py-4 text-sm text-gray-600">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
