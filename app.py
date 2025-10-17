from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
import datetime
import joblib
import pandas as pd

# -----------------------------
# 🌍 設定
# -----------------------------
DATA_FILE = "data/data.json"
HISTORY_FILE = "data/history.json"
MODEL_FILE = "data/model.pkl"

app = FastAPI(title="Boat Race AI Server", version="2.0")

# -----------------------------
# 🔓 CORS設定（どこからでもアクセス可能）
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# 🌐 静的ファイル設定
# -----------------------------
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

# -----------------------------
# 📘 データ読み込み関数
# -----------------------------
def load_json(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] JSON load error ({path}): {e}")
        return []

# -----------------------------
# 📗 モデル読み込み関数
# -----------------------------
def load_model():
    if os.path.exists(MODEL_FILE):
        try:
            return joblib.load(MODEL_FILE)
        except Exception as e:
            print(f"[WARN] モデル読み込み失敗: {e}")
    return None

# -----------------------------
# 🧠 予測用データ構造
# -----------------------------
class RaceInput(BaseModel):
    race_wind: float = 0.0
    race_wave: float = 0.0
    race_temperature: float = 20.0
    race_water_temperature: float = 20.0
    racer_boat_number: int = 1
    racer_course_number: int = 1
    racer_start_timing: float = 0.1

# -----------------------------
# 📊 API: 最新データ取得
# -----------------------------
@app.get("/api/data")
def get_data():
    data = load_json(DATA_FILE)
    return {"count": len(data), "results": data}

# -----------------------------
# 📜 API: 過去データ（学習用）取得
# -----------------------------
@app.get("/api/history")
def get_history():
    history = load_json(HISTORY_FILE)
    return {"count": len(history), "results": history}

# -----------------------------
# 🧩 API: 単体予測
# -----------------------------
@app.post("/api/predict")
def predict(input_data: RaceInput):
    model = load_model()
    if not model:
        raise HTTPException(status_code=400, detail="学習済みモデルが存在しません")

    df = pd.DataFrame([input_data.dict()])
    try:
        pred = model.predict(df)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"予測エラー: {e}")

    return {"prediction": float(pred)}

# -----------------------------
# 🕒 API: サーバー状態チェック
# -----------------------------
@app.get("/api/status")
def status():
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
    return {"status": "ok", "time": now.strftime("%Y-%m-%d %H:%M:%S"), "tz": "Asia/Tokyo"}

# -----------------------------
# 🚀 ローカルテスト用（Renderでは不要）
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=10000, reload=True)