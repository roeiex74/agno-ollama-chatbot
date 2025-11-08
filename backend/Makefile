.PHONY: help start dev test init-db clean check-ollama chat

help:  ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

start:  ## Start the server (auto-setup: venv, dependencies, Ollama, model)
	./scripts/start.sh

dev:  ## Quick start for development (assumes setup is complete)
	./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

check-ollama:  ## Check Ollama installation and model availability
	@echo "Checking Ollama..."
	@command -v ollama >/dev/null 2>&1 && echo "✓ Ollama is installed" || echo "✗ Ollama is NOT installed"
	@curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "✓ Ollama service is running" || echo "✗ Ollama service is NOT running"
	@[ -f .env ] && export $$(grep -v '^#' .env | xargs) && ollama list | grep -q "$${OLLAMA_MODEL:-llama3.2:3b}" && echo "✓ Model $${OLLAMA_MODEL:-llama3.2:3b} is available" || echo "⚠ Model not downloaded"

init-db:  ## Initialize SQLite database (creates data/ directory)
	mkdir -p data
	@echo "Database directory created at ./data/"

test:  ## Run all tests with pytest
	MEMORY_BACKEND=inmemory ./venv/bin/pytest -v

test-coverage:  ## Run tests with coverage report
	MEMORY_BACKEND=inmemory ./venv/bin/pytest --cov=app --cov-report=html --cov-report=term

chat:  ## Interactive chat demo (server must be running)
	./scripts/chat-demo.sh

clean:  ## Clean up generated files
	rm -rf __pycache__ .pytest_cache .coverage htmlcov data/*.sqlite
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

format:  ## Format code with black (if installed)
	@command -v black >/dev/null 2>&1 && black app/ tests/ || echo "black not installed, skipping format"

lint:  ## Lint code with ruff (if installed)
	@command -v ruff >/dev/null 2>&1 && ruff check app/ tests/ || echo "ruff not installed, skipping lint"
