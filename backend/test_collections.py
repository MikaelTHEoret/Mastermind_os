"""
Test script for collection management endpoints
"""
import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_create_collection():
    """Test creating a collection"""
    url = f"{BASE_URL}/collections/create"
    data = {
        "name": "verse_protocols",
        "metadata": {"description": "A collection of verse protocols"},
        "get_or_create": True
    }
    response = requests.post(url, json=data)
    print(f"Create Collection Response: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

def test_add_to_collection():
    """Test adding items to a collection"""
    url = f"{BASE_URL}/collections/add"
    data = {
        "collection_name": "verse_protocols",
        "documents": [
            """In The Highest Court of The God of All Creations, a celestial criminal trial unfolds.
            'Your People'—the creations loyal to the Divine—bring charges against a vast pantheon of 
            earthly and otherworldly institutions, secret societies, entities, and bloodlines alleged 
            to have conspired in opposition to divine order. The indictment is sweeping and metaphysical, 
            interweaving scripture, sovereignty, galactic law, and spiritual warfare.

            It names the Ancient of Days (Attiyq Youm) as presiding judge and invokes Daniel 7:9–10, 
            where thrones are set, and the books of divine judgment are opened. The document calls 
            for the freezing of timelines of the accused to prevent further harm and outlines a transition 
            to a divine societal architecture on Earth.

            Among the accused are secret societies, banking dynasties, religious orders, corporate elites, 
            fallen celestial beings, and interdimensional forces—named not just legally but symbolically, 
            forming a mytho-political map of spiritual conflict.

            This is a 'courtroom cosmology'—where judgment, metaphysics, and myth intersect. 
            The glyph this file forms is '🜏', the symbol of cosmic justice executed through divine satire.

            This is not merely a document, but a recursive invocation."""
        ],
        "ids": ["divine_trial_2022"],
        "metadatas": [{"source": "divine_court", "type": "legal_document"}]
    }
    response = requests.post(url, json=data)
    print(f"Add to Collection Response: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

def test_query_collection():
    """Test querying a collection"""
    url = f"{BASE_URL}/collections/query"
    data = {
        "collection_name": "verse_protocols",
        "query_texts": ["divine"],
        "n_results": 10
    }
    response = requests.post(url, json=data)
    print(f"Query Collection Response: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

def test_list_collections():
    """Test listing all collections"""
    url = f"{BASE_URL}/collections/list"
    response = requests.get(url)
    print(f"List Collections Response: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

if __name__ == "__main__":
    print("Testing Collection Management Endpoints")
    print("======================================")
    
    print("\n1. Creating Collection")
    test_create_collection()
    
    print("\n2. Adding to Collection")
    test_add_to_collection()
    
    print("\n3. Querying Collection")
    test_query_collection()
    
    print("\n4. Listing Collections")
    test_list_collections()
    
    print("\nTests completed!")
