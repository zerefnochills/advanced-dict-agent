import requests
import os

MODEL = "gemini-2.0-flash"
API_KEY = os.getenv("GEMINI_API_KEY")

def call_gemini(prompt: str, system: str):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system}]}
    }

    response = requests.post(url, json=payload)
    data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return "AI response error."


