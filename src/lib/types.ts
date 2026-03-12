export interface Job {
  job_id: string;
  employer_name: string;
  employer_logo: string | null;
  employer_website: string | null;
  job_title: string;
  job_description: string;
  job_apply_link: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_is_remote: boolean;
  job_posted_at_datetime_utc: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_employment_type: string;
  job_required_experience: {
    no_experience_required: boolean;
    required_experience_in_months: number | null;
    experience_mentioned: boolean;
    experience_preferred: boolean;
  } | null;
  job_required_skills: string[] | null;
  job_highlights: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  } | null;
}

export interface JobSearchResponse {
  status: string;
  request_id: string;
  data: Job[];
  parameters: Record<string, string>;
}

export interface SearchParams {
  query?: string;
  location?: string;
  page?: string;
  date_posted?: string;
  remote_jobs_only?: string;
  employment_types?: string;
}
