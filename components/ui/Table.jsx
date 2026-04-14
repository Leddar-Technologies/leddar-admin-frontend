export default function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-500 bg-neutral-50 shadow-card">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-neutral-200 text-left text-xs uppercase tracking-wide text-muted-300">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-300 [&>tr:nth-child(odd)]:bg-neutral-50 [&>tr:nth-child(even)]:bg-neutral-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}
