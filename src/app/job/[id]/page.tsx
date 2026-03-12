"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Job } from "@/lib/types";
import { getJobDetails, formatSalary, getTimeAgo, buildMailtoLink } from "@/lib/api";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const jobId = params.id as string;
    if (!jobId) return;

    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const data = await getJobDetails(jobId);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-900 text-white">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm mb-2 inline-block">
              ← Back to Jobs
            </button>
            <div className="h-8 bg-blue-800 rounded w-2/3 animate-pulse" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-900 text-white">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm">
              ← Back to Jobs
            </button>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-600 font-medium">{error || "Job not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const salary = formatSalary(job);
  const timeAgo = getTimeAgo(job.job_posted_at_datetime_utc);
  const location = job.job_is_remote
    ? "Remote"
    : [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ");
  const resumeUrl = typeof window !== "undefined" ? `${window.location.origin}/resume.pdf` : "/resume.pdf";
  const mailtoLink = buildMailtoLink(job, resumeUrl);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="text-blue-200 hover:text-white text-sm mb-3 inline-block"
          >
            ← Back to Jobs
          </button>
          <div className="flex items-start gap-4">
            {job.employer_logo ? (
              <img
                src={job.employer_logo}
                alt={job.employer_name}
                className="w-16 h-16 rounded-xl object-contain bg-white border border-blue-700 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-blue-800 border border-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-2xl">
                  {job.employer_name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{job.job_title}</h1>
              <p className="text-blue-200 text-lg">{job.employer_name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-5">
            <span className="inline-flex items-center text-sm px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
              {location}
            </span>
            {job.job_is_remote && (
              <span className="inline-flex items-center text-sm px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">
                Remote
              </span>
            )}
            {job.job_employment_type && (
              <span className="inline-flex items-center text-sm px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                {job.job_employment_type === "FULLTIME" ? "Full-time" :
                 job.job_employment_type === "PARTTIME" ? "Part-time" :
                 job.job_employment_type === "CONTRACTOR" ? "Contract" :
                 job.job_employment_type === "INTERN" ? "Internship" : job.job_employment_type}
              </span>
            )}
            <span className={`inline-flex items-center text-sm px-3 py-1.5 rounded-full font-semibold ${
              salary === "Salary not disclosed" ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"
            }`}>
              {salary}
            </span>
            <span className="inline-flex items-center text-sm px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">
              {timeAgo}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={job.job_apply_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Apply Now →
            </a>
            <a
              href={mailtoLink}
              className="inline-flex items-center px-6 py-3 border-2 border-blue-900 text-blue-900 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Quick Apply via Email
            </a>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Download Resume
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
          <div
            className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: job.job_description || "No description available." }}
          />
        </div>

        {job.job_highlights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {job.job_highlights.Qualifications && job.job_highlights.Qualifications.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Qualifications</h3>
                <ul className="space-y-2">
                  {job.job_highlights.Qualifications.map((q, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">&bull;</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {job.job_highlights.Responsibilities && job.job_highlights.Responsibilities.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Responsibilities</h3>
                <ul className="space-y-2">
                  {job.job_highlights.Responsibilities.map((r, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">&bull;</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {job.job_highlights.Benefits && job.job_highlights.Benefits.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 md:col-span-2">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Benefits</h3>
                <ul className="space-y-2">
                  {job.job_highlights.Benefits.map((b, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">&bull;</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {job.job_required_skills && job.job_required_skills.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.job_required_skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-6">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">CA Job Finder — Powered by JSearch API</p>
          <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View Resume
          </a>
        </div>
      </footer>
    </div>
  );
}
