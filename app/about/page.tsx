import type { Metadata } from "next";
import Link from "next/link";
import { DATA_SOURCES } from "@/lib/config";

export const metadata: Metadata = { title: "About NETAwatch" };

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="font-mono text-accent text-xs uppercase tracking-widest mb-3">
          About
        </p>
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          What is NETAwatch?
        </h1>
        <p className="text-text-secondary leading-relaxed">
          NETAwatch is an open-source platform that makes Indian politician
          public disclosures accessible, searchable, and understandable. We
          aggregate data from mandatory government sources and present it in
          a clear, consistent format.
        </p>
      </div>

      <section className="mb-10 space-y-4">
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest">
          The Problem
        </h2>
        <p className="text-text-secondary leading-relaxed text-sm">
          Indian politicians are required by law to disclose their assets,
          liabilities, and criminal cases before every election. This data
          exists — but it&apos;s buried in thousands of PDF affidavits across
          multiple government portals, formatted inconsistently, and nearly
          impossible to search or compare.
        </p>
        <p className="text-text-secondary leading-relaxed text-sm">
          NETAwatch solves this by scraping, parsing, and presenting the same
          public data in a fast, searchable interface.
        </p>
      </section>

      <section className="mb-10 space-y-4">
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest">
          What We Track (Phase 1)
        </h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          {[
            "Lok Sabha MPs (545 constituencies)",
            "Rajya Sabha MPs (245 seats)",
            "Asset declarations from ECI affidavits",
            "Criminal case disclosures",
            "Party affiliation and election history",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-accent font-mono mt-0.5">›</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10 space-y-4">
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest">
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { phase: 2, items: ["State MLAs (all states)", "Company ownership (MCA21)", "Government tender tracking", "Automated corruption signal flags"] },
            { phase: 3, items: ["MPLAD/MLALAD fund tracking", "eCourts live case status", "News controversy tracker", "Public API for journalists"] },
          ].map(({ phase, items }) => (
            <div key={phase} className="bg-surface border border-border rounded-sm p-4">
              <p className="font-mono text-2xs text-text-muted uppercase tracking-widest mb-3">
                Phase {phase}
              </p>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <span className="text-text-muted mt-0.5">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 space-y-4">
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest">
          Methodology
        </h2>
        <div className="space-y-3 text-sm text-text-secondary">
          <p>
            <strong className="text-text-primary">Net Worth</strong> = Total Assets − Total Liabilities, as declared in the ECI statutory affidavit filed before each election.
          </p>
          <p>
            <strong className="text-text-primary">Criminal Cases</strong> are self-declared by candidates in their affidavits. We display what politicians themselves disclose — including IPC section numbers and court names.
          </p>
          <p>
            <strong className="text-text-primary">Heinous Offences</strong> are cases involving IPC sections related to murder (302), rape (376), kidnapping (363–366), or financial fraud exceeding ₹1 crore.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest mb-4">
          Data Sources
        </h2>
        <div className="space-y-2">
          {Object.values(DATA_SOURCES).map((src) => (
            <a
              key={src.url}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-surface border border-border hover:border-accent/40 transition-colors p-3 rounded-sm group"
            >
              <div>
                <p className="font-mono text-sm text-text-primary group-hover:text-accent transition-colors">
                  {src.name}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{src.description}</p>
              </div>
              <span className="text-text-muted font-mono text-xs shrink-0 ml-4">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mb-10 bg-surface border border-border rounded-sm p-6">
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest mb-3">
          Disclaimer
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          All data on NETAwatch is sourced from mandatory public disclosures
          made by politicians themselves. NETAwatch does not make allegations —
          we present public records. For corrections or disputes, please file
          an issue on our GitHub repository.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mt-3">
          NETAwatch is not affiliated with the Government of India, the
          Election Commission of India, or any political party.
        </p>
      </section>

      <section>
        <h2 className="font-mono text-text-secondary text-xs uppercase tracking-widest mb-4">
          Open Source
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          NETAwatch is MIT licensed and open source. Contributions welcome.
        </p>
        <div className="flex gap-3">
          <a
            href="https://github.com/netawatch/netawatch"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-bg transition-colors"
          >
            GitHub →
          </a>
          <Link
            href="/data-sources"
            className="font-mono text-sm border border-border text-text-secondary px-4 py-2 hover:border-text-secondary transition-colors"
          >
            Data Sources
          </Link>
        </div>
      </section>
    </div>
  );
}
