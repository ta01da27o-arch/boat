import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
from pathlib import Path


def main():
    features_path = Path("features.csv")
    if not features_path.exists():
        print("[ERROR] features.csv が存在しません。先に features.py を実行してください。")
        return

    # 特徴量を読み込み
    df = pd.read_csv(features_path)

    # 学習に使う説明変数（特徴量）
    X = df[["avg_rank", "best_rank", "worst_rank", "race_count"]].fillna(0)

    # 目的変数: "次レースで1着になったか" を仮定（ここは history.json から構築済みと想定）
    # 今回は例として avg_rank が 1.5 以下なら 1着経験あり としてラベル化
    y = (df["best_rank"] == 1).astype(int)

    if y.sum() == 0:
        print("[WARN] 1着データが存在しないため学習できません。")
        return

    # 訓練データとテストデータに分割
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ロジスティック回帰で学習
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    # 精度確認
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"[INFO] モデル学習完了。テスト精度: {acc:.3f}")

    # モデル保存
    joblib.dump(model, "model.pkl")
    print("[INFO] 学習済みモデルを model.pkl に保存しました。")


if __name__ == "__main__":
    main()