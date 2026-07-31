"""
scripts/generate_features.py — Run feature engineering service and save/print the ML training dataset.

Usage:
    python scripts/generate_features.py [--output data/features.csv]
"""

import argparse
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app imports work
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
sys.path.append(str(BACKEND_DIR))

from app.services.features import get_recurrence_features


def main():
    parser = argparse.ArgumentParser(description="Generate ML feature dataset from GVMC MongoDB.")
    parser.add_argument(
        "--output",
        type=str,
        default=str(BACKEND_DIR / "data" / "gvp_features.csv"),
        help="Path to save the generated CSV file",
    )
    args = parser.parse_args()

    print("[INFO] Querying MongoDB and executing feature engineering pipeline...")
    
    try:
        df = get_recurrence_features()
    except Exception as exc:
        print(f"[ERROR] Failed to compute features: {exc}", file=sys.stderr)
        sys.exit(1)

    if df.empty:
        print("[WARN] No features generated. Ensure MongoDB has data in gvp_locations, complaints, and cleanups.")
        sys.exit(0)

    print(f"[SUCCESS] Features computed for {len(df)} GVPs.")
    print("\n--- Dataset Preview ---")
    print(df.head(10).to_string())
    print("-----------------------\n")

    # Ensure output directory exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_path, index=False)
    print(f"[INFO] Features dataset successfully saved to: {output_path.resolve()}")


if __name__ == "__main__":
    main()
