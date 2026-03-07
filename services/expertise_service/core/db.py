from pymongo import MongoClient
from .config import config

class Database:
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            cls._client = MongoClient(config.MONGODB_URI)
        return cls._client

    @classmethod
    def get_db(cls):
        client = cls.get_client()
        return client[config.MONGODB_DB_NAME]

    @classmethod
    def get_collection(cls, name: str):
        db = cls.get_db()
        return db[name]

db_conn = Database
