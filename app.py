from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import os

app = FastAPI()

# 静的ファイル (index.html, app.js, style.css)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return FileResponse("static/index.html")

@app.get("/data")
def get_data():
    if os.path.exists("data.json"):
        with open("data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        return JSONResponse(content=data)
    return {"error": "data.json not found"}

@app.get("/history")
def get_history():
    if os.path.exists("history.json"):
        with open("history.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        return JSONResponse(content=data)
    return {"error": "history.json not found"}