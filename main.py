import uuid
import os
import json
import urllib.parse
import time
import requests
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel
from neo4j import GraphDatabase

# --- Sentiment Analysis Imports ---
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your Vercel/Netlify domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Database & AI Initialization ---
URI = "neo4j://localhost:7687"
AUTH = ("neo4j", "anonymous123")
driver = GraphDatabase.driver(URI, auth=AUTH)

# Configure Gemini
genai.configure(api_key="removed")
model = genai.GenerativeModel("gemini-2.5-flash")

# --- 2. X.com Cookies ---
X_COOKIES = [
    {"name": "auth_token", "value": "666315369ba6e229b9b92a7a58d5e5904933e566", "domain": ".x.com", "path": "/", "secure": True, "httpOnly": True},
    {"name": "ct0", "value": "8df5d10fe6b83871736edc5ff72516868b82dee96d4ec5c2f24a05ef89e188d8004bea062bb41c923adbb9ef080b8ffcdcf08a449405f7fe00eb2c34e2d26ae0b008df7ce7608ae3ed4d38cd83f94602", "domain": ".x.com", "path": "/", "secure": True, "httpOnly": False},
    {"name": "twid", "value": "u%3D2024891359589777408", "domain": ".x.com", "path": "/", "secure": True, "httpOnly": False},
    {"name": "kdt", "value": "lRbHMxbbvxriBOba15MVfGqoUInioOYgSlnS54ef", "domain": ".x.com", "path": "/", "secure": True, "httpOnly": True},
    {"name": "att", "value": "1-7NVhT0NXVBMuxfw4MSHY05s71MZXca8EGihWeW7T", "domain": ".x.com", "path": "/", "secure": True, "httpOnly": True},
    {"name": "guest_id", "value": "v1%3A176020868692070139", "domain": ".x.com", "path": "/", "secure": True, "httpOnly": False},
    {"name": "personalization_id", "value": "\"v1_oIDA6k9x10i4QcnHGqnYDA==\"", "domain": ".x.com", "path": "/", "secure": True, "httpOnly": False},
]

# --- 3. Keyword Definitions ---
NEG_KEYWORDS = "water OR road OR electricity OR garbage OR MCD OR पानी OR सड़क OR बिजली OR कचरा OR गड्ढे"
POS_KEYWORDS = "clean OR park OR development OR safe OR improved OR good OR साफ़ OR पार्क OR विकास OR सुरक्षित OR सुधार OR अच्छा"

# --- 4. Persistent X.com Scraper Setup ---
global_browser = None

@app.on_event("startup")
def startup_event():
    """Runs once when the server starts to boot up the browser."""
    global global_browser
    print("[System] Booting up persistent background browser...")
    
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument("--disable-gpu")

    service = Service(ChromeDriverManager().install())
    global_browser = webdriver.Chrome(service=service, options=chrome_options)
    global_browser.implicitly_wait(10)

    try:
        global_browser.get("https://x.com")
        WebDriverWait(global_browser, 10).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        for cookie in X_COOKIES:
            global_browser.add_cookie(cookie)
        print("[System] 🚀 Background browser is ready and authenticated!")
    except Exception as e:
        print(f"[System] Warning: Initial browser setup failed: {e}")

@app.on_event("shutdown")
def shutdown_event():
    print("[System] Shutting down...")
    driver.close()
    global global_browser
    if global_browser is not None:
        global_browser.quit()
        print("[System] Background browser closed.")

# --- 5. Scraping Helper Functions ---
def fetch_x_search(ward_name: str, keywords: str, search_label: str) -> str:
    global global_browser
    if global_browser is None:
        return "Error: Background browser is not running."

    try:
        search_query = f'("{ward_name}") ({keywords}) since:2026-01-01 until:2026-03-02' # Updated to today's date
        encoded_query = urllib.parse.quote(search_query)
        search_url = f"https://x.com/search?q={encoded_query}&f=live"

        print(f"[Scraper] Navigating to X.com ({search_label}): {search_url}")
        global_browser.get(search_url)

        # CRITICAL FIX: Force a wait so the previous search DOM clears out 
        # before we start looking for new elements
        time.sleep(2)

        wait = WebDriverWait(global_browser, 15)
        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, '[data-testid="tweetText"]')))
        
        # Buffer for React to finish rendering the actual text inside the DOM tags
        time.sleep(2)

        soup = BeautifulSoup(global_browser.page_source, 'html.parser')
        tweets = soup.find_all('div', {'data-testid': 'tweetText'})

        tweet_list = [t.get_text(strip=True) for t in tweets[:10]]
        
        # Log the count to the terminal
        print(f"[Scraper] ✅ X.com ({search_label}) -> Captured {len(tweet_list)} tweets.")
        
        return "\n---\n".join(tweet_list) if tweet_list else "No tweets found."

    except Exception as e:
        print(f"[Scraper] ❌ X.com ({search_label}) scraping failed: {e}")
        return f"Scraping Error: {str(e)}"

def scrape_reddit_news(ward_name: str) -> str:
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MCDSentimentApp/1.0'}
    search_query = urllib.parse.quote(f"{ward_name} MCD")
    url = f"https://www.reddit.com/r/delhi/search.json?q={search_query}&restrict_sr=1&sort=new"
    
    try:
        print(f"[Scraper] Fetching Reddit data for: {ward_name}")
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            posts = data.get('data', {}).get('children', [])
            
            reddit_text = []
            for post in posts[:5]:
                title = post['data'].get('title', '')
                selftext = post['data'].get('selftext', '')
                reddit_text.append(f"Title: {title}\nBody: {selftext}")
            
            result_text = "\n---\n".join(reddit_text) if reddit_text else "No Reddit posts found."
            
            # Log count and raw data to terminal
            print(f"[Scraper] ✅ Reddit -> Captured {len(reddit_text)} posts.")
            print(f"\n[TERMINAL DEBUG] --- REDDIT RAW DATA FOR {ward_name.upper()} ---")
            print(result_text)
            print("[TERMINAL DEBUG] ---------------------------------------------\n")
            
            return result_text
        return f"Reddit API returned status {response.status_code}."
    except Exception as e:
        print(f"[Scraper] ❌ Reddit scraping failed: {e}")
        return f"Reddit Scraping Error: {str(e)}"

# --- 6. API Endpoints ---
class SentimentRequest(BaseModel):
    ward: str

@app.post("/api/sentiment/analyze")
def analyze_and_update_ward(request: SentimentRequest):
    ward = request.ward
    
    print(f"\n[Pipeline] === Starting analysis pipeline for {ward} ===")
    
    # 1. Fetch Negative X.com Data
    x_negative_data = fetch_x_search(ward, NEG_KEYWORDS, "NEGATIVE")

    # --- CRITICAL DELAY ADDED HERE ---
    # Give X.com a moment to breathe so we don't get blocked, 
    # and let the browser fully clear its memory.
    print(f"[Pipeline] ⏳ Waiting 4 seconds before initiating the positive search...")
    time.sleep(4) 
    
    # 2. Fetch Positive X.com Data
    x_positive_data = fetch_x_search(ward, POS_KEYWORDS, "POSITIVE")

    # 3. Fetch Reddit Data 
    # (No delay needed before this one because it's hitting a completely different website 
    # via a basic HTTP request, not using the Selenium browser)
    reddit_data = scrape_reddit_news(ward)

    combined_scraped_text = (
        f"--- X.COM DATA (NEGATIVE/ISSUE KEYWORDS) ---\n{x_negative_data}\n\n"
        f"--- X.COM DATA (POSITIVE/IMPROVEMENT KEYWORDS) ---\n{x_positive_data}\n\n"
        f"--- REDDIT DATA ---\n{reddit_data}"
    )

    # If all sources failed or found nothing, handle the fallback
    if "No tweets found" in x_negative_data and "No tweets found" in x_positive_data and "No Reddit posts found" in reddit_data:
        return {
            "ward": ward,
            "current_sentiment": 50,
            "latest_news_summary": "No data found on X or Reddit.",
            "tags": [],
            "error": "No data available across platforms."
        }

    prompt = f"""
    Analyze the following social media data regarding the ward '{ward}'. 
    The data is split into negative searches, positive searches, and Reddit discussions. 
    Weigh both the positive and negative sentiments fairly to arrive at an overall score.

    Return a valid JSON object with:
    1. "sentiment_score": An integer from 0 to 100 (0 = extremely negative, 50 = neutral, 100 = extremely positive).
    2. "summary": A concise 2-sentence summary of the issues and praises.
    3. "dates": A list of relative timeframes mentioned in the posts.
    4. "tags": A list of 3-5 short keyword tags based on the actual content (e.g., "water", "parks").
    
    Data:
    {combined_scraped_text}
    """

    ai_response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
        )
    )

    try:
        ai_data = json.loads(ai_response.text)
        sentiment_score = int(ai_data.get("sentiment_score", 50)) 
        news_summary = ai_data.get("summary", "No summary available.")
        news_dates = ai_data.get("dates", [])
        news_tags = ai_data.get("tags", [])
    except (json.JSONDecodeError, ValueError):
        sentiment_score = 50
        news_summary = "Error parsing AI response."
        news_dates = []
        news_tags = []

    query = """
    MATCH (w:Ward {name: $ward})
    SET w.current_sentiment = $sentiment,
        w.latest_news_summary = $summary,
        w.news_dates = $dates
    RETURN w.name AS ward
    """

    driver.execute_query(
        query,
        ward=ward,
        sentiment=sentiment_score,
        summary=news_summary,
        dates=news_dates,
        database_="mcd"
    )

    return {
        "ward": ward,
        "current_sentiment": sentiment_score,
        "latest_news_summary": news_summary,
        "news_dates": news_dates,
        "tags": news_tags, 
        "raw_scraped_data": combined_scraped_text
    }

@app.get("/api/voters/filter")
def filter_voters(
    ward: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    gender: Optional[str] = None,
    occupation: Optional[str] = None,
    specific_scheme: Optional[str] = None,
    has_any_scheme: Optional[bool] = None
):
    query = "MATCH (v:Voter)-[:LIVES_IN]->(w:Ward) "
    conditions = []
    params = {}

    if ward:
        conditions.append("w.name = $ward")
        params["ward"] = ward
    if min_age:
        conditions.append("v.age >= $min_age")
        params["min_age"] = min_age
    if max_age:
        conditions.append("v.age <= $max_age")
        params["max_age"] = max_age
    if gender:
        conditions.append("v.gender = $gender")
        params["gender"] = gender
    if occupation:
        conditions.append("v.occupation = $occupation")
        params["occupation"] = occupation

    if has_any_scheme is False:
        conditions.append("NOT (v)-[:BENEFITS_FROM]->(:Scheme)")
    elif specific_scheme:
        query += ", (v)-[:BENEFITS_FROM]->(s:Scheme) "
        conditions.append("s.name = $specific_scheme")
        params["specific_scheme"] = specific_scheme
    elif has_any_scheme is True:
        conditions.append("(v)-[:BENEFITS_FROM]->(:Scheme)")

    if conditions:
        query += "WHERE " + " AND ".join(conditions)

    query += " RETURN v.name AS name, v.age AS age, v.gender AS gender, v.phone_number AS phone, w.name AS ward LIMIT 200"

    records, summary, keys = driver.execute_query(query, **params, database_="mcd")

    return {
        "filters_applied": params,
        "has_any_scheme_filter": has_any_scheme,
        "total_results": len(records),
        "voters": [record.data() for record in records]
    }

@app.get("/api/command/map-data")
def get_map_data():
    query = """
    MATCH (v:Voter)-[:LIVES_IN]->(w:Ward)
    RETURN w.name AS ward,
           w.zone AS zone,
           count(v) AS total_voters,
           coalesce(w.current_sentiment, 50) AS raw_score
    """
    records, _, _ = driver.execute_query(query, database_="mcd")

    delhi_ward_coords = {
        "Saraswati Vihar": [28.6964, 77.1232],
        "Paschim Vihar": [28.6698, 77.0934],
        "Guru Harkishan Nagar": [28.6738, 77.0864],
        "Rohini A": [28.7159, 77.1165],
        "Rohini B": [28.7303, 77.1147],
        "Swarup Nagar": [28.7523, 77.1614],
        "Burari": [28.7501, 77.1930],
        "Timarpur": [28.7051, 77.2223],
        "Mukherjee Nagar": [28.7115, 77.2039],
        "Model Town": [28.7159, 77.1909],
        "Civil Lines": [28.6789, 77.2227], 
        "Greater Kailash": [28.5373, 77.2372],
        "Sangam Vihar": [28.4984, 77.2428],
        "Dakshinpuri": [28.5144, 77.2384],
        "Hauz Khas": [28.5494, 77.2001],
        "Malviya Nagar": [28.5323, 77.2074],
        "Lajpat Nagar": [28.5677, 77.2433],
        "Bhogal": [28.5866, 77.2468],
        "Kasturba Nagar": [28.5816, 77.2285],
        "Andrews Ganj": [28.5621, 77.2217],
        "Chandni Chowk": [28.6505, 77.2303],
        "Jama Masjid": [28.6507, 77.2334],
        "Kashmere Gate": [28.6675, 77.2272], 
        "City SP Zone": [28.6550, 77.2295] 
    }

    map_data = []
    
    for record in records:
        ward = record["ward"]
        
        try:
            raw_score = int(record["raw_score"])
        except (ValueError, TypeError):
            raw_score = 50 
        
        if raw_score >= 60:
            status = "positive"
        elif raw_score <= 40:
            status = "negative"
        else:
            status = "neutral"

        coords = delhi_ward_coords.get(ward, [28.6139, 77.2090])

        map_data.append({
            "ward": ward,
            "zone": record["zone"] or "Unknown Zone",
            "total_voters": record["total_voters"],
            "sentiment_status": status,
            "raw_score": raw_score,
            "coordinates": coords
        })

    return {"map_data": map_data}

# --- 7. Task Request Models & API ---
class TaskCreate(BaseModel):
    title: str
    ward: str
    assignee: str
    priority: str

class TaskSubmitProof(BaseModel):
    lat: float
    lng: float
    proof_image_b64: str

@app.get("/api/tasks")
def get_all_tasks():
    query = """
    MATCH (t:Task)-[:ASSIGNED_TO_WARD]->(w:Ward)
    RETURN t.id AS id, t.title AS title, t.assignee AS assignee, 
           t.status AS status, t.priority AS priority, w.name AS ward,
           t.proof_image AS proof_image, t.proof_lat AS lat, t.proof_lng AS lng
    ORDER BY t.created_at DESC
    """
    records, _, _ = driver.execute_query(query, database_="mcd")
    return {"tasks": [record.data() for record in records]}

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    task_id = str(uuid.uuid4())[:8] 
    query = """
    MATCH (w:Ward {name: $ward})
    CREATE (t:Task {
        id: $task_id, title: $title, assignee: $assignee, 
        status: 'todo', priority: $priority, created_at: timestamp()
    })
    MERGE (t)-[:ASSIGNED_TO_WARD]->(w)
    RETURN t.id AS id
    """
    driver.execute_query(
        query, task_id=task_id, title=task.title, assignee=task.assignee, 
        priority=task.priority, ward=task.ward, database_="mcd"
    )
    return {"status": "success", "task_id": task_id}

@app.patch("/api/tasks/{task_id}/verify")
def admin_verify_task(task_id: str):
    query = """
    MATCH (t:Task {id: $task_id})
    SET t.status = 'verified'
    RETURN t.id
    """
    driver.execute_query(query, task_id=task_id, database_="mcd")
    return {"status": "Task verified successfully."}

@app.patch("/api/tasks/{task_id}/submit")
def worker_submit_task(task_id: str, proof: TaskSubmitProof):
    query = """
    MATCH (t:Task {id: $task_id})
    SET t.status = 'pending_verification', t.proof_lat = $lat, t.proof_lng = $lng, t.proof_image = $image
    RETURN t.id
    """
    driver.execute_query(query, task_id=task_id, lat=proof.lat, lng=proof.lng, image=proof.proof_image_b64, database_="mcd")
    return {"status": "Proof submitted."}