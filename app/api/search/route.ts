import { NextRequest, NextResponse } from "next/server";

const MEILISEARCH_HOST =
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST || "http://localhost:7700";
const SEARCH_KEY = process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY || "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
  const house = searchParams.get("house");
  const state = searchParams.get("state");

  if (!q.trim()) {
    return NextResponse.json({ hits: [], query: "", processingTimeMs: 0 });
  }

  try {
    const filters: string[] = ['is_active = true'];
    if (house) filters.push(`house = "${house}"`);
    if (state) filters.push(`state = "${state}"`);

    const body = {
      q: q.trim(),
      limit,
      filter: filters.length > 0 ? filters.join(" AND ") : undefined,
      attributesToHighlight: ["name", "party_name"],
    };

    const res = await fetch(
      `${MEILISEARCH_HOST}/indexes/politicians/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(SEARCH_KEY ? { Authorization: `Bearer ${SEARCH_KEY}` } : {}),
        },
        body: JSON.stringify(body),
        // Don't cache search results
        cache: "no-store",
      }
    );

    if (!res.ok) {
      // Meilisearch down or not configured — return empty
      return NextResponse.json({ hits: [], query: q, processingTimeMs: 0 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Search service unavailable — return empty gracefully
    return NextResponse.json({ hits: [], query: q, processingTimeMs: 0 });
  }
}
