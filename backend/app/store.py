from typing import List, Dict, Any
from collections import Counter
import asyncio

# Simple in-memory store. Replace with Supabase later.
_memory = {
    "papers": [],
    "analysis": []
}


async def insert_many(collection: str, docs: List[Dict]):
    _memory[collection].extend(docs)

async def insert_one(collection: str, doc: Dict):
    _memory[collection].append(doc)

async def count_documents(collection: str) -> int:
    return len(_memory[collection])

async def find_recent(collection: str, limit: int = 50, sort_field: str = 'retrieved_at'):
    items = _memory[collection]
    return sorted(items, key=lambda x: x.get(sort_field, ''), reverse=True)[:limit]

async def aggregate(collection: str, pipeline: List[Dict]):
    # Minimal emulation for the needed aggregations
    if collection == 'papers':
        # popular queries
        queries = [p.get('search_query') for p in _memory['papers'] if p.get('search_query')]
        return [{"_id": q, "count": c} for q, c in Counter(queries).most_common(10)]
    if collection == 'analysis':
        types = [a.get('type') for a in _memory['analysis'] if a.get('type')]
        return [{"_id": t, "count": c} for t, c in Counter(types).most_common()]
    return []

async def update_many(collection: str, docs: List[Dict]):
    """Update multiple documents in the collection based on their _id"""
    if collection not in _memory:
        _memory[collection] = []

    # Create a lookup dict for faster updates
    update_dict = {doc.get('_id'): doc for doc in docs if doc.get('_id')}

    # Update existing documents or add new ones
    updated_count = 0
    for i, item in enumerate(_memory[collection]):
        item_id = item.get('_id')
        if item_id in update_dict:
            _memory[collection][i] = update_dict[item_id]
            updated_count += 1
            del update_dict[item_id]  # Remove from dict to track what's left

    # Add any remaining documents that weren't found (new documents)
    _memory[collection].extend(update_dict.values())

    return {"updated": updated_count, "inserted": len(update_dict)}
