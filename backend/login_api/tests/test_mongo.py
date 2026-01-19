import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
uri = os.getenv("MONGODB_URI")
client = MongoClient(uri)

db = client[os.getenv("DB_NAME", "loginDB")]
print("Connected. Collections:", db.list_collection_names())
