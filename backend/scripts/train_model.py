"""
train_model.py — Phase 2b: train a Random Forest on root-cause features
(informed by DBSCAN cluster context) to predict recurrence_rate.

Input:  data/gvp_scored.csv (output of cluster_and_score.py — already has
        cluster_id from DBSCAN)
        data/cleanups.csv (to calculate time-aware days_since_last_cleanup)
Output: data/gvp_final.csv — adds RF-predicted recurrence, worst_factor, and 
        recommended_action + feature importance printed to console.

Usage:
    python scripts/train_model.py
"""

import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

INPUT_PATH = "data/gvp_scored.csv"
CLEANUPS_PATH = "data/cleanups.csv"
OUTPUT_PATH = "data/gvp_final.csv"
REFERENCE_DATE = pd.to_datetime("2025-07-31")

# ---------------------------------------------------------------------------
# 1. Load DBSCAN-scored data & Cleanups data
# ---------------------------------------------------------------------------
df = pd.read_csv(INPUT_PATH)

# Calculate days_since_last_cleanup per GVP
if os.path.exists(CLEANUPS_PATH):
    cleanups_df = pd.read_csv(CLEANUPS_PATH)
    cleanups_df["cleaned_date"] = pd.to_datetime(cleanups_df["cleaned_date"])
    last_cleanup = cleanups_df.groupby("gvp_id")["cleaned_date"].max()
    
    def calc_days_since(row):
        g_id = row["gvp_id"]
        if g_id in last_cleanup:
            days = (REFERENCE_DATE - last_cleanup[g_id]).days
            return max(0, days)
        return 365  # Default if no cleanup record found
        
    df["days_since_last_cleanup"] = df.apply(calc_days_since, axis=1)
else:
    df["days_since_last_cleanup"] = 30

# ---------------------------------------------------------------------------
# 2. Derive cluster-level features from DBSCAN output
# ---------------------------------------------------------------------------
cluster_stats = (
    df[df["cluster_id"] != -1]
    .groupby("cluster_id")["recurrence_rate"]
    .agg(["mean", "count"])
    .rename(columns={"mean": "cluster_avg_recurrence_rate", "count": "cluster_size"})
)

def get_cluster_avg(row):
    if row["cluster_id"] == -1:
        return np.nan
    cluster_rows = df[(df["cluster_id"] == row["cluster_id"]) & (df["gvp_id"] != row["gvp_id"])]
    if len(cluster_rows) == 0:
        return np.nan
    return cluster_rows["recurrence_rate"].mean()

df["cluster_avg_recurrence_rate"] = df.apply(get_cluster_avg, axis=1)
df["cluster_size"] = df["cluster_id"].map(
    df[df["cluster_id"] != -1].groupby("cluster_id").size()
).fillna(1)

global_mean_recurrence = df["recurrence_rate"].mean()
df["cluster_avg_recurrence_rate"] = df["cluster_avg_recurrence_rate"].fillna(global_mean_recurrence)

# ---------------------------------------------------------------------------
# 3. Inspect DBSCAN cluster quality before training
# ---------------------------------------------------------------------------
print("=" * 60)
print("DBSCAN CLUSTER INSPECTION")
print("=" * 60)
print(f"Total clusters: {df[df['cluster_id'] != -1]['cluster_id'].nunique()}")
print(f"Noise points (unclustered): {(df['cluster_id'] == -1).sum()}")
print("\nPer-cluster summary:")
print(cluster_stats.sort_values("cluster_avg_recurrence_rate", ascending=False).to_string())
print()

# ---------------------------------------------------------------------------
# 4. Prepare features for Random Forest
# ---------------------------------------------------------------------------
df["near_school_num"] = df["near_school"].astype(int)
df["near_bus_stop_num"] = df["near_bus_stop"].astype(int)
pop_density_map = {"low": 0, "medium": 1, "high": 2}
df["population_density_num"] = df["population_density"].map(pop_density_map)

FEATURES = [
    "distance_to_market_m",
    "distance_to_bin_m",
    "collection_frequency_per_week",
    "days_since_last_cleanup",
    "near_school_num",
    "near_bus_stop_num",
    "population_density_num",
    "cluster_avg_recurrence_rate",
    "cluster_size",
]
TARGET = "recurrence_rate"

X = df[FEATURES]
y = df[TARGET]

# ---------------------------------------------------------------------------
# 5. Train Random Forest Model
# ---------------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=5,
    min_samples_leaf=3,
    random_state=42,
)
model.fit(X_train, y_train)

# ---------------------------------------------------------------------------
# 6. Evaluate Model
# ---------------------------------------------------------------------------
y_pred_test = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred_test)
r2 = r2_score(y_test, y_pred_test)

print("=" * 60)
print("RANDOM FOREST TRAINING RESULTS")
print("=" * 60)
print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")
print(f"MAE on test set: {mae:.4f}")
print(f"R² on test set: {r2:.4f}")

# ---------------------------------------------------------------------------
# 7. Feature importance
# ---------------------------------------------------------------------------
importance_df = pd.DataFrame({
    "feature": FEATURES,
    "importance": model.feature_importances_
}).sort_values("importance", ascending=False)

print("\nFeature importance (what drives recurrence):")
print(importance_df.to_string(index=False))

# ---------------------------------------------------------------------------
# 8. Predict & Calculate Step 2 (worst_factor) & Step 3 (recommended_action)
# ---------------------------------------------------------------------------
df["rf_predicted_recurrence_rate"] = model.predict(X).round(4)

# Calculate medians for comparative diagnosis
medians = {
    "distance_to_bin_m": df["distance_to_bin_m"].median(),
    "distance_to_market_m": df["distance_to_market_m"].median(),
    "collection_frequency_per_week": df["collection_frequency_per_week"].median(),
    "days_since_last_cleanup": df["days_since_last_cleanup"].median(),
    "cluster_avg_recurrence_rate": df["cluster_avg_recurrence_rate"].median(),
}

def analyze_row_explanation(row):
    # Calculate relative severity scores (higher = worse factor)
    scores = {}
    
    # Distance to bin: larger is worse
    if row["distance_to_bin_m"] > medians["distance_to_bin_m"]:
        scores["distance_to_bin_m"] = (row["distance_to_bin_m"] - medians["distance_to_bin_m"]) / (medians["distance_to_bin_m"] or 1)
        
    # Distance to market: smaller is worse
    if row["distance_to_market_m"] < medians["distance_to_market_m"]:
        scores["distance_to_market_m"] = (medians["distance_to_market_m"] - row["distance_to_market_m"]) / (medians["distance_to_market_m"] or 1)
        
    # Collection frequency: smaller is worse
    if row["collection_frequency_per_week"] < medians["collection_frequency_per_week"]:
        scores["collection_frequency_per_week"] = (medians["collection_frequency_per_week"] - row["collection_frequency_per_week"]) / (medians["collection_frequency_per_week"] or 1)
        
    # Days since last cleanup: larger is worse
    if row["days_since_last_cleanup"] > medians["days_since_last_cleanup"]:
        scores["days_since_last_cleanup"] = (row["days_since_last_cleanup"] - medians["days_since_last_cleanup"]) / (medians["days_since_last_cleanup"] or 1)
        
    # Cluster recurrence: larger is worse
    if row["cluster_avg_recurrence_rate"] > medians["cluster_avg_recurrence_rate"]:
        scores["cluster_avg_recurrence_rate"] = (row["cluster_avg_recurrence_rate"] - medians["cluster_avg_recurrence_rate"]) / (medians["cluster_avg_recurrence_rate"] or 1)

    if not scores:
        return "balanced_infrastructure", "Maintain regular monitoring schedule"

    worst = max(scores, key=scores.get)

    action_map = {
        "distance_to_bin_m": ("Far from nearest bin", "Install new waste bin within 100m"),
        "distance_to_market_m": ("High market proximity footfall", "Deploy mobile cleanup unit near market"),
        "collection_frequency_per_week": ("Low collection frequency", "Increase collection frequency to daily"),
        "days_since_last_cleanup": ("Overdue for cleanup", "Schedule immediate sanitation cleanup"),
        "cluster_avg_recurrence_rate": ("High regional cluster recurrence", "Implement zone-level infrastructure intervention"),
    }
    return action_map.get(worst, ("general_risk", "Routine inspection"))

explanations = df.apply(analyze_row_explanation, axis=1)
df["worst_factor"] = [e[0] for e in explanations]
df["recommended_action"] = [e[1] for e in explanations]

df_out = df.sort_values("rf_predicted_recurrence_rate", ascending=False)
df_out.to_csv(OUTPUT_PATH, index=False)

print(f"\nSaved final dataset with predictions, worst factor & actions to {OUTPUT_PATH}")

# ---------------------------------------------------------------------------
# 9. Save trained model
# ---------------------------------------------------------------------------
MODEL_OUT = "models/rf_recurrence_model.pkl"
os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
joblib.dump({"model": model, "features": FEATURES}, MODEL_OUT)
print(f"Saved trained model to {MODEL_OUT}")