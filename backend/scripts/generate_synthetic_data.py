"""
scripts/generate_synthetic_data.py — Generate realistic synthetic complaints and cleanups CSVs.
Aligns GVP IDs and wards with the existing data/gvp_locations.csv.
"""

import os
import random
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
GVP_FILE = BACKEND_DIR / "data" / "gvp_locations.csv"
COMPLAINTS_OUT = BACKEND_DIR / "data" / "complaints.csv"
CLEANUPS_OUT = BACKEND_DIR / "data" / "cleanups.csv"


def main():
    if not GVP_FILE.exists():
        print(f"[ERROR] gvp_locations.csv not found at: {GVP_FILE}")
        return

    # Read GVP IDs and wards
    gvp_df = pd.read_csv(GVP_FILE)
    gvp_info = gvp_df[["gvp_id", "ward_id"]].to_dict(orient="records")

    print(f"[INFO] Found {len(gvp_info)} GVP locations from CSV.")

    categories = ["Overflow", "Odor", "Illegal Dumping", "Hazardous Waste", "Scattered Trash"]
    statuses = ["Open", "In Progress", "Resolved"]
    teams = ["Green Force 1", "Green Force 2", "Zone-3 Cleansing Team", "Veda Waste Warriors", "GVMC Cleaners"]

    complaint_records = []
    cleanup_records = []

    complaint_idx = 1
    cleanup_idx = 1

    # Generate records chronologically starting from 2025-01-01
    start_date = datetime(2025, 1, 1)

    for item in gvp_info:
        gvp_id = item["gvp_id"]
        ward = item["ward_id"]

        # Number of historical cleanups for this GVP
        num_cleanups = random.randint(1, 4)
        
        # We will generate alternating complaints and cleanups
        current_time = start_date + timedelta(days=random.randint(0, 15))

        for c_round in range(num_cleanups):
            # 1. Generate 1-3 complaints before the cleanup
            num_complaints = random.randint(1, 3)
            round_complaints = []
            
            for _ in range(num_complaints):
                current_time += timedelta(days=random.randint(2, 7))
                comp_id = f"COM{complaint_idx:03d}"
                complaint_idx += 1
                
                # Sometime resolved, sometimes open/in_progress if it's the last round
                is_last_round = (c_round == num_cleanups - 1)
                status = random.choice(statuses) if is_last_round else "Resolved"
                
                reported_str = current_time.strftime("%Y-%m-%d")
                
                resolved_str = ""
                if status == "Resolved":
                    resolution_time = current_time + timedelta(days=random.randint(1, 4))
                    resolved_str = resolution_time.strftime("%Y-%m-%d")
                else:
                    resolved_str = ""

                round_complaints.append({
                    "complaint_id": comp_id,
                    "gvp_id": gvp_id,
                    "ward": ward,
                    "status": status,
                    "category": random.choice(categories),
                    "description": f"Garbage issue reported at {gvp_id} ward {ward}",
                    "reported_date": reported_str,
                    "resolved_date": resolved_str
                })
            
            complaint_records.extend(round_complaints)

            # 2. Perform a cleanup
            current_time += timedelta(days=random.randint(1, 5))
            clean_id = f"CLN{cleanup_idx:03d}"
            cleanup_idx += 1

            cleanup_records.append({
                "cleanup_id": clean_id,
                "gvp_id": gvp_id,
                "cleaned_date": current_time.strftime("%Y-%m-%d"),
                "team": random.choice(teams),
                "waste_collected_kg": round(random.uniform(50.0, 350.0), 1),
                "duration_hours": round(random.uniform(1.0, 4.0), 1)
            })

            # Add time gap until next cycle
            current_time += timedelta(days=random.randint(10, 30))

        # Generate some recent unresolved complaints after the final cleanup (to test ML features)
        if random.random() > 0.3:
            current_time += timedelta(days=random.randint(2, 10))
            comp_id = f"COM{complaint_idx:03d}"
            complaint_idx += 1
            complaint_records.append({
                "complaint_id": comp_id,
                "gvp_id": gvp_id,
                "ward": ward,
                "status": random.choice(["Open", "In Progress"]),
                "category": random.choice(categories),
                "description": f"Recurring garbage reported after cleanup at {gvp_id}",
                "reported_date": current_time.strftime("%Y-%m-%d"),
                "resolved_date": ""
            })

    # Save to CSVs
    comp_df = pd.DataFrame(complaint_records)
    comp_df.to_csv(COMPLAINTS_OUT, index=False)
    print(f"[SUCCESS] Generated {len(comp_df)} complaints -> {COMPLAINTS_OUT}")

    clean_df = pd.DataFrame(cleanup_records)
    clean_df.to_csv(CLEANUPS_OUT, index=False)
    print(f"[SUCCESS] Generated {len(clean_df)} cleanups -> {CLEANUPS_OUT}")


if __name__ == "__main__":
    main()
