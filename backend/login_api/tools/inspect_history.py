#!/usr/bin/env python3
"""
Inspect history documents and report entries missing or having empty `user_id`.
Usage: python tools/inspect_history.py [--limit N]
"""
import argparse
from pprint import pprint
from config import db as cfg_db

# try to use the sync collection if available
try:
    coll = cfg_db.history_collection
except Exception:
    # fall back to motor async client (not ideal for simple scripts)
    coll = cfg_db.db.history


def main(limit: int = 20):
    print("Inspecting history collection for missing or empty user_id fields...")
    # Query for docs where user_id is missing or null or empty string
    q = {"$or": [{"user_id": {"$exists": False}}, {"user_id": None}, {"user_id": ""}]}
    total = coll.count_documents(q)
    print(f"Found {total} docs with missing/empty user_id")
    if total == 0:
        return
    print(f"Showing up to {limit} sample documents:")
    for doc in coll.find(q).limit(limit):
        # if ObjectId present, convert to str for readability
        d = dict(doc)
        if "_id" in d:
            d["_id"] = str(d["_id"])
        pprint(d)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, default=20)
    args = p.parse_args()
    main(limit=args.limit)
