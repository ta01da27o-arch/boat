from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import datetime, os, json, joblib, pandas as pd

# -----------------------------
# 🌍 設定
# -----------------------------
DATA_FILE = "data/data.json"
HISTORY_FILE = "data/history.json"
MODEL_FILE = "data/model.pkl"

# -----------------------------
# 🚀 FastAPI アプリ設定
# -----------------------------
app = FastAPI(title="Boat Race AI Server", version="3.0")

# CORS設定（全許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# -----------------------------
# 📦 静的ファイル (HTMLなど)
# -----------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    """トップページ"""
    return FileResponse("static/index.html")

# -----------------------------
# 📘 JSONロード関数
# -----------------------------
def load_json(path, default=None):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] JSON読み込み失敗: {e}")
        return default

# -----------------------------
# 📗 モデルロード関数
# -----------------------------
def load_model():
    if os.path.exists(MODEL_FILE):
        try:
            return joblib.load(MODEL_FILE)
        except Exception as e:
            print(f"[WARN] モデル読み込み失敗: {e}")
    return None

# -----------------------------
# 🧠 入力モデル
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
# 📊 最新データ取得API
# -----------------------------
@app.get("/data")
async def get_data():
    """AI予想データを返すAPI"""
    data = load_json(DATA_FILE, default=[])
    return JSONResponse(content={"status": "ok", "data": data})

# -----------------------------
# 📜 履歴データAPI
# -----------------------------
@app.get("/history")
async def get_history():
    """履歴データ"""
    hist = load_json(HISTORY_FILE, default=[])
    return JSONResponse(content={"history": hist})

# -----------------------------
# 🧩 予測API
# -----------------------------
@app.post("/predict")
async def predict(input_data: RaceInput):
    """AI予測"""
    model = load_model()
    if not model:
        raise HTTPException(status_code=400, detail="学習済みモデルが存在しません。")
    df = pd.DataFrame([input_data.dict()])
    try:
        pred = model.predict(df)[0]
        return {"prediction": float(pred)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"予測エラー: {e}")

# -----------------------------
# 🕒 サーバーステータス
# -----------------------------
@app.get("/status")
def status():
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
    return {"status": "ok", "time": now.strftime("%Y-%m-%d %H:%M:%S"), "tz": "Asia/Tokyo"}

# -----------------------------
# 🚀 ローカル実行時
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=10000, reload=True)