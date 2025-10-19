from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from datetime import datetime

app = FastAPI()

# CORS許可（外部アクセス対応）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "data.json"
HISTORY_FILE = "history_data.json"
FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

def file_info(path):
    """ファイルの存在確認と更新日時を返す"""
    if os.path.exists(path):
        mtime = datetime.fromtimestamp(os.path.getmtime(path)).strftime("%Y-%m-%d %H:%M:%S")
        size = os.path.getsize(path)
        return {"exists": True, "last_updated": mtime, "size": size}
    else:
        return {"exists": False, "last_updated": None, "size": 0}

@app.get("/")
def root():
    return {"status": "ok", "message": "Boat Race AI API running 🚤"}

@app.get("/data")
def get_data():
    """メインデータ取得 + モデル・特徴量の更新情報を含む"""
    if not os.path.exists(DATA_FILE):
        return JSONResponse(content={"status": "error", "detail": "data.json が見つかりません。"}, status_code=404)

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return JSONResponse(content={"status": "error", "detail": f"データ読み込み失敗: {e}"}, status_code=500)

    response = {
        "status": "ok",
        "count": len(data) if isinstance(data, list) else 0,
        "data": data,
        "meta": {
            "data_json": file_info(DATA_FILE),
            "history_json": file_info(HISTORY_FILE),
            "features_csv": file_info(FEATURES_FILE),
            "model_pkl": file_info(MODEL_FILE),
        }
    }

    return JSONResponse(content=response, status_code=200)

@app.get("/status")
def get_status():
    """APIと各ファイルの状態確認用"""
    return {
        "status": "running",
        "files": {
            "data.json": file_info(DATA_FILE),
            "history_data.json": file_info(HISTORY_FILE),
            "features.csv": file_info(FEATURES_FILE),
            "model.pkl": file_info(MODEL_FILE),
        }
    }

@app.get("/health")
def health_check():
    """RenderのHealth Check対応"""
    return {"ok": True}