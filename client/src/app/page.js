"use client"

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [generatedResponse, setGeneratedResponse] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMatchPercentage(null);

    if (!resumeFile || !jobDescription) {
      setError("Please provide both a resume and a job description.");
      return;
    }

    const formData = new FormData();
    formData.append("job_description", jobDescription);
    formData.append("resume_file", resumeFile);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMatchPercentage(response.data.match_percentage);
    } catch (error) {
      setError("An error occurred while uploading the file.");
    }
  };

  const fetchGeneratedResponse = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/response");
      setGeneratedResponse(response.data.generated_response);
    } catch (error) {
      setError("An error occurred while fetching the generated response.");
    }
  };

  const fetchSuggestions = async () => {
    if (!matchPercentage || !jobRole) {
      setError("Please provide both a match percentage and a job role.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5000/suggestions", {
        matchPercentage: matchPercentage,
        jobRole: jobRole,
        resume_text: generatedResponse.resume_text,
        jobDescription: jobDescription
      });

      setSuggestions(response.data.suggestions);
    } catch (error) {
      setError("An error occurred while fetching the suggestions.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            ResumeAI
          </h1>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="job-description" className="sr-only">
                Job Description
              </label>
              <textarea
                id="job-description"
                name="job_description"
                rows="4"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Job Description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="resume-file" className="sr-only">
                Upload Resume
              </label>
              <input
                id="resume-file"
                name="resume_file"
                type="file"
                accept=".pdf,.docx"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Analyze Resume
            </button>
          </div>
          <div>
            <button
              type="button"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mt-4"
              onClick={fetchGeneratedResponse}
            >
              Fetch Generated Response
            </button>
          </div>
          <div>
            <label htmlFor="job-role" className="sr-only">
              Job Role
            </label>
            <input
              id="job-role"
              name="job_role"
              type="text"
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Job Role"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
          </div>
          <div>
            <button
              type="button"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-4"
              onClick={fetchSuggestions}
            >
              Fetch Suggestions
            </button>
          </div>
          {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
          {matchPercentage !== null && (
            <p className="mt-2 text-center text-sm text-green-600">
              Job Description Match Percentage: {matchPercentage}%
            </p>
          )}
          {generatedResponse && (
            <pre className="mt-4 p-4 bg-gray-200 rounded">
              {JSON.stringify(generatedResponse, null, 2)}
            </pre>
          )}
          {suggestions && (
            <pre className="mt-4 p-4 bg-gray-200 rounded">
              {JSON.stringify(suggestions, null, 2)}
            </pre>
          )}
        </form>
      </div>
    </div>
  );
}
