"""
backtest.py — Step 8: Validate RF risk predictions against historical recurrence.

Loads data/gvp_final.csv and measures precision, recall, and F1 score for identifying
chronic recurrence points (>0.7 recurrence rate).
"""

import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

INPUT_PATH = "data/gvp_final.csv"

def run_backtest():
    print("=" * 60)
    print("STEP 8: MODEL BACKTESTING & ACCURACY VERIFICATION")
    print("=" * 60)
    
    df = pd.read_csv(INPUT_PATH)
    
    # Ground truth: GVPs that actually recurred chronically (recurrence_rate >= 0.7)
    df["actual_chronic"] = (df["recurrence_rate"] >= 0.7).astype(int)
    
    # Model prediction: GVPs predicted to have high recurrence (rf_predicted_recurrence_rate >= 0.7)
    df["predicted_chronic"] = (df["rf_predicted_recurrence_rate"] >= 0.7).astype(int)
    
    y_true = df["actual_chronic"]
    y_pred = df["predicted_chronic"]
    
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    print(f"\nTotal GVPs Evaluated: {len(df)}")
    print(f"Actual Chronic Recurrence Spots: {y_true.sum()}")
    print(f"Model Flagged Spots: {y_pred.sum()}\n")
    
    print("Confusion Matrix:")
    print(f"  True Positives (Correctly Flagged Chronic): {tp}")
    print(f"  False Positives (Over-flagged): {fp}")
    print(f"  False Negatives (Missed Chronic): {fn}")
    print(f"  True Negatives (Correctly Identified Low-Risk): {tn}\n")
    
    print("Detailed Classification Report:")
    print(classification_report(y_true, y_pred, target_names=["Non-Chronic", "Chronic"]))
    
    print("-" * 60)
    print(f"Defensible Proof Metric: The model successfully identified {tp} out of {y_true.sum()} ({tp/y_true.sum()*100:.1f}%) historical recurring spots!")
    print("-" * 60)

if __name__ == "__main__":
    run_backtest()
