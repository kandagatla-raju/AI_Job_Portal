import requests
import fitz  # PyMuPDF for PDF text extraction
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import torch
from transformers import BertTokenizer, BertModel

app = FastAPI()

# ✅ Load Pretrained BERT Model
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
bert_model = BertModel.from_pretrained("bert-base-uncased")

# ✅ Expanded Skill Dictionary
SKILL_SYNONYMS = {
    "python": ["python", "django", "flask", "fastapi"],
    "java": ["java", "spring boot", "hibernate"],
    "javascript": ["javascript", "node.js", "react", "angular", "vue"],
    "typescript": ["typescript", "ts"],
    "c++": ["c++", "cpp", "stl"],
    "sql": ["sql", "mysql", "postgresql", "oracle"],
    "cloud": ["aws", "azure", "gcp"],
    "machine learning": ["ml", "tensorflow", "pytorch", "scikit-learn"],
    "data science": ["data analytics", "pandas", "numpy", "matplotlib"],
    "deep learning": ["cnn", "rnn", "lstm"],
    "nlp": ["natural language processing", "nltk", "spacy"],
    "blockchain": ["blockchain", "solidity", "web3", "ethereum"],
    "cybersecurity": ["ethical hacking", "penetration testing"],
}

ALL_SKILLS = set()
for synonyms in SKILL_SYNONYMS.values():
    ALL_SKILLS.update(synonyms)


class ResumeRequest(BaseModel):
    resume_url: str
    job_description: str
    job_requirements: str


# 📌 Download Resume from URL
def download_pdf_from_url(url):
    response = requests.get(url)
    with open("temp_resume.pdf", "wb") as f:
        f.write(response.content)


# 📌 Extract Text from Resume
def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = " ".join([page.get_text("text") for page in doc])
    return text.lower()


# 📌 Clean Text (Remove Special Characters)
def clean_text(text):
    return re.sub(r"[^a-zA-Z0-9\s]", "", text).strip()


# 📌 Extract Skills from Resume
def extract_skills(text):
    words = set(text.split())
    matched_skills = {skill for skill, synonyms in SKILL_SYNONYMS.items() if any(word in words for word in synonyms)}
    return matched_skills


# 📌 TF-IDF Similarity Calculation
def calculate_tfidf_similarity(resume_text, job_text):
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([resume_text, job_text])
    score = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0] * 100
    return round(score, 2)


# 📌 BERT Similarity Calculation
def calculate_bert_similarity(text1, text2):
    tokens1 = tokenizer(text1, return_tensors="pt", padding=True, truncation=True, max_length=512)
    tokens2 = tokenizer(text2, return_tensors="pt", padding=True, truncation=True, max_length=512)

    with torch.no_grad():
        emb1 = bert_model(**tokens1).last_hidden_state.mean(dim=1)
        emb2 = bert_model(**tokens2).last_hidden_state.mean(dim=1)

    similarity = torch.nn.functional.cosine_similarity(emb1, emb2).item() * 100
    return round(similarity, 2)


# 📌 Final Resume Scoring API
@app.post("/score-resume/")
async def score_resume(request: ResumeRequest):
    try:
        # ✅ Step 1: Download Resume
        download_pdf_from_url(request.resume_url)

        # ✅ Step 2: Extract & Clean Text
        resume_text = extract_text_from_pdf("temp_resume.pdf")
        resume_text = clean_text(resume_text)

        # ✅ Step 3: Merge Job Description & Requirements
        combined_job_text = f"{request.job_description} {request.job_requirements}"

        # ✅ Step 4: Extract Skills
        matched_skills = extract_skills(resume_text)
        skill_match_score = len(matched_skills) * 10  # Weighted 10 points per skill

        # ✅ Step 5: Calculate Text Similarity Scores
        tfidf_score = calculate_tfidf_similarity(resume_text, combined_job_text)
        bert_score = calculate_bert_similarity(resume_text, combined_job_text)

        # ✅ Step 6: Final Weighted Score Calculation
        final_score = round((0.4 * tfidf_score) + (0.4 * bert_score) + (0.2 * skill_match_score), 2)

        # ✅ Step 7: Decision Based on Score
        status = "Accepted" if final_score >= 40 else "Rejected"

        return {
            "resume_score": final_score,
            "matched_skills": list(matched_skills),
            "status": status
        }
    except Exception as e:
        return {"error": str(e)}
