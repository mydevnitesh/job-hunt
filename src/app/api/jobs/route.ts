import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Simple in-memory cache with 5-minute TTL
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query") || "Chartered Accountant";
  const page = searchParams.get("page") || "1";
  const date_posted = searchParams.get("date_posted") || "all";
  const remote_jobs_only = searchParams.get("remote_jobs_only") || "false";
  const employment_types = searchParams.get("employment_types") || "";
  const num_pages = searchParams.get("num_pages") || "1";

  const cacheKey = `search:${query}:${page}:${date_posted}:${remote_jobs_only}:${employment_types}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const params: Record<string, string> = {
      query,
      page,
      num_pages,
      date_posted,
      remote_jobs_only,
    };

    if (employment_types) {
      params.employment_types = employment_types;
    }

    const response = await axios.get(
      "https://jsearch.p.rapidapi.com/search",
      {
        params,
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );

    const result = response.data;
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return NextResponse.json(
        { error: "API rate limit reached. Please try again later." },
        { status: 429 }
      );
    }
    console.error("JSearch API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs. Please try again." },
      { status: 500 }
    );
  }
}
