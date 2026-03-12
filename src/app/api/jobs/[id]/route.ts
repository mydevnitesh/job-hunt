import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cacheKey = `job:${id}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const response = await axios.get(
      "https://jsearch.p.rapidapi.com/job-details",
      {
        params: { job_id: id, extended_publisher_details: "false" },
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
    console.error("JSearch job details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details. Please try again." },
      { status: 500 }
    );
  }
}
