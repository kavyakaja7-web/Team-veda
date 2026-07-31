"""
generate_map.py — Phase 2 output: interactive map of scored GVPs.

Input:  data/gvp_scored.csv (output of cluster_and_score.py)
Output: data/gvp_risk_map.html — open this in a browser to view.

Usage:
    python scripts/generate_map.py
"""

import pandas as pd
# pyrefly: ignore [missing-import]
import folium

INPUT_PATH = "data/gvp_scored.csv"
OUTPUT_PATH = "data/gvp_risk_map.html"

# ---------------------------------------------------------------------------
# 1. Load scored data
# ---------------------------------------------------------------------------
df = pd.read_csv(INPUT_PATH)

# ---------------------------------------------------------------------------
# 2. Set up base map, centered on the pilot ward
# ---------------------------------------------------------------------------
center_lat = df["lat"].mean()
center_lon = df["lon"].mean()

m = folium.Map(
    location=[center_lat, center_lon],
    zoom_start=14,
    tiles="CartoDB positron",  # clean, light basemap — good for colored markers
)

# ---------------------------------------------------------------------------
# 3. Color mapping by risk tier
# ---------------------------------------------------------------------------
TIER_COLORS = {
    "High": "red",
    "Medium": "orange",
    "Low": "green",
}

# ---------------------------------------------------------------------------
# 4. Add a marker per GVP
# ---------------------------------------------------------------------------
for _, row in df.iterrows():
    color = TIER_COLORS.get(row["computed_risk_tier"], "gray")

    popup_html = f"""
    <b>{row['gvp_id']}</b><br>
    Risk Score: {row['risk_score']:.2f} ({row['computed_risk_tier']})<br>
    Total Complaints: {int(row['total_complaints'])}<br>
    Recurrence Rate: {row['recurrence_rate']:.2f}<br>
    Root Cause: {row['predicted_root_cause']}<br>
    Cluster: {row['cluster_id'] if row['cluster_id'] != -1 else 'None (isolated spot)'}
    """

    folium.CircleMarker(
        location=[row["lat"], row["lon"]],
        radius=6 + (row["risk_score"] * 6),  # bigger circle = higher risk
        color=color,
        fill=True,
        fill_color=color,
        fill_opacity=0.75,
        weight=1,
        popup=folium.Popup(popup_html, max_width=250),
        tooltip=f"{row['gvp_id']} — {row['computed_risk_tier']} risk",
    ).add_to(m)

# ---------------------------------------------------------------------------
# 5. Draw cluster boundaries (convex hull per cluster, skip noise=-1)
# ---------------------------------------------------------------------------
import numpy as np
try:
    from scipy.spatial import ConvexHull
    for cluster_id in sorted(df["cluster_id"].unique()):
        if cluster_id == -1:
            continue
        cluster_points = df[df["cluster_id"] == cluster_id][["lat", "lon"]].to_numpy()
        if len(cluster_points) < 3:
            continue  # need 3+ points for a hull
        hull = ConvexHull(cluster_points)
        hull_coords = cluster_points[hull.vertices].tolist()
        folium.Polygon(
            locations=hull_coords,
            color="blue",
            weight=2,
            fill=True,
            fill_opacity=0.08,
            tooltip=f"Cluster {cluster_id} ({len(cluster_points)} GVPs)",
        ).add_to(m)
except ImportError:
    print("scipy not available — skipping cluster boundary polygons (markers still shown)")

# ---------------------------------------------------------------------------
# 6. Legend
# ---------------------------------------------------------------------------
legend_html = """
<div style="position: fixed; bottom: 30px; left: 30px; z-index:9999;
            background-color: white; padding: 10px; border: 2px solid grey;
            border-radius: 6px; font-size: 14px;">
<b>GVP Risk Level</b><br>
<span style="color:red;">&#9679;</span> High<br>
<span style="color:orange;">&#9679;</span> Medium<br>
<span style="color:green;">&#9679;</span> Low<br>
<span style="color:blue;">&#9646;</span> Cluster boundary
</div>
"""
m.get_root().html.add_child(folium.Element(legend_html))

# ---------------------------------------------------------------------------
# 7. Save
# ---------------------------------------------------------------------------
m.save(OUTPUT_PATH)
print(f"Map saved to {OUTPUT_PATH} — open it in a browser to view.")
print(f"Plotted {len(df)} GVPs: {(df['computed_risk_tier']=='High').sum()} High, "
      f"{(df['computed_risk_tier']=='Medium').sum()} Medium, "
      f"{(df['computed_risk_tier']=='Low').sum()} Low")