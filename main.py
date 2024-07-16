from flask import Flask, request, jsonify
import os
import json
import requests
import PyPDF2 as pdf
import docx2txt
from dotenv import load_dotenv
import google.generativeai as genai
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for the Flask app


# Load the API KEY
genai.configure(api_key=os.getenv("API_KEY"))

# Setup Model Configuration
generation_config = {
    "temperature": 0.4,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 4096,
}

# Define safety settings for content generation
safety_settings = [
    {"category": f"HARM_CATEGORY_{category}", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
    for category in [
        "HARASSMENT",
        "HATE_SPEECH",
        "SEXUALLY_EXPLICIT",
        "DANGEROUS_CONTENT",
    ]
]

latest_response = None


def generate_response_from_gemini(input_text):
    # Create a GenAI model with gemini pro
    llm = genai.GenerativeModel(
        model_name="gemini-pro",
        generation_config=generation_config,
        safety_settings=safety_settings,
    )

    # Generate content
    output = llm.generate_content(input_text)

    # Return the content
    return output.text


def extract_text_from_pdf(uploaded_file):
    # Use PdfReader to read the text content from a PDF file
    pdf_reader = pdf.PdfReader(uploaded_file)
    text_content = ""
    for page in pdf_reader.pages:
        text_content += str(page.extract_text())
    return text_content


def extract_text_from_docx(uploaded_file):
    # Use docx2txt to extract text from a DOCX file
    return docx2txt.process(uploaded_file)


@app.route("/upload", methods=["POST"])
def upload_resume():
    job_description = request.form.get("job_description")
    uploaded_file = request.files["resume_file"]

    if uploaded_file.filename == "":
        return jsonify({"error": "No file uploaded"}), 400

    if uploaded_file and job_description:
        if uploaded_file.filename.endswith(".pdf"):
            resume_text = extract_text_from_pdf(uploaded_file)

        elif uploaded_file.filename.endswith("docx"):
            resume_text = extract_text_from_docx(uploaded_file)

        else:
            return jsonify({"error": "Unsupported File Type"}), 400

        input_prompt = """
            Act As an experienced Applicant Tracking System (ATS) analyst,
        with profound knowledge in technology, software engineering, data science, full stack web development, cloud enginner, 
        cloud developers, devops engineer and big data engineering, your role involves evaluating resumes against job descriptions.
        Recognizing the competitive job market, provide top-notch assistance for resume improvement.
        Your goal is to analyze the resume against the given job description, 
        assign a percentage match based on key criteria, and pinpoint missing keywords accurately.
        resume:{text}
        description:{job_description}
        I want the response in one single string having the structure
        {{"Job Description Match":"%","Missing Keywords":"","Candidate Summary":"","Experience":""}}
        """

        response_text = generate_response_from_gemini(
            input_prompt.format(text=resume_text, job_description=job_description)
        )

        # Extract Job Description Match percentage
        match_percentage_str = response_text.split('"Job Description Match":"')[
            1
        ].split('"')[0]

        # Remove percentage symbol
        match_percentage = float(match_percentage_str.strip("%"))

        result = {"match_percentage": match_percentage}

        return jsonify(result), 200

    return jsonify({"error": "Job description or file not provided"}), 400


@app.route("/response", methods=["GET"])
def get_response():
    global latest_response
    if latest_response:
        return jsonify({"generated_response": latest_response}), 200
    else:
        return jsonify({"error": "No response generated yet"}), 400


@app.route("/suggestions", methods=["POST"])
def get_suggestions():
    match_percentage = request.form.get("match_percentage")
    job_role = request.form.get("job_role")
    resume_text = request.form.get("resume_text")
    job_description = request.form.get("job_description")

    if not match_percentage or not job_role or not resume_text or not job_description:
        return jsonify({"error": "Missing Required Fields"}), 400

    input_prompt = """
        Act as an experienced career advisor with extensive knowledge in {job_role}. Given the current job description and the candidate's resume with a match percentage of {match_percentage}%, provide detailed suggestions on how to improve the resume to better match the job description. Include specific changes in skills, keywords, and formatting that can increase the match percentage.
        resume: {resume_text}
        description: {job_description}
        I want the response in one single string having the structure
        {{"Suggestions": ""}}
    """

    suggestions_response = generate_response_from_gemini(
        input_prompt.format(
            job_role=job_role,
            match_percentage=match_percentage,
            resume_text=resume_text,
            job_description=job_description,
        )
    )
    
    suggestions = suggestions_response.split('"Suggestions":"')[1].split('"')[0]
    result = {"suggestions": suggestions}
    
    return jsonify(result), 200


if __name__ == "__main__":
    app.run(debug=True)
