import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { formatIndianCurrency } from "@/lib/formatters";
import { PoliticianCard } from "@/components/politician/PoliticianCard";
import { StatCard } from "@/components/ui/StatCard";
import type { PoliticianCard as PoliticianCardType, Party, PoliticianJoinRow } from "@/types";

export const revalidate = 3600;

async function getPartyData(slug: string) {
  const supabase = await createServerClient();

  // Try by abbreviation first, then by name
  const { data: partiesRaw } = await supabase
    .from("parties")
    .select("*");
  const parties = (partiesRaw ?? []) as Party[];

  if (parties.length === 0) return null;

  const party = parties.find(
    (p) =>
      p.abbreviation?.toLowerCase() === slug.toLowerCase() ||
      p.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase()
  );

  if (!party) return null;

  const { data: politicians } = await supabase
    .from("politicians")
    .select(`
      id, name, slug, profile_image_url, constituency, state, house, is_active, election_status,
      parties (id, name, abbreviation, logo_url),
      assets_declarations (net_worth, declaration_year),
      criminal_cases (id)
    `)
    .eq("party_id", party.id)
    .eq("is_active", true)
    .order("name") as { data: PoliticianJoinRow[] | null };

  const mapped: PoliticianCardType[] = (politicians ?? []).map((p) => {
    const assets = p.assets_declarations ?? [];
    const latest = assets.sort((a, b) => b.declaration_year - a.declaration_year)[0];
    return {
      ...p,
      parties: p.parties as PoliticianCardType["parties"],
      latest_net_worth: latest?.net_worth ?? null,
      criminal_case_count: (p.criminal_cases ?? []).length,
    } as PoliticianCardType;
  });

  const totalWealth = mapped.reduce((s, p) => s + (p.latest_net_worth ?? 0), 0);
  const totalCases = mapped.reduce((s, p) => s + p.criminal_case_count, 0);
  const avgWealth = mapped.length > 0 ? totalWealth / mapped.length : 0;

  return { party, politicians: mapped, totalWealth, totalCases, avgWealth };
}

export async function generateStaticParams() {
  const { createBrowserClient } = await import("@/lib/supabase");
  const supabase = createBrowserClient();
  const { data } = await supabase.from("parties").select("abbreviation, name") as { data: { abbreviation: string | null; name: string }[] | null };
  return (data ?? []).map((p) => ({
    slug: (p.abbreviation ?? p.name).toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPartyData(slug);
  if (!result) return { title: "Party not found" };
  return { title: result.party.name };
}

export default async function PartyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPartyData(slug);
  if (!result) notFound();

  const { party, politicians, totalWealth, totalCases, avgWealth } = result;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="font-mono text-2xs text-text-muted mb-6">
        <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
        <span className="mx-2">&rsaquo;</span>
        <Link href="/parties" className="hover:text-text-primary transition-colors">Parties</Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-text-secondary">{party.name}</span>
      </nav>

      <div className="mb-8">
        <p className="font-mono text-text-muted text-2xs uppercase tracking-widest mb-2">
          Political Party
        </p>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          {party.name}
        </h1>
        {party.ideology && (
          <p className="text-text-secondary text-sm">{party.ideology}</p>
        )}
        {party.founded_year && (
          <p className="text-text-muted text-xs font-mono mt-1">
            Est. {party.founded_year}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Current MPs" value={politicians.length} accent />
        <StatCard
          label="Total Criminal Cases"
          value={totalCases}
          danger={totalCases > 0}
        />
        <StatCard
          label="Combined Wealth"
          value={formatIndianCurrency(totalWealth)}
          accent
        />
        <StatCard
          label="Avg Net Worth"
          value={formatIndianCurrency(avgWealth)}
        />
      </div>

      <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest mb-4">
        Current Members ({politicians.length})
      </h2>

      {politicians.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center rounded-sm">
          <p className="font-mono text-text-secondary text-sm">No active MPs in this party yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {politicians.map((p) => (
            <PoliticianCard key={p.id} politician={p} />
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link
          href={`/politicians?party=${(party.abbreviation ?? party.name).toLowerCase()}`}
          className="inline-block font-mono text-xs text-text-secondary hover:text-accent transition-colors"
        >
          View in Browse &rarr;
        </Link>
      </div>
    </div>
  );
}
