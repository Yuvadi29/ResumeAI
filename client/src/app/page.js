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

  const fetchGeneratedResponse = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/response");
      setGeneratedResponse(response.data.generated_response);
    } catch (error) {
      console.error("Error fetching generated response:", error);
      setError("An error occurred while fetching the generated response.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMatchPercentage(null);

    if (!resumeFile || !jobDescription || !jobRole) {
      setError("Please provide a resume, job description, and job role.");
      return;
    }

    const formData = new FormData();
    formData.append("job_description", jobDescription);
    formData.append("job_role", jobRole);
    formData.append("resume_file", resumeFile);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMatchPercentage(response.data.match_percentage);
      await fetchGeneratedResponse(); // Ensure this completes before proceeding
    } catch (error) {
      console.error("Error uploading the file:", error);
      setError("An error occurred while uploading the file.");
    }
  };

  const fetchSuggestions = async () => {
    if (!matchPercentage || !jobRole || !generatedResponse) {
      setError("Please provide both a match percentage, job role, and ensure the response is generated.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5000/suggestions", {
        matchPercentage: matchPercentage,
        jobRole: jobRole,
        resume_text: generatedResponse.resume_text,
        jobDescription: jobDescription
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
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
              <label htmlFor="job-role" className="sr-only">
                Job Role
              </label>
              <input
                id="job-role"
                name="job_role"
                type="text"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Job Role"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="job-description" className="sr-only">
                Job Description
              </label>
              <textarea
                id="job-description"
                name="job_description"
                rows="4"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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

          {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
          {matchPercentage !== null ? (
            <p className="mt-2 text-center text-sm text-green-600">
              Job Description Match Percentage: {matchPercentage}%
            </p>
          ) : (
            <p>Analyzing Resume...</p>
          )}
          <div>
            <button
              type="button"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-4"
              onClick={fetchSuggestions}
            >
              Fetch Suggestions
            </button>
          </div>

          {generatedResponse && (
            <div className="mt-4 p-4 bg-gray-200 rounded">
              <h2 className="text-xl font-bold mb-2">Generated Response:</h2>
              <p className="mb-2"><strong>Match Percentage:</strong> {matchPercentage} %</p>
              <p className="mb-2"><strong>Missing Keywords:</strong> {generatedResponse?.missing_keywords}</p>
              <p className="mb-2"><strong>Candidate Summary:</strong> {generatedResponse?.candidate_summary}</p>
              <p className="mb-2"><strong>Experience:</strong> {generatedResponse?.experience}</p>
            </div>
          )}
          {suggestions && (
            <div className="mt-4 p-4 bg-gray-200 rounded">
              <h2 className="text-xl font-bold mb-2">Suggestions:</h2>
              <p>{suggestions}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
