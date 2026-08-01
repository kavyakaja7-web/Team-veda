import os
import pandas as pd
import numpy as np
import joblib

MODEL_PATH = "models/gvp_model.pkl"
INPUT_PATH = "data/new_gvps.csv"
OUTPUT_PATH = "data/predicted_gvps.csv"

def get_risk_level(score):
    if score >= 0.75:
        return "High"
    elif score >= 0.45:
        return "Medium"
    else:
        return "Low"

def main():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Trained model not found at {MODEL_PATH}")
        return
        
    if not os.path.exists(INPUT_PATH):
        print(f"Error: Input data not found at {INPUT_PATH}. Please create it with the required features.")
        return

    # Load model and features
    model_data = joblib.load(MODEL_PATH)
    model = model_data["model"]
    features = model_data["features"]

    # Load new data
    df = pd.read_csv(INPUT_PATH)
    
    # Ensure all required features are present
    missing_features = [f for f in features if f not in df.columns]
    if missing_features:
        print(f"Error: Missing required features in input data: {missing_features}")
        return

    print(f"Predicting recurrence for {len(df)} locations...")
    
    # Predict using EXACT feature order
    X = df[features]
    raw_preds = model.predict(X)
    
    # Scale to match training distribution logic (0.35 to 0.98 approximation)
    # Note: In a real system, min/max scalers should be saved with the model.
    # We will just clamp and scale roughly to 0-100 score format.
    scores = np.clip(raw_preds * 100, 0, 100).astype(int)
    
    df["risk_score"] = scores
    df["risk_level"] = df["risk_score"].apply(lambda x: get_risk_level(x / 100.0))
    
    # Export only desired columns if gvp_id exists, else keep all
    output_cols = ["gvp_id", "risk_score", "risk_level"]
    if "gvp_id" not in df.columns:
        output_cols = ["risk_score", "risk_level"]
        
    df[output_cols].to_csv(OUTPUT_PATH, index=False)
    print(f"Predictions saved successfully to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
