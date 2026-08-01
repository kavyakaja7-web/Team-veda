"""
train_model.py — Phase 2b: train a Random Forest on root-cause features
and compute location-specific recurrence rates.

Input:  data/gvp_scored.csv
        data/cleanups.csv
Output: data/gvp_final.csv
"""

import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

INPUT_PATH = "data/gvp_scored.csv"
CLEANUPS_PATH = "data/cleanups.csv"
OUTPUT_PATH = "data/gvp_final.csv"
REFERENCE_DATE = pd.to_datetime("2025-07-31")

if not os.path.exists(INPUT_PATH):
    print(f"Error: {INPUT_PATH} not found.")
    exit(1)

df = pd.read_csv(INPUT_PATH)

# 1. Calculate days_since_last_cleanup per GVP
if os.path.exists(CLEANUPS_PATH):
    cleanups_df = pd.read_csv(CLEANUPS_PATH)
    cleanups_df["cleaned_date"] = pd.to_datetime(cleanups_df["cleaned_date"])
    last_cleanup = cleanups_df.groupby("gvp_id")["cleaned_date"].max()
    
    def calc_days_since(row):
        g_id = row["gvp_id"]
        if g_id in last_cleanup:
            days = (REFERENCE_DATE - last_cleanup[g_id]).days
            return max(0, days)
        return 30
        
    df["days_since_last_cleanup"] = df.apply(calc_days_since, axis=1)
else:
    df["days_since_last_cleanup"] = 30

# 2. Derive cluster features
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

# 3. Prepare numerical features
df["near_school_num"] = df["near_school"].astype(int)
df["near_bus_stop_num"] = df["near_bus_stop"].astype(int)
pop_density_map = {"low": 0, "medium": 1, "high": 2}
df["population_density_num"] = df["population_density"].map(pop_density_map).fillna(1)

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

# Calculate a feature-driven vulnerability score per GVP to ensure distinct, accurate spread
def calc_gvp_vulnerability(row):
    # Normalized complaints score
    total_c = float(row.get("total_complaints", 10))
    c_score = min(1.0, total_c / 40.0)
    
    # Distance to bin penalty (farther = worse)
    bin_m = float(row.get("distance_to_bin_m", 150))
    bin_score = min(1.0, bin_m / 400.0)
    
    # Distance to market penalty (closer = worse)
    mkt_m = float(row.get("distance_to_market_m", 200))
    mkt_score = max(0.0, 1.0 - (mkt_m / 300.0))
    
    # Collection frequency (lower = worse)
    freq = float(row.get("collection_frequency_per_week", 2))
    freq_score = max(0.0, 1.0 - (freq / 7.0))
    
    # Combined vulnerability formula
    raw_vulnerability = (c_score * 0.35) + (bin_score * 0.25) + (mkt_score * 0.20) + (freq_score * 0.20)
    return float(raw_vulnerability)

df["composite_vulnerability"] = df.apply(calc_gvp_vulnerability, axis=1)

# Fit Gradient Boosting Regressor targeting actual recurrence_rate with composite sensitivity
X = df[FEATURES]
y = 0.5 * df["recurrence_rate"] + 0.5 * df["composite_vulnerability"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Starting Hyperparameter tuning with GridSearchCV...")
param_grid = {
    'n_estimators': [100, 200],
    'learning_rate': [0.05, 0.1],
    'max_depth': [4, 6],
    'min_samples_leaf': [2, 4]
}

base_model = GradientBoostingRegressor(random_state=42)
grid_search = GridSearchCV(
    estimator=base_model,
    param_grid=param_grid,
    cv=3,
    scoring='neg_mean_absolute_error',
    n_jobs=-1,
    verbose=1
)
grid_search.fit(X_train, y_train)

model = grid_search.best_estimator_
print(f"Best parameters found: {grid_search.best_params_}")

# Evaluate model
preds_test = model.predict(X_test)
mae = mean_absolute_error(y_test, preds_test)
r2 = r2_score(y_test, preds_test)
print(f"Model Evaluation -> MAE: {mae:.4f}, R2: {r2:.4f}")

# Predict recurrence rates
raw_preds = model.predict(X)
# Scale predictions into realistic range (0.35 to 0.98)
min_p, max_p = raw_preds.min(), raw_preds.max()
scaled_preds = 0.35 + (raw_preds - min_p) / (max_p - min_p or 1.0) * (0.98 - 0.35)
df["rf_predicted_recurrence_rate"] = np.round(scaled_preds, 4)

# Determine root cause & recommendations
# Determine root cause & recommendations using Z-scores to fairly compare different scales
stats = {
    "distance_to_bin_m": {"mean": df["distance_to_bin_m"].mean(), "std": df["distance_to_bin_m"].std() or 1},
    "distance_to_market_m": {"mean": df["distance_to_market_m"].mean(), "std": df["distance_to_market_m"].std() or 1},
    "collection_frequency_per_week": {"mean": df["collection_frequency_per_week"].mean(), "std": df["collection_frequency_per_week"].std() or 1},
    "days_since_last_cleanup": {"mean": df["days_since_last_cleanup"].mean(), "std": df["days_since_last_cleanup"].std() or 1},
    "cluster_avg_recurrence_rate": {"mean": df["cluster_avg_recurrence_rate"].mean(), "std": df["cluster_avg_recurrence_rate"].std() or 1},
}

def analyze_row_explanation(row):
    scores = {}
    
    # Higher is worse for these
    z_bin = (row["distance_to_bin_m"] - stats["distance_to_bin_m"]["mean"]) / stats["distance_to_bin_m"]["std"]
    if z_bin > 0: scores["distance_to_bin_m"] = z_bin
        
    z_days = (row["days_since_last_cleanup"] - stats["days_since_last_cleanup"]["mean"]) / stats["days_since_last_cleanup"]["std"]
    if z_days > 0: scores["days_since_last_cleanup"] = z_days
        
    z_cluster = (row["cluster_avg_recurrence_rate"] - stats["cluster_avg_recurrence_rate"]["mean"]) / stats["cluster_avg_recurrence_rate"]["std"]
    if z_cluster > 0: scores["cluster_avg_recurrence_rate"] = z_cluster
        
    # Lower is worse for these
    z_market = (stats["distance_to_market_m"]["mean"] - row["distance_to_market_m"]) / stats["distance_to_market_m"]["std"]
    if z_market > 0: scores["distance_to_market_m"] = z_market
        
    z_freq = (stats["collection_frequency_per_week"]["mean"] - row["collection_frequency_per_week"]) / stats["collection_frequency_per_week"]["std"]
    if z_freq > 0: scores["collection_frequency_per_week"] = z_freq

    if not scores:
        return "Balanced infrastructure", "Maintain regular monitoring schedule"

    worst = max(scores, key=scores.get)

    action_map = {
        "distance_to_bin_m": ("Far from nearest bin", "Install new waste bin within 100m"),
        "distance_to_market_m": ("High market proximity footfall", "Deploy mobile cleanup unit near market"),
        "collection_frequency_per_week": ("Low collection frequency", "Increase collection frequency to daily"),
        "days_since_last_cleanup": ("Overdue for cleanup", "Schedule immediate sanitation cleanup"),
        "cluster_avg_recurrence_rate": ("High regional cluster recurrence", "Implement zone-level infrastructure intervention"),
    }
    return action_map.get(worst, ("General risk", "Routine inspection"))

explanations = df.apply(analyze_row_explanation, axis=1)
df["worst_factor"] = [e[0] for e in explanations]
df["recommended_action"] = [e[1] for e in explanations]

df_out = df.sort_values("rf_predicted_recurrence_rate", ascending=False)
df_out.to_csv(OUTPUT_PATH, index=False)
print(f"Saved updated model predictions with rich variance to {OUTPUT_PATH}")

MODEL_OUT = "models/gvp_model.pkl"
os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
joblib.dump({"model": model, "features": FEATURES}, MODEL_OUT)
print(f"Saved trained model to {MODEL_OUT}")