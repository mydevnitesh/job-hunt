import { Job, JobSearchResponse, SearchParams } from "./types";

const BASE_URL = "/api/jobs";

export async function searchJobs(params: SearchParams): Promise<JobSearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.query) searchParams.set("query", params.query);
  if (params.page) searchParams.set("page", params.page);
  if (params.date_posted) searchParams.set("date_posted", params.date_posted);
  if (params.remote_jobs_only) searchParams.set("remote_jobs_only", params.remote_jobs_only);
  if (params.employment_types) searchParams.set("employment_types", params.employment_types);

  const res = await fetch(`${BASE_URL}?${searchParams.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch jobs");
  }
  return res.json();
}

export async function getJobDetails(jobId: string): Promise<Job | null> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch job details");
  }
  const data = await res.json();
  return data.data?.[0] || null;
}

export function formatSalary(job: Job): string {
  if (job.job_min_salary && job.job_max_salary) {
    const currency = job.job_salary_currency || "INR";
    const period = job.job_salary_period || "YEAR";
    const min = formatNumber(job.job_min_salary);
    const max = formatNumber(job.job_max_salary);
    return `${currency} ${min} - ${max} / ${period.toLowerCase()}`;
  }
  if (job.job_min_salary) {
    const currency = job.job_salary_currency || "INR";
    return `${currency} ${formatNumber(job.job_min_salary)}+`;
  }
  return "Salary not disclosed";
}

function formatNumber(num: number): string {
  if (num >= 100000) {
    return `${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}

export function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const posted = new Date(dateStr);
  const diffMs = now.getTime() - posted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function buildMailtoLink(job: Job, resumeUrl: string): string {
  const subject = encodeURIComponent(`Application for ${job.job_title} - Chartered Accountant`);
  const body = encodeURIComponent(
    `Dear Hiring Manager,\n\nI am writing to express my interest in the ${job.job_title} position at ${job.employer_name}.\n\nAs a qualified Chartered Accountant with 5+ years of experience in financial analysis, FP&A, credit risk management, and audit & compliance, I believe I would be a strong fit for this role.\n\nPlease find my resume at: ${resumeUrl}\n\nI look forward to discussing this opportunity.\n\nBest regards,\nDurva Chalak\n+91-8237201498\ndurvachalak168@gmail.com`
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

// Min salary filter: 10 LPA = 1,000,000 INR
const MIN_SALARY_THRESHOLD = 1000000;

export function filterBySalary(jobs: Job[]): Job[] {
  return jobs.filter((job) => {
    // Always show jobs with undisclosed salary
    if (!job.job_min_salary && !job.job_max_salary) return true;
    // If salary is disclosed, check if it meets minimum threshold
    const salary = job.job_max_salary || job.job_min_salary || 0;
    // Handle yearly salaries
    if (salary >= MIN_SALARY_THRESHOLD) return true;
    // Some salaries might be monthly — convert
    if (job.job_salary_period === "MONTH" && salary * 12 >= MIN_SALARY_THRESHOLD) return true;
    // If salary is clearly below threshold, still show (might be in different currency)
    if (job.job_salary_currency && job.job_salary_currency !== "INR") return true;
    return salary >= MIN_SALARY_THRESHOLD;
  });
}
