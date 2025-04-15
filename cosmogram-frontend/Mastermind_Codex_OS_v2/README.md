# GPT Trading Assistant Project

A sophisticated trading assistant that uses dual LLM models (Mistral and LLaMA2) for intelligent trading decisions and data management on the BTCC exchange.

## Features

- **Dual LLM Architecture**
  - Trader Model (Mistral): Handles trading decisions and data collection
  - Archivist Model (LLaMA2): Manages database operations and historical analysis

- **Intelligent Agents**
  - Web Intelligence Agent for market signals
  - News Event Agent for market news analysis
  - Market Analysis Agent for technical analysis

- **Interactive GUI**
  - Real-time market data visualization
  - Active trade monitoring
  - Performance metrics dashboard
  - System logs viewer
  - Control panel for trading operations

## Prerequisites

- Python 3.8 or later
- Node.js 18 or later
- Ollama (for local LLM inference)
- BTCC API credentials
- Required MCP Servers:
  - Database MCP
  - Qdrant MCP
  - Ollama MCP

## Quick Start

1. **Launch the Trading Assistant**:
   ```bash
   # PowerShell
   .\launch_trader.ps1

   # or Command Prompt
   launch_trader.bat
   ```
   Choose whether to launch with GUI or console mode when prompted.

2. **GUI Interface**:
   - Access the web interface at `http://localhost:8501`
   - Monitor trades in real-time
   - View performance metrics
   - Control trading operations
   - Adjust system settings

3. **Console Mode**:
   - View logs and trading activity in the terminal
   - Monitor system status
   - Receive real-time alerts

## Project Structure

```
gpt_trader_assistant/
├── agents/                 # Intelligent agents
├── btcc/                  # BTCC API integration
├── llm/                   # LLM integration
├── gui/                   # Web interface
├── config/               # Configuration files
├── data/                 # Data storage
│   ├── market_data/     # Market data
│   ├── news_events/     # News data
│   ├── web_intelligence/ # Web scraping data
│   ├── trade_log/       # Trading history
│   └── vector_store/    # Vector embeddings
└── logs/                # Application logs
```

## Configuration

1. **Environment Setup**:
   - Copy `config/secrets.env.example` to `.env`
   - Add your BTCC API credentials
   - Configure Ollama models and MCP servers

2. **Trading Parameters**:
   - Edit `config/trading_assistant.json`
   - Adjust risk management settings
   - Configure strategy parameters
   - Set technical indicators

## Development

1. **Setup Environment**:
   ```bash
   cd gpt_trader_assistant
   .\setup.ps1  # or setup.bat
   ```

2. **Run Tests**:
   ```bash
   python -m pytest
   ```

3. **Code Style**:
   - Uses Black for formatting
   - Flake8 for linting
   - Pre-commit hooks for quality checks

## GUI Features

1. **Market Overview**:
   - Real-time price charts
   - Technical indicators
   - Market sentiment analysis

2. **Trade Management**:
   - Active positions view
   - Order placement/cancellation
   - Position sizing calculator

3. **Performance Analytics**:
   - Profit/Loss tracking
   - Win rate statistics
   - Risk metrics

4. **System Controls**:
   - Start/Stop trading
   - Emergency stop button
   - Risk level adjustment
   - Feature toggles

## Troubleshooting

1. **Common Issues**:
   - Check MCP server connections
   - Verify Ollama models are installed
   - Ensure API credentials are correct
   - Check log files for errors

2. **Support**:
   - Review logs in `logs/trading_assistant.log`
   - Check system status in GUI
   - Verify environment variables

## License

MIT License - see LICENSE file for details.

## Disclaimer

This software is for educational purposes only. Trading cryptocurrencies carries significant risks. Always test thoroughly in simulation mode before live trading.
