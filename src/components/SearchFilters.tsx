"use client";

import { useState } from "react";

const ROLE_CATEGORIES = [
  { label: "All Roles", value: "" },
  { label: "Chartered Accountant", value: "Chartered Accountant" },
  { label: "Corporate Finance", value: "Corporate Finance CA" },
  { label: "FP&A", value: "Financial Planning and Analysis" },
  { label: "Accounting & Finance", value: "Accounting Finance CA" },
  { label: "Risk Analyst", value: "Risk Analyst CA" },
  { label: "Equity Markets", value: "Equity Markets CA" },
];

const DATE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 3 Days", value: "3days" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

const EMPLOYMENT_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Full-time", value: "FULLTIME" },
  { label: "Part-time", value: "PARTTIME" },
  { label: "Contract", value: "CONTRACTOR" },
  { label: "Internship", value: "INTERN" },
];

interface SearchFiltersProps {
  onSearch: (params: {
    query: string;
    location: string;
    date_posted: string;
    remote_jobs_only: string;
    employment_types: string;
  }) => void;
  isLoading: boolean;
}

export default function SearchFilters({ onSearch, isLoading }: SearchFiltersProps) {
  const [query, setQuery] = useState("Chartered Accountant");
  const [location, setLocation] = useState("Pune, India");
  const [roleCategory, setRoleCategory] = useState("");
  const [datePosted, setDatePosted] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [employmentType, setEmploymentType] = useState("");

  const handleSearch = () => {
    const searchQuery = roleCategory || query;
    const fullQuery = location && !remoteOnly
      ? `${searchQuery} in ${location}`
      : searchQuery;

    onSearch({
      query: fullQuery,
      location,
      date_posted: datePosted,
      remote_jobs_only: remoteOnly ? "true" : "false",
      employment_types: employmentType,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      {/* Search inputs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Job title (e.g., Chartered Accountant)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
        <input
          type="text"
          placeholder="Location (e.g., Pune, India)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isLoading ? "Searching..." : "Search Jobs"}
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={roleCategory}
          onChange={(e) => setRoleCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        >
          {ROLE_CATEGORIES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={datePosted}
          onChange={(e) => setDatePosted(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        >
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        >
          {EMPLOYMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Remote Only
        </label>
      </div>
    </div>
  );
}
