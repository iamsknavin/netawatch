import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { formatIndianCurrency } from "@/lib/formatters";
import { HOUSE_LABELS, INDIAN_STATES } from "@/lib/utils";
import { PoliticianCard } from "@/components/politician/PoliticianCard";
import type { PoliticianCard as PoliticianCardType } from "@/types";

export const revalidate = 3600;

interface SearchParams {
  q?: string;
  house?: string;
  state?: string;
  party?: string;
  cases?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 50;

async function getPoliticians(params: SearchParams) {
  const supabase = await createServerClient();

  const page = Math.max(1, parseInt(params.page ?? "1"));
  const offset = (page - 1) * PAGE_SIZE;
  const sort = params.sort ?? "name";

  let query = supabase
    .from("politicians")
    .select(
      `
      id, name, slug, profile_image_url, constituency, state, house, is_active,
      parties (id, name, abbreviation, logo_url),
      assets_declarations (net_worth, declaration_year),
      criminal_cases (id)
    `,
      { count: "exact" }
    )
    .eq("is_active", true);

  if (params.house) query = query.eq("house", params.house);
  if (params.state) query = query.ilike("state", `%${params.state}%`);
  if (params.cases === "yes")
    query = query.gt("criminal_cases.count", 0);

  // Sorting
  if (sort === "name") query = query.order("name", { ascending: true });
  else if (sort === "name_desc") query = query.order("name", { ascending: false });

  const { data, count } = await query.range(offset, offset + PAGE_SIZE - 1);

  // Map to PoliticianCard type
  const mapped: PoliticianCardType[] = (data ?? []).map((p) => {
    const assets = (p.assets_declarations as Array<{ net_worth: number | null; declaration_year: number }> | null) ?? [];
    const latest = assets.sort((a, b) => b.declaration_year - a.declaration_year)[0];
    return {
      ...p,
      parties: p.parties as PoliticianCardType["parties"],
      latest_net_worth: latest?.net_worth ?? null,
      criminal_case_count: (p.criminal_cases as Array<{ id: string }> | null)?.length ?? 0,
    } as PoliticianCardType;
  });

  // Sort by net_worth client-side (Supabase doesn't sort across joins easily)
  if (sort === "net_worth_desc") {
    mapped.sort((a, b) => (b.latest_net_worth ?? -1) - (a.latest_net_worth ?? -1));
  } else if (sort === "net_worth_asc") {
    mapped.sort((a, b) => (a.latest_net_worth ?? Infinity) - (b.latest_net_worth ?? Infinity));
  } else if (sort === "cases_desc") {
    mapped.sort((a, b) => b.criminal_case_count - a.criminal_case_count);
  }

  return { politicians: mapped, total: count ?? 0, page, pages: Math.ceil((count ?? 0) / PAGE_SIZE) };
}

async function getParties() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("parties")
    .select("id, name, abbreviation")
    .order("name");
  return data ?? [];
}

export default async function PoliticiansPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [{ politicians, total, page, pages }, parties] = await Promise.all([
    getPoliticians(params),
    getParties(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-mono text-xl font-semibold text-text-primary mb-1">
          Browse MPs
        </h1>
        <p className="text-text-secondary text-sm">
          {total.toLocaleString("en-IN")} politicians tracked
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-56 shrink-0">
          <form className="space-y-6 sticky top-20">
            <div>
              <label className="block font-mono text-2xs text-text-muted uppercase tracking-widest mb-2">
                House
              </label>
              <div className="space-y-1">
                {[
                  { value: "", label: "All" },
                  { value: "lok_sabha", label: "Lok Sabha" },
                  { value: "rajya_sabha", label: "Rajya Sabha" },
                ].map((opt) => (
                  <Link
                    key={opt.value}
                    href={{
                      pathname: "/politicians",
                      query: { ...params, house: opt.value || undefined, page: undefined },
                    }}
                    className={`block text-xs font-mono px-2 py-1.5 rounded-sm border transition-colors ${
                      (params.house ?? "") === opt.value
                        ? "border-accent text-accent bg-accent/10"
                        : "border-border text-text-secondary hover:border-text-secondary"
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-2xs text-text-muted uppercase tracking-widest mb-2">
                State
              </label>
              <select
                name="state"
                defaultValue={params.state ?? ""}
                className="w-full bg-surface-2 border border-border text-text-primary text-xs font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-accent"
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value) url.searchParams.set("state", e.target.value);
                  else url.searchParams.delete("state");
                  url.searchParams.delete("page");
                  window.location.href = url.toString();
                }}
              >
                <option value="">All States</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.slug} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-2xs text-text-muted uppercase tracking-widest mb-2">
                Criminal Cases
              </label>
              <div className="space-y-1">
                {[
                  { value: "", label: "Any" },
                  { value: "yes", label: "Has cases" },
                ].map((opt) => (
                  <Link
                    key={opt.value}
                    href={{
                      pathname: "/politicians",
                      query: { ...params, cases: opt.value || undefined, page: undefined },
                    }}
                    className={`block text-xs font-mono px-2 py-1.5 rounded-sm border transition-colors ${
                      (params.cases ?? "") === opt.value
                        ? "border-accent text-accent bg-accent/10"
                        : "border-border text-text-secondary hover:border-text-secondary"
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-2xs text-text-muted uppercase tracking-widest mb-2">
                Sort By
              </label>
              <div className="space-y-1">
                {[
                  { value: "name", label: "Name A–Z" },
                  { value: "net_worth_desc", label: "Richest first" },
                  { value: "net_worth_asc", label: "Poorest first" },
                  { value: "cases_desc", label: "Most cases" },
                ].map((opt) => (
                  <Link
                    key={opt.value}
                    href={{
                      pathname: "/politicians",
                      query: { ...params, sort: opt.value, page: undefined },
                    }}
                    className={`block text-xs font-mono px-2 py-1.5 rounded-sm border transition-colors ${
                      (params.sort ?? "name") === opt.value
                        ? "border-accent text-accent bg-accent/10"
                        : "border-border text-text-secondary hover:border-text-secondary"
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(params.house || params.state || params.cases || params.sort) && (
              <Link
                href="/politicians"
                className="block text-2xs font-mono text-text-muted hover:text-danger transition-colors"
              >
                × Clear filters
              </Link>
            )}
          </form>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {politicians.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center rounded-sm">
              <p className="font-mono text-text-secondary text-sm">
                No politicians found
              </p>
              <Link
                href="/politicians"
                className="text-xs font-mono text-accent hover:underline mt-2 inline-block"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {politicians.map((p) => (
                <PoliticianCard key={p.id} politician={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <p className="text-xs font-mono text-text-muted">
                Page {page} of {pages} · {total.toLocaleString("en-IN")} total
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={{
                      pathname: "/politicians",
                      query: { ...params, page: page - 1 },
                    }}
                    className="font-mono text-xs border border-border px-3 py-1.5 text-text-secondary hover:border-accent hover:text-accent transition-colors rounded-sm"
                  >
                    ← Prev
                  </Link>
                )}
                {page < pages && (
                  <Link
                    href={{
                      pathname: "/politicians",
                      query: { ...params, page: page + 1 },
                    }}
                    className="font-mono text-xs border border-border px-3 py-1.5 text-text-secondary hover:border-accent hover:text-accent transition-colors rounded-sm"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
