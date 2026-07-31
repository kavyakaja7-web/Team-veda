"""
generate_map.py — Phase 2 output: interactive map of scored GVPs.

Input:  data/gvp_final.csv (output of train_model.py)
Output: data/gvp_risk_map.html — open this in a browser to view.

Usage:
    python scripts/generate_map.py
"""

import pandas as pd
import folium

INPUT_PATH = "data/gvp_final.csv"
OUTPUT_PATH = "data/gvp_risk_map.html"

# ---------------------------------------------------------------------------
# 1. Load finalized data
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
    tiles="CartoDB positron",
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

    worst_factor = row.get('worst_factor', 'N/A')
    recommended_action = row.get('recommended_action', 'N/A')
    days_since = row.get('days_since_last_cleanup', 'N/A')
    pred_rec = row.get('rf_predicted_recurrence_rate', row['recurrence_rate'])

    popup_html = f"""
    <div style="font-family: Arial, sans-serif; width: 220px;">
        <h4 style="margin:0 0 5px 0; color:#333;">{row['gvp_id']}</h4>
        <b>Risk Tier:</b> <span style="color:{color}; font-weight:bold;">{row['computed_risk_tier']}</span> ({row['risk_score']:.2f})<br>
        <b>Predicted Recurrence:</b> {pred_rec:.2f}<br>
        <b>Days Since Cleanup:</b> {days_since}<br>
        <hr style="margin: 5px 0;">
        <b>Primary Root Cause:</b><br><i style="color:#d9534f;">{worst_factor}</i><br>
        <b>Recommended Action:</b><br><b style="color:#2e6da4;">{recommended_action}</b><br>
    </div>
    """

    folium.CircleMarker(
        location=[row["lat"], row["lon"]],
        radius=6 + (row["risk_score"] * 6),
        color=color,
        fill=True,
        fill_color=color,
        fill_opacity=0.75,
        weight=1,
        popup=folium.Popup(popup_html, max_width=260),
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
            continue
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
    print("scipy not available — skipping cluster boundary polygons")

# ---------------------------------------------------------------------------
# 6. Legend
# ---------------------------------------------------------------------------
legend_html = """
<div style="position: fixed; bottom: 30px; left: 30px; z-index:9999;
            background-color: white; padding: 10px; border: 2px solid grey;
            border-radius: 6px; font-size: 14px;">
<b>GVP Risk Level</b><br>
<span style="color:red;">&#9679;</span> High Risk<br>
<span style="color:orange;">&#9679;</span> Medium Risk<br>
<span style="color:green;">&#9679;</span> Low Risk<br>
<span style="color:blue;">&#9646;</span> Cluster boundary
</div>
"""
m.get_root().html.add_child(folium.Element(legend_html))

# ---------------------------------------------------------------------------
# 7. Save
# ---------------------------------------------------------------------------
m.save(OUTPUT_PATH)
print(f"Enriched Map saved to {OUTPUT_PATH}")