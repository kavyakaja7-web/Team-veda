"""
cluster_and_score.py — Phase 2: spatial clustering + risk scoring for GVPs.

Input:  data/gvp_features.csv (output of generate_features.py)
Output: data/gvp_scored.csv — one row per GVP with cluster_id, risk_score,
        and predicted_root_cause added.

Usage:
    python scripts/cluster_and_score.py
"""

import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

INPUT_PATH = "data/gvp_features.csv"
OUTPUT_PATH = "data/gvp_scored.csv"

# ---------------------------------------------------------------------------
# 1. Load features
# ---------------------------------------------------------------------------
df = pd.read_csv(INPUT_PATH)

# ---------------------------------------------------------------------------
# 2. Spatial clustering (DBSCAN on lat/lon)
# ---------------------------------------------------------------------------
# eps is in degrees here since we're using raw lat/lon — roughly 0.002 deg
# is about ~200m at this latitude. Tune eps/min_samples if clusters look
# too big/small once you inspect the map.
coords = df[["lat", "lon"]].to_numpy()
db = DBSCAN(eps=0.006, min_samples=2).fit(coords)
df["cluster_id"] = db.labels_  # -1 = noise / not part of any cluster

# ---------------------------------------------------------------------------
# 3. Risk score — weighted, explainable formula
# ---------------------------------------------------------------------------
# Normalize each contributing factor to 0-1 so weights are comparable.
scaler = StandardScaler()

# Recurrence signal (primary driver)
recurrence_component = df["recurrence_rate"]  # already 0-1

# Infrastructure gap signals — normalize distance/frequency so higher = worse
dist_bin_norm = (df["distance_to_bin_m"] - df["distance_to_bin_m"].min()) / (
    df["distance_to_bin_m"].max() - df["distance_to_bin_m"].min()
)
dist_market_norm = 1 - (
    (df["distance_to_market_m"] - df["distance_to_market_m"].min())
    / (df["distance_to_market_m"].max() - df["distance_to_market_m"].min())
)  # closer to market = higher risk, so invert
collection_freq_norm = 1 - (
    (df["collection_frequency_per_week"] - df["collection_frequency_per_week"].min())
    / (df["collection_frequency_per_week"].max() - df["collection_frequency_per_week"].min())
)  # lower frequency = higher risk, so invert

# Weighted combination — recurrence is the strongest signal (it's actual
# observed behavior), root-cause factors are secondary/explanatory.
WEIGHTS = {
    "recurrence": 0.55,
    "distance_to_bin": 0.20,
    "distance_to_market": 0.15,
    "collection_frequency": 0.10,
}

df["risk_score"] = (
    WEIGHTS["recurrence"] * recurrence_component
    + WEIGHTS["distance_to_bin"] * dist_bin_norm
    + WEIGHTS["distance_to_market"] * dist_market_norm
    + WEIGHTS["collection_frequency"] * collection_freq_norm
).round(4)

# ---------------------------------------------------------------------------
# 4. Risk tier — for easy map coloring
# ---------------------------------------------------------------------------
def score_to_tier(score):
    if score >= 0.6:
        return "High"
    elif score >= 0.35:
        return "Medium"
    else:
        return "Low"

df["computed_risk_tier"] = df["risk_score"].apply(score_to_tier)

# ---------------------------------------------------------------------------
# 5. Root cause tagging — which factor is driving risk for each GVP
# ---------------------------------------------------------------------------
def tag_root_cause(row):
    causes = []
    if row["distance_to_bin_m"] > 150:
        causes.append("no_bin_nearby")
    if row["distance_to_market_m"] < 100:
        causes.append("market_proximity")
    if row["collection_frequency_per_week"] <= 2:
        causes.append("low_collection_frequency")
    if row["recurrence_rate"] > 0.7:
        causes.append("chronic_recurrence")
    return ", ".join(causes) if causes else "none_identified"

df["predicted_root_cause"] = df.apply(tag_root_cause, axis=1)

# ---------------------------------------------------------------------------
# 6. Save
# ---------------------------------------------------------------------------
df_out = df.sort_values("risk_score", ascending=False)
df_out.to_csv(OUTPUT_PATH, index=False)

print(f"Saved {len(df_out)} scored GVPs to {OUTPUT_PATH}")
print(f"\nCluster count (excluding noise/-1): {df['cluster_id'].nunique() - (1 if -1 in df['cluster_id'].values else 0)}")
print(f"Noise points (not in any cluster): {(df['cluster_id'] == -1).sum()}")
print(f"\nRisk tier distribution:")
print(df["computed_risk_tier"].value_counts())
print(f"\nTop 10 highest-risk GVPs:")
print(df_out[["gvp_id", "risk_score", "computed_risk_tier", "predicted_root_cause", "cluster_id"]].head(10).to_string(index=False))