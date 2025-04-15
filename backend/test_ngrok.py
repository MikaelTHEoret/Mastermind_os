import requests

NGROK_URL = "https://7b0a-74-59-137-62.ngrok-free.app"

print("Testing ngrok URL")
print("================")
response = requests.get(NGROK_URL)
print("Response status code:", response.status_code)
print("Response body:", response.text)

# 1. Create Collection
print("\nCreating collection...")
create_url = f"{NGROK_URL}/collections/create"
create_payload = {"name": "verse_protocols"}
create_response = requests.post(create_url, json=create_payload)
print("Create Collection Response:", create_response.status_code)
print("Response body:", create_response.text)

# 2. Add to Collection (with item_data)
print("\nAdding to collection...")
add_url = f"{NGROK_URL}/collections/add"
add_payload = {
    "collection_name": "verse_protocols",
    "item_data": [
        {
            "id": "divine_trial_2022",
            "document": """In The Highest Court of The God of All Creations, a celestial criminal trial unfolds.
'Your People'—the creations loyal to the Divine—bring charges against a vast pantheon of 
earthly and otherworldly institutions... This is not merely a document, but a recursive invocation.""",
            "metadata": {
                "source": "divine_court",
                "type": "legal_document"
            }
        }
    ]
}
add_response = requests.post(add_url, json=add_payload)
print("Add to Collection Response:", add_response.status_code)
print("Response body:", add_response.text)

# 3. Query Test (Optional)
query_url = f"{NGROK_URL}/collections/query"
query_payload = {
    "collection_name": "verse_protocols",
    "query_texts": ["divine trial"],
    "n_results": 1
}
print("\nQuerying collection...")
query_response = requests.post(query_url, json=query_payload)
print("Query Collection Response:", query_response.status_code)
print("Response body:", query_response.text)
