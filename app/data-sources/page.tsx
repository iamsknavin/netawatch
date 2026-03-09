import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase";
import { DATA_SOURCES } from "@/lib/config";
import { formatRelativeTime } from "@/lib/formatters";

export const metadata: Metadata = { title: "Data Sources" };
export const revalidate = 3600;

async function getDataStats() {
  const supabase = await createServerClient();
  const [politicians, cases, assets, parties, attendance] = await Promise.all([
    supabase.from("politicians").select("id, updated_at", { count: "exact" }),
    supabase.from("criminal_cases").select("id", { count: "exact" }),
    supabase.from("assets_declarations").select("id", { count: "exact" }),
    supabase.from("parties").select("id", { count: "exact" }),
    supabase.from("attendance_records").select("id", { count: "exact" }),
  ]);

  const politicianRows = politicians.data as { id: string; updated_at: string }[] | null;
  const lastScraped =
    politicianRows && politicianRows.length > 0
      ? politicianRows.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0]?.updated_at
      : null;

  return {
    politicians: politicians.count ?? 0,
    criminal_cases: cases.count ?? 0,
    assets_declarations: assets.count ?? 0,
    parties: parties.count ?? 0,
    attendance: attendance.count ?? 0,
    lastScraped,
  };
}

export default async function DataSourcesPage() {
  const stats = await getDataStats();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="font-mono text-accent text-xs uppercase tracking-widest mb-3">
          Transparency
        </p>
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Data Sources
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Every data point on NETAwatch is sourced from mandatory public
          disclosures. Here&apos;s what we collect, from where, and when it was
          last updated.
        </p>
      </div>

      {/* Current record counts */}
      <section className="mb-12">
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest mb-4">
          Current Database
        </h2>
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Table</th>
                <th>Records</th>
                <th>Last Updated</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {[
                { table: "Politicians", count: stats.politicians, source: "MyNeta / ADR + ECI", updated: stats.lastScraped },
                { table: "Criminal Cases", count: stats.criminal_cases, source: "ECI Affidavits (via MyNeta)", updated: stats.lastScraped },
                { table: "Asset Declarations", count: stats.assets_declarations, source: "ECI Affidavits (via MyNeta)", updated: stats.lastScraped },
                { table: "Parties", count: stats.parties, source: "Manual + ECI", updated: "Seed data" },
                { table: "Attendance Records", count: stats.attendance, source: "PRS India (Phase 2)", updated: "Pending" },
                { table: "Company Interests", count: 0, source: "MCA21 (Phase 2)", updated: "Pending" },
                { table: "Govt Tenders", count: 0, source: "GeM / CPPP (Phase 2)", updated: "Pending" },
                { table: "Fund Usage", count: 0, source: "MPLAD Portal (Phase 3)", updated: "Pending" },
                { table: "Controversies", count: 0, source: "News (Phase 3)", updated: "Pending" },
              ].map((row) => (
                <tr key={row.table}>
                  <td className="font-mono text-text-primary">{row.table}</td>
                  <td className="font-mono text-accent">
                    {typeof row.count === "number"
                      ? row.count.toLocaleString("en-IN")
                      : row.count}
                  </td>
                  <td className="font-mono text-text-secondary text-xs">
                    {typeof row.updated === "string" && row.updated !== "Pending" && row.updated !== "Seed data"
                      ? formatRelativeTime(row.updated)
                      : row.updated}
                  </td>
                  <td className="text-text-secondary text-xs">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Source details */}
      <section>
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest mb-4">
          Source Details
        </h2>
        <div className="space-y-3">
          {Object.entries(DATA_SOURCES).map(([key, src]) => (
            <div key={key} className="bg-surface border border-border rounded-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-text-primary text-sm mb-1">
                    {src.name}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {src.description}
                  </p>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-mono text-2xs border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors px-2 py-1 rounded-sm"
                >
                  Visit ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 bg-surface border border-border rounded-sm p-6">
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest mb-3">
          Update Frequency
        </h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>
            <strong className="text-text-primary">Phase 1:</strong> Data is scraped manually before elections and updated on demand. Run the scraper locally to refresh.
          </p>
          <p>
            <strong className="text-text-primary">Phase 2:</strong> Celery + Redis scheduled scraping (weekly for MyNeta, monthly for MCA21/GeM).
          </p>
          <p>
            <strong className="text-text-primary">Phase 3:</strong> eCourts live tracking + daily news controversy pipeline.
          </p>
        </div>
      </section>
    </div>
  );
}
