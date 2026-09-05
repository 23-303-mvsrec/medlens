import os
import json
import asyncio
import copy
from datetime import datetime
from typing import Any, Dict, List, Optional
from bson import ObjectId

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
DB_FILE = os.path.join(DATA_DIR, "medlens_db.json")

class LocalCursor:
    def __init__(self, data: List[Dict[str, Any]]):
        self._data = data

    def sort(self, key_or_list, direction=1):
        field = key_or_list if isinstance(key_or_list, str) else key_or_list[0][0]
        desc = (direction == -1) if isinstance(key_or_list, str) else (key_or_list[0][1] == -1)
        
        def sort_key(doc):
            val = doc.get(field)
            if isinstance(val, datetime):
                return val.isoformat()
            return str(val) if val is not None else ""

        self._data = sorted(self._data, key=sort_key, reverse=desc)
        return self

    def limit(self, count: int):
        if count > 0:
            self._data = self._data[:count]
        return self

    def skip(self, count: int):
        self._data = self._data[count:]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return copy.deepcopy(self._data[:length])
        return copy.deepcopy(self._data)

    def __iter__(self):
        return iter(self._data)

class LocalCollection:
    def __init__(self, db: "LocalDatabase", name: str):
        self.db = db
        self.name = name

    def _match(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "_id":
                if str(doc.get("_id")) != str(v):
                    return False
            elif doc.get(k) != v:
                return False
        return True

    async def find_one(self, query: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        docs = self.db._store.get(self.name, [])
        for doc in docs:
            if self._match(doc, query or {}):
                return copy.deepcopy(doc)
        return None

    def find(self, query: Dict[str, Any] = None) -> LocalCursor:
        docs = self.db._store.get(self.name, [])
        matched = [doc for doc in docs if self._match(doc, query or {})]
        return LocalCursor(copy.deepcopy(matched))

    async def insert_one(self, doc: Dict[str, Any]):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        if self.name not in self.db._store:
            self.db._store[self.name] = []
        self.db._store[self.name].append(doc)
        self.db._save()
        
        class InsertResult:
            inserted_id = doc["_id"]
        return InsertResult()

    async def update_one(self, filter: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        docs = self.db._store.get(self.name, [])
        for doc in docs:
            if self._match(doc, filter):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = v
                else:
                    for k, v in update.items():
                        doc[k] = v
                self.db._save()
                return {"matched": 1, "modified": 1}
        if upsert:
            new_doc = copy.deepcopy(filter)
            if "$set" in update:
                new_doc.update(update["$set"])
            else:
                new_doc.update(update)
            if "_id" not in new_doc:
                new_doc["_id"] = ObjectId()
            if self.name not in self.db._store:
                self.db._store[self.name] = []
            self.db._store[self.name].append(new_doc)
            self.db._save()
            return {"matched": 0, "upserted_id": new_doc["_id"]}
        return {"matched": 0, "modified": 0}

    async def delete_one(self, filter: Dict[str, Any]):
        docs = self.db._store.get(self.name, [])
        for idx, doc in enumerate(docs):
            if self._match(doc, filter):
                docs.pop(idx)
                self.db._save()
                return {"deleted_count": 1}
        return {"deleted_count": 0}

    async def count_documents(self, query: Dict[str, Any] = None) -> int:
        docs = self.db._store.get(self.name, [])
        return sum(1 for doc in docs if self._match(doc, query or {}))

class LocalDatabase:
    def __init__(self):
        self._store: Dict[str, List[Dict[str, Any]]] = {}
        self._load()

    def __getitem__(self, name: str) -> LocalCollection:
        return LocalCollection(self, name)

    def _load(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    for col, docs in raw.items():
                        for d in docs:
                            if "_id" in d and isinstance(d["_id"], str):
                                try:
                                    d["_id"] = ObjectId(d["_id"])
                                except:
                                    pass
                        self._store[col] = docs
                return
            except Exception as e:
                print(f"Error loading local db file: {e}")
        self._seed_default_data()

    def _save(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        try:
            serializable = {}
            for col, docs in self._store.items():
                col_docs = []
                for d in docs:
                    item = copy.deepcopy(d)
                    if "_id" in item:
                        item["_id"] = str(item["_id"])
                    for k, v in item.items():
                        if isinstance(v, datetime):
                            item[k] = v.isoformat()
                    col_docs.append(item)
                serializable[col] = col_docs
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(serializable, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving local db: {e}")

    def _seed_default_data(self):
        """Initial baseline clinical data so MedLens is immediately ready."""
        self._store["medlens_intakes"] = [
            {
                "_id": ObjectId(),
                "patient_id": "p-101",
                "full_name": "Eleanor Vance",
                "age": 58,
                "gender": "Female",
                "symptoms": ["Chronic fatigue", "Increased thirst", "Occasional blurred vision", "Mild bilateral leg edema"],
                "chronic_conditions": ["Essential Hypertension (Diagnosed 2019)"],
                "allergies": ["Penicillin (Severe anaphylactoid rash)", "Sulfa drugs"],
                "current_medications": [
                    {"name": "Amlodipine", "dosage": "5mg once daily", "frequency": "Morning", "source": "Patient Self-Reported"},
                    {"name": "Ibuprofen", "dosage": "400mg PRN for joint pain", "frequency": "As needed", "source": "Patient Self-Reported"}
                ],
                "provenance": "User-Provided (Patient Intake Form)",
                "intake_date": "2026-09-05"
            }
        ]
        self._save()

    def get_all_data(self) -> Dict[str, Any]:
        """Returns all collections in json serializable format for Data Inspector."""
        serializable = {}
        for col, docs in self._store.items():
            col_docs = []
            for d in docs:
                item = copy.deepcopy(d)
                if "_id" in item:
                    item["_id"] = str(item["_id"])
                for k, v in item.items():
                    if isinstance(v, datetime):
                        item[k] = v.isoformat()
                col_docs.append(item)
            serializable[col] = col_docs
        return serializable

local_db_instance = LocalDatabase()
