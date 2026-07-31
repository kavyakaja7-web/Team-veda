"""
database.py — MongoDB connection for the GVMC GVP tracking system.

Reads MONGO_URI from the .env file and exposes a reusable `db` object
that all route/service modules can import.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/gvmc_pilot")

# Extract database name from URI (falls back to "gvmc_pilot")
_DB_NAME: str = MONGO_URI.rstrip("/").split("/")[-1] or "gvmc_pilot"

client: MongoClient = MongoClient(MONGO_URI)
db = client[_DB_NAME]

# Ensure the 2dsphere index exists on the gvp_locations collection
db["gvp_locations"].create_index([("location", "2dsphere")], background=True)
