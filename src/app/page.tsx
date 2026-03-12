"use client";

import { useState, useEffect, useCallback } from "react";
import { Job } from "@/lib/types";
import { searchJobs, filterBySalary, filterByDate, sortByDate } from "@/lib/api";
import JobCard from "@/components/JobCard";
import SearchFilters from "@/components/SearchFilters";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [applySalaryFilter, setApplySalaryFilter] = useState(true);
  const [lastSearchParams, setLastSearchParams] = useState({
    query: "Chartered Accountant in Pune, India",
    location: "Pune, India",
    date_posted: "all",
    remote_jobs_only: "false",
    employment_types: "",
  });

  const fetchJobs = useCallback(
    async (params: {
      query: string;
      location: string;
      date_posted: string;
      remote_jobs_only: string;
      employment_types: string;
      page?: number;
    }) => {
      setIsLoading(true);
      setError(null);
      setLastSearchParams(params);

      try {
        const result = await searchJobs({
          query: params.query,
          page: String(params.page || 1),
          date_posted: params.date_posted,
          remote_jobs_only: params.remote_jobs_only,
          employment_types: params.employment_types,
        });

        if (result.data && Array.isArray(result.data)) {
          setJobs(result.data);
        } else {
          setJobs([]);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch jobs";
        setError(message);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchJobs({
      query: "Chartered Accountant in Pune, India",
      location: "Pune, India",
      date_posted: "all",
      remote_jobs_only: "false",
      employment_types: "",
    });
  }, [fetchJobs]);

  const handleSearch = (params: {
    query: string;
    location: string;
    date_posted: string;
    remote_jobs_only: string;
    employment_types: string;
  }) => {
    setPage(1);
    fetchJobs({ ...params, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchJobs({ ...lastSearchParams, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter out jobs older than 3 months, sort newest first, then apply salary filter
  const recentJobs = sortByDate(filterByDate(jobs));
  const displayedJobs = applySalaryFilter ? filterBySalary(recentJobs) : recentJobs;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">CA Job Finder</h1>
          <p className="text-blue-200 text-lg">
            Find Chartered Accountant &amp; Finance opportunities — Pune &amp; Remote
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <SearchFilters onSearch={handleSearch} isLoading={isLoading} />

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {isLoading
              ? "Searching..."
              : error
              ? ""
              : `${displayedJobs.length} job${displayedJobs.length !== 1 ? "s" : ""} found`}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={applySalaryFilter}
              onChange={(e) => setApplySalaryFilter(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Min 10 LPA salary filter
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <p className="text-red-500 text-sm">
              Try adjusting your search or check back later.
            </p>
          </div>
        )}

        {isLoading && <LoadingSkeleton />}

        {!isLoading && !error && displayedJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedJobs.map((job) => (
              <JobCard key={job.job_id} job={job} />
            ))}
          </div>
        )}

        {!isLoading && !error && displayedJobs.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">No jobs found</p>
            <p className="text-gray-400 text-sm">
              Try broadening your search, changing the role category, or disabling the salary filter.
            </p>
          </div>
        )}

        {!isLoading && displayedJobs.length > 0 && (
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">Page {page}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">CA Job Finder — Powered by JSearch API</p>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            📄 View Resume
          </a>
        </div>
      </footer>
    </div>
  );
}
