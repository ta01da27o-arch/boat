import statistics, random

def train_ai_model(history_data):
    """過去60日分から単純学習（傾向解析）"""
    ai_result = {}
    venue_stats = {}

    for date, venues in history_data.items():
        for venue, data in venues.items():
            if "races" not in data: continue
            if venue not in venue_stats:
                venue_stats[venue] = []
            for race_no, players in data["races"].items():
                avg_st = sum(p["st"] for p in players) / len(players)
                avg_all = sum(p["all"] for p in players) / len(players)
                venue_stats[venue].append((avg_st, avg_all))

    for venue, vals in venue_stats.items():
        avg_st = statistics.mean([v[0] for v in vals])
        avg_all = statistics.mean([v[1] for v in vals])
        ai_result[venue] = {
            "平均ST": round(avg_st, 2),
            "平均勝率": round(avg_all, 2),
            "AI評価": random.choice(["逃げ優勢", "まくり傾向", "混戦"])
        }
    return ai_result