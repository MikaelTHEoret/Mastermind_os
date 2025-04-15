from backend.mcp_integration import mcp_integration

# Initialize database connection
mcp_integration.db_init()

def test_store_trade_with_analysis():
    test_trade = {
        "id": "test_001",
        "pair": "BTC/USDT",
        "strategy": "mean_reversion",
        "timestamp": "2025-04-06T22:40:00Z"
    }
    
    analysis_text = "Strong buy signal detected with RSI(14) at 28.5 and Bollinger Band squeeze"
    
    response = mcp_integration.store_trade_data_with_analysis(test_trade, analysis_text)
    
    print(f"Vector ID: {response['vector_id']}")
    print(f"KV Key: {response['kv_key']}")
    print(f"Success: {response['success']}")

if __name__ == "__main__":
    test_store_trade_with_analysis()
