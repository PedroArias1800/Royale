import os
from pymongo import MongoClient

_client: MongoClient | None = None


def get_db():
    global _client
    if _client is None:
        uri = os.environ["MONGODB_URI"]
        _client = MongoClient(uri, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)
    return _client["royale"]
