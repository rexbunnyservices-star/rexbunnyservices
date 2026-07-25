interface MetricCardProps {
  value: string;
  label: string;
  description?: string;
}

export default function MetricCard({ value, label, description }: MetricCardProps) {
  return (
    <div class="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:border-brand-500/30 hover:-translate-y-0.5">
      <div class="bg-gradient-to-r from-brand-500 to-rex-orange bg-clip-text font-display text-3xl font-extrabold text-transparent">{value}</div>
      <div class="mt-2 text-sm font-bold text-gray-900">{label}</div>
      {description && <div class="mt-1 text-xs text-gray-500">{description}</div>}
    </div>
  );
}
