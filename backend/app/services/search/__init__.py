"""Structured, multi-source literature search.

Pipeline: natural language -> SearchIntent (LLM tool-use) -> per-source
deterministic queries (arXiv / OpenAlex / INSPIRE-HEP / ADS) -> merge + dedup
-> semantic rerank. Designed to degrade gracefully when a source or the
reranker is unavailable.
"""
