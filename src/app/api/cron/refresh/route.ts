import { NextResponse } from "next/server";
import axios from "axios";

// All role queries to fetch
const QUERIES = [
  "Chartered Accountant in Pune, India",
  "Corporate Finance CA in Pune, India",
  "Financial Planning and Analysis in Pune, India",
  "Accounting Finance CA in Pune, India",
  "Risk Analyst CA in Pune, India",
  "Equity Markets CA in Pune, India",
];

const MAX_AGE_DAYS = 90;

interface JobResult {
  job_id: string;
  job_posted_at_datetime_utc: string | null;
  [key: string]: unknown;
}

async function fetchJobsForQuery(query: string): Promise<JobResult[]> {
  try {
    const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
      params: {
        query,
        page: "1",
        num_pages: "1",
        date_posted: "all",
        remote_jobs_only: "false",
      },
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    });
    return response.data?.data || [];
  } catch (error) {
    console.error(`Failed to fetch jobs for query "${query}":`, error);
    return [];
  }
}

function filterAndSort(jobs: JobResult[]): JobResult[] {
  const now = Date.now();
  const cutoff = now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  // Filter: must have a date and be within 3 months
  const filtered = jobs.filter((job) => {
    if (!job.job_posted_at_datetime_utc) return false;
    const posted = new Date(job.job_posted_at_datetime_utc).getTime();
    return posted >= cutoff;
  });

  // Sort newest first
  filtered.sort((a, b) => {
    const dateA = a.job_posted_at_datetime_utc
      ? new Date(a.job_posted_at_datetime_utc).getTime()
      : 0;
    const dateB = b.job_posted_at_datetime_utc
      ? new Date(b.job_posted_at_datetime_utc).getTime()
      : 0;
    return dateB - dateA;
  });

  return filtered;
}

async function saveToGitHub(data: object): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  const repo = "mydevnitesh/job-hunt";
  const path = "data/jobs.json";
  const branch = "main";

  if (!token) {
    console.error("GITHUB_TOKEN not set");
    return false;
  }

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

  // Check if file exists to get its SHA (needed for updates)
  let sha: string | undefined;
  try {
    const existing = await axios.get(
      `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`,
      { headers: { Authorization: `token ${token}` } }
    );
    sha = existing.data.sha;
  } catch {
    // File doesn't exist yet, that's fine
  }

  try {
    await axios.put(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        message: "chore: update cached job data [automated]",
        content,
        branch,
        ...(sha ? { sha } : {}),
      },
      { headers: { Authorization: `token ${token}` } }
    );
    return true;
  } catch (error) {
    console.error("Failed to save to GitHub:", error);
    return false;
  }
}

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow access if CRON_SECRET is not set (for manual testing)
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log("Starting daily job refresh...");

  // Fetch jobs for all queries
  const allJobs: JobResult[] = [];
  const seenIds = new Set<string>();

  for (const query of QUERIES) {
    const jobs = await fetchJobsForQuery(query);
    for (const job of jobs) {
      if (!seenIds.has(job.job_id)) {
        seenIds.add(job.job_id);
        allJobs.push(job);
      }
    }
    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Filter and sort
  const processedJobs = filterAndSort(allJobs);

  const cacheData = {
    lastUpdated: new Date().toISOString(),
    totalJobs: processedJobs.length,
    queries: QUERIES,
    data: processedJobs,
  };

  // Save to GitHub
  const saved = await saveToGitHub(cacheData);

  console.log(
    `Job refresh complete: ${processedJobs.length} jobs (${allJobs.length} total fetched, ${allJobs.length - processedJobs.length} filtered out)`
  );

  return NextResponse.json({
    success: true,
    saved,
    totalFetched: allJobs.length,
    totalAfterFilter: processedJobs.length,
    lastUpdated: cacheData.lastUpdated,
  });
}
