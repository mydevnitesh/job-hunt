"use client";

import Link from "next/link";
import { Job } from "@/lib/types";
import { formatSalary, getTimeAgo } from "@/lib/api";

export default function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);
  const timeAgo = getTimeAgo(job.job_posted_at_datetime_utc);
  const location = job.job_is_remote
    ? "Remote"
    : [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ");

  return (
    <Link href={`/job/${encodeURIComponent(job.job_id)}`}>
      <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white cursor-pointer h-full flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          {job.employer_logo ? (
            <img
              src={job.employer_logo}
              alt={job.employer_name}
              className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-lg">
                {job.employer_name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
              {job.job_title}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">{job.employer_name}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            📍 {location}
          </span>
          {job.job_is_remote && (
            <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
              🌐 Remote
            </span>
          )}
          {job.job_employment_type && (
            <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {job.job_employment_type === "FULLTIME"
                ? "Full-time"
                : job.job_employment_type === "PARTTIME"
                ? "Part-time"
                : job.job_employment_type === "CONTRACTOR"
                ? "Contract"
                : job.job_employment_type === "INTERN"
                ? "Internship"
                : job.job_employment_type}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span
            className={`text-sm font-semibold ${
              salary === "Salary not disclosed"
                ? "text-gray-400"
                : "text-green-600"
            }`}
          >
            {salary}
          </span>
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}
