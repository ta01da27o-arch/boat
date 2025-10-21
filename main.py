# main.py
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os, json

app = FastAPI()

# static 配信
app.mount("/static", StaticFiles(directory="static"), name="static")

# トップページ
@app.get("/")
def read_index():
    return FileResponse("static/index.html")

# データエンドポイント
@app.get("/data")
def get_data():
    try:
        with open("data/data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)