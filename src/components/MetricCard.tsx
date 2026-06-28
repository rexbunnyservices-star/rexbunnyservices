interface MetricCardProps {
  value: string;
  label: string;
  description?: string;
}

export default function MetricCard({ value, label, description }: MetricCardProps) {
  return (
    <div class="rounded-xl border border-dark-800 bg-dark-900 p-6 text-center transition-colors hover:border-brand-500/30">
      <div class="text-3xl font-bold text-brand-400">{value}</div>
      <div class="mt-2 text-sm font-medium text-white">{label}</div>
      {description && <div class="mt-1 text-xs text-dark-400">{description}</div>}
    </div>
  );
}
