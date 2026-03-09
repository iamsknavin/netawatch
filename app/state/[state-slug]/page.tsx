import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase";
import { INDIAN_STATES } from "@/lib/utils";
import { PoliticianCard } from "@/components/politician/PoliticianCard";
import { StatCard } from "@/components/ui/StatCard";
import type { PoliticianCard as PoliticianCardType } from "@/types/politician";

export const revalidate = 3600;

async function getStateData(stateSlug: string) {
  const stateEntry = INDIAN_STATES.find((s) => s.slug === stateSlug);
  if (!stateEntry) return null;

  const stateName = stateEntry.name;
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("politicians")
    .select(`
      id, name, slug, profile_image_url, constituency, state, house, is_active,
      parties (id, name, abbreviation, logo_url),
      assets_declarations (net_worth, declaration_year),
      criminal_cases (id)
    `)
    .ilike("state", `%${stateName}%`)
    .eq("is_active", true)
    .order("name");

  const politicians: PoliticianCardType[] = (data ?? []).map((p) => {
    const assets = (p.assets_declarations as Array<{ net_worth: number | null; declaration_year: number }> | null) ?? [];
    const latest = assets.sort((a, b) => b.declaration_year - a.declaration_year)[0];
    return {
      ...p,
      parties: p.parties as PoliticianCardType["parties"],
      latest_net_worth: latest?.net_worth ?? null,
      criminal_case_count: (p.criminal_cases as Array<{ id: string }> | null)?.length ?? 0,
    } as PoliticianCardType;
  });

  const totalCases = politicians.reduce((s, p) => s + p.criminal_case_count, 0);
  const totalWealth = politicians.reduce((s, p) => s + (p.latest_net_worth ?? 0), 0);

  return { stateName, politicians, totalCases, totalWealth };
}

export async function generateStaticParams() {
  return INDIAN_STATES.map((s) => ({ "state-slug": s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "state-slug": string }>;
}): Promise<Metadata> {
  const slug = (await params)["state-slug"];
  const stateEntry = INDIAN_STATES.find((s) => s.slug === slug);
  if (!stateEntry) return { title: "State not found" };
  return { title: `${stateEntry.name} MPs` };
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ "state-slug": string }>;
}) {
  const stateSlug = (await params)["state-slug"];
  const result = await getStateData(stateSlug);
  if (!result) notFound();

  const { stateName, politicians, totalCases, totalWealth } = result;
  const lsMPs = politicians.filter((p) => p.house === "lok_sabha");
  const rsMPs = politicians.filter((p) => p.house === "rajya_sabha");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <p className="font-mono text-text-muted text-2xs uppercase tracking-widest mb-2">State</p>
        <h1 className="text-2xl font-bold text-text-primary">{stateName}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total MPs" value={politicians.length} accent />
        <StatCard label="Lok Sabha" value={lsMPs.length} />
        <StatCard label="Rajya Sabha" value={rsMPs.length} />
        <StatCard label="Criminal Cases" value={totalCases} danger={totalCases > 0} />
      </div>

      {politicians.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center rounded-sm">
          <p className="font-mono text-text-secondary text-sm">
            No MP data yet for {stateName}
          </p>
          <p className="text-2xs text-text-muted mt-1">Run the scraper to populate data</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {politicians.map((p) => (
            <PoliticianCard key={p.id} politician={p} />
          ))}
        </div>
      )}
    </div>
  );
}
