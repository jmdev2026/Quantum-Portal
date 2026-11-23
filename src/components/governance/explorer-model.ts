export type GovernanceRow = { id: string; title: string; category: string; state: string; customer: string; description: string; control?: string };
export function filterGovernanceRows(rows: GovernanceRow[], search: string, category: string, state: string, sort: string, control = "all") {
  const query = search.slice(0, 160).trim().toLowerCase();
  return rows.filter(row => [row.title, row.id, row.category, row.state, row.customer, row.description].join(" ").toLowerCase().includes(query) && (category === "all" || row.category === category) && (state === "all" || row.state === state) && (control === "all" || row.control === control)).sort((a, b) => (sort === "descending" ? -1 : 1) * (a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id, "en")));
}
