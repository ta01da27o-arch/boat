from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
import json

app = FastAPI()

# === 静的ファイル (index.htmlなど) を配信 ===
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    """トップページ"""
    return FileResponse("static/index.html")

# === JSONデータエンドポイント ===
@app.get("/data")
async def get_data():
    """AI予想データを返すAPI"""
    data_path = "data/data.json"

    # ファイルが存在しない場合は空データを返す
    if not os.path.exists(data_path):
        return JSONResponse(content={"status": "no data", "data": []})

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return JSONResponse(content={"status": "ok", "data": data})


# === 確認用：履歴データなど ===
@app.get("/history")
async def get_history():
    """履歴データ"""
    hist_path = "data/history.json"
    if not os.path.exists(hist_path):
        return JSONResponse(content={"history": []})
    with open(hist_path, "r", encoding="utf-8") as f:
        hist = json.load(f)
    return JSONResponse(content={"history": hist})