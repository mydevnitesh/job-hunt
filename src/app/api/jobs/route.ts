import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// In-memory cache with 24-hour TTL (backed by GitHub for persistence)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const GITHUB_CACHE_URL =
  "https://raw.githubusercontent.com/mydevnitesh/job-hunt/main/data/jobs.json";

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

interface CachedJobData {
  lastUpdated: string;
  data: Array<{
    job_id: string;
    job_employment_type?: string;
    job_is_remote?: boolean;
    job_posted_at_datetime_utc?: string;
    [key: string]: unknown;
  }>;
}

// Try to load cached jobs from GitHub
async function getGitHubCache(): Promise<CachedJobData | null> {
  try {
    const response = await axios.get(GITHUB_CACHE_URL, { timeout: 5000 });
    const data = response.data as CachedJobData;

    // Check if cache is less than 48 hours old (allow some buffer beyond 24h cron)
    if (data.lastUpdated) {
      const cacheAge = Date.now() - new Date(data.lastUpdated).getTime();
      if (cacheAge < 48 * 60 * 60 * 1000) {
        return data;
      }
    }
    return null;
  } catch {
    return null;
  }
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

  // 1. Check in-memory cache first
  const memCached = getCached(cacheKey);
  if (memCached) {
    return NextResponse.json(memCached);
  }

  // 2. Try GitHub cached data (no API tokens used)
  const ghCache = await getGitHubCache();
  if (ghCache && ghCache.data.length > 0) {
    let jobs = ghCache.data;

    // Apply client-side filters on cached data
    if (employment_types) {
      const types = employment_types.split(",");
      jobs = jobs.filter((j) => types.includes(j.job_employment_type || ""));
    }
    if (remote_jobs_only === "true") {
      jobs = jobs.filter((j) => j.job_is_remote);
    }
    if (date_posted && date_posted !== "all") {
      const now = Date.now();
      const cutoffs: Record<string, number> = {
        today: 1,
        "3days": 3,
        week: 7,
        month: 30,
      };
      const days = cutoffs[date_posted] || 9999;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      jobs = jobs.filter((j) => {
        if (!j.job_posted_at_datetime_utc) return false;
        return new Date(j.job_posted_at_datetime_utc).getTime() >= cutoff;
      });
    }

    // Paginate (10 per page)
    const pageNum = parseInt(page, 10) || 1;
    const perPage = 10;
    const start = (pageNum - 1) * perPage;
    const paginatedJobs = jobs.slice(start, start + perPage);

    const result = {
      status: "OK",
      request_id: "cached",
      data: paginatedJobs,
      parameters: { query, page, date_posted, remote_jobs_only },
      cached: true,
      lastUpdated: ghCache.lastUpdated,
      totalAvailable: jobs.length,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  }

  // 3. Fallback: fetch directly from JSearch API (uses tokens)
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
