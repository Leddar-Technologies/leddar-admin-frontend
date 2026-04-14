export default function StatCard({ title, value, subtitle }) {
  return (
    <article className="rounded-xl bg-neutral-50 p-5 shadow-card animate-fade-in-up">
      <p className="text-sm text-muted-200">{title}</p>
      <h3 className="mt-2 text-2xl font-extrabold text-ink">{value}</h3>
      {subtitle ? <p className="mt-1 text-xs text-muted-200">{subtitle}</p> : null}
    </article>
  );
}
