I spent two years building and operating a production RAG system that indexed 10M+ financial documents and answered 50K+ analyst queries a month. This guide is everything I wish someone had handed me on day one — from the fundamentals to the agentic patterns that actually survive contact with production.

## 1. Fundamentals: what RAG actually is

Think of a closed-book exam versus an open-book exam. In a closed-book exam you can only use what you've memorized. In an open-book exam, you look things up when you need specific information.

**RAG (Retrieval-Augmented Generation) gives an LLM the open-book ability.** Instead of relying only on what it learned during training, it looks things up in a knowledge base before answering.

### The problems RAG solves

LLMs have three structural limitations:

- **Knowledge cutoff** — they only know information up to their training date. They don't know what happened yesterday.
- **Hallucination** — when they don't know something, they can produce plausible-sounding but incorrect answers.
- **No private data** — they can't see your company's internal documents, databases, or proprietary information.

RAG addresses all three by fetching relevant information from external sources at query time and handing it to the LLM as context, so the answer is grounded, current, and specific to *your* data.

### The traditional RAG flow

```
User query ──▶ Retrieve relevant chunks ──▶ LLM generates answer ──▶ Response
```

Concretely, for a support bot answering "How do I reset my password?":

1. **Query processing** — the system receives the question.
2. **Retrieval** — it searches your documentation and finds the relevant chunks (the reset procedure, the FAQ entry, the recovery article).
3. **Augmentation** — retrieved chunks are combined with the question into a prompt: *"Context: [retrieved docs] … Answer the user's question based only on the provided context."*
4. **Generation** — the LLM answers from your actual documentation, not just its training data.

### Agentic RAG: the evolution that matters

Traditional RAG follows a recipe: always retrieve once, then generate. Predictable, but rigid.

**Agentic RAG** puts a decision-maker in the loop. Before and during retrieval, an agent asks itself:

- Do I even need to retrieve for this question?
- Which data source should I search?
- Should I search once, or iterate?
- Is my draft answer good enough, or do I need more evidence?

For a query like *"Compare our Q3 sales performance to industry averages and suggest improvements"*, an agent might search the internal sales database, then external industry reports, then meeting notes — three different retrievals it **decided** to make, in an order it chose. That decision-making is the entire difference.

## 2. Vector embeddings: the foundation

Imagine every piece of text as a location on a map. Similar concepts sit close together, unrelated ones far apart: "cat" neighbors "dog", sits far from "automobile" — and famously, *king − man + woman ≈ queen*. Embeddings are that map, except in hundreds or thousands of dimensions.

Technically: an **embedding** is a numerical representation of text as an array of numbers (commonly 384, 768, 1536, or 3072 dimensions) that encodes its semantic meaning. Texts with similar meaning produce similar vectors.

```
Text:      "The cat sat on the mat"
Embedding: [0.2, -0.5, 0.8, 0.1, ..., -0.3]   // 1536 numbers
```

### Why this matters: keyword search vs semantic search

| | Keyword search | Semantic search (embeddings) |
|---|---|---|
| Query | "how to fix a broken screen" | "how to fix a broken screen" |
| Finds | only docs containing "broken screen" | "cracked display repair", "shattered monitor fix", "screen damage solutions" |
| Matches by | exact words | meaning |

### Embedding models worth knowing

- **OpenAI `text-embedding-3-small` / `-large`** — the current OpenAI family (1536/3072 dims); `ada-002` is the legacy predecessor you'll still see in older codebases.
- **Open-source sentence-transformers / BGE families** — self-hostable, strong quality per dollar, typically 384–1024 dims.
- **Cohere Embed** — optimized for search and classification.
- **Voyage AI** — strong domain-specialized models (code, finance, law).

Whichever you choose: **you must embed queries and documents with the same model.** Mixing models gives you vectors in incompatible spaces.

### The ingestion pipeline

1. **Ingest** your documents.
2. **Chunk** them into pieces (a 5,000-word manual becomes dozens of ~200–400 token chunks).
3. **Embed** each chunk through the model.
4. **Store** each vector in a vector database alongside the original text and metadata:

```json
{
  "id": "doc1_chunk1",
  "text": "Introduction and Setup: To begin...",
  "embedding": [0.123, -0.456, 0.789],
  "metadata": { "document": "Product Manual", "page": 1 }
}
```

5. **At query time**, embed the user's question and find the nearest stored vectors.

### Similarity metrics

- **Cosine similarity** (most common) — measures the angle between vectors, range −1 to 1. Direction over magnitude: "cat" and "cats" score as similar even if one vector is longer.
- **Dot product** — angle *and* magnitude; faster to compute, equivalent to cosine when vectors are normalized.
- **Euclidean distance** — straight-line distance; smaller means more similar.

### Chunking: the unglamorous part that decides your quality

You can't embed a whole book as one vector — you'd average away all the detail. So you chunk. The two main strategies:

- **Fixed-size chunking** — split every N tokens. Simple, fast, but can cut sentences awkwardly.
- **Semantic chunking** — split at natural boundaries (paragraphs, sections). Preserves context, costs more effort, retrieves better.

The trade-off in one breath: **small chunks (100–200 tokens)** match precisely but lack context; **large chunks (500–1000 tokens)** carry full context but dilute the match and waste tokens. The sweet spot in most systems I've shipped: **200–400 tokens with 50–100 tokens of overlap** so context survives across boundaries.

## 3. Retrieval techniques

### Dense vs sparse — and why you want both

**Dense retrieval** (vector search) understands meaning: "automobile repair" finds your "car maintenance" docs. **Sparse retrieval** (BM25/TF-IDF keyword matching) nails exact terms: product codes, error codes, jargon like `SKU-12345`.

**Hybrid search** runs both and merges the result lists — typically with Reciprocal Rank Fusion (RRF). It shines on queries like *"How to configure SSL for the XYZ-2000?"*: dense search understands *SSL configuration*, sparse search pins the exact *XYZ-2000*, and the fusion finds the doc that has both.

### Top-K: how many chunks to fetch

- **K = 3–5** — fast and focused, but can miss relevant material.
- **K = 10–20** — more complete, more noise, more cost.
- **K = 50+** — thorough, expensive, and often *confuses* the LLM with marginal context.

A useful refinement is **dynamic K**: if the top hit scores 0.95, three chunks may be plenty; if it scores 0.65, widen the net.

### Reranking: the second stage

First-stage retrieval is fast but crude. **Reranking** re-scores the candidates with a heavier model:

1. **Stage 1 — fast retrieval:** embeddings fetch the top 50–100 candidates from millions.
2. **Stage 2 — precise reranking:** a cross-encoder scores each (query, document) pair together and reorders.

The fishing analogy: cast a wide net and catch 100 fish quickly, *then* examine each fish carefully. You can't examine the whole ocean, but you can examine your catch.

```
Bi-encoder  (stage 1):  embed query and doc separately → compare vectors → fast
Cross-encoder (stage 2): read query + doc together → one relevance score → accurate
  "how reset password?" + "Password Reset Guide" → 0.95
  "how reset password?" + "Company History"      → 0.12
```

### Metadata filtering

Documents carry structure — date, author, department, access level. Filter on it:

```json
{
  "semantic_query": "quarterly sales figures",
  "filters": {
    "department": "sales",
    "document_type": "report",
    "date": { "gte": "2024-07-01", "lte": "2024-09-30" }
  }
}
```

You search fewer documents, get more accurate results, and — critically in any multi-tenant or enterprise system — **you enforce access control at retrieval time**, not after.

### Query transformation

The user's raw query is often not the best search query:

- **Rewriting** — "How 2 fix err 404?" → "How to resolve HTTP 404 error?"
- **Expansion** — "car problems" → "car problems automobile issues vehicle maintenance"
- **HyDE** (covered below) — search with a hypothetical *answer* instead of the question.

## 4. Agentic systems

### What makes an agent an agent

A traditional program is a vending machine: press C4, get chips. An **agent** is a personal assistant: you say "I'm hungry" and it checks the fridge, weighs cooking vs ordering, and acts. Agents **perceive, decide, and act** — and the capabilities that enable that are:

1. **Perception** — understanding the situation and intent
2. **Planning** — decomposing goals into subtasks
3. **Tool use** — calling functions, APIs, databases, search
4. **Reasoning** — working through options step by step
5. **Memory** — retaining context within and across sessions

### ReAct: reasoning + acting

The ReAct loop interleaves thinking with doing: **Thought → Action → Observation → repeat** until done.

```
Question: "What's Tesla's stock price and how does it compare to last month?"

Thought 1: I need the current Tesla price
Action 1:  search_stock_price("TSLA")
Obs 1:     $242.84

Thought 2: Now I need last month's price
Action 2:  get_historical_price("TSLA", "1_month_ago")
Obs 2:     $218.32

Thought 3: Compute the change and answer
Action 3:  calculate_percentage_change(218.32, 242.84)
Obs 3:     +11.2%

Answer: TSLA trades at $242.84, up 11.2% from $218.32 a month ago.
```

### Tool use / function calling

You define tools with names, descriptions, and parameter schemas; the model decides when and how to call them:

```json
{
  "name": "search_documents",
  "description": "Search the company knowledge base",
  "parameters": {
    "query": "search query string",
    "filters": "optional metadata filters"
  }
}
```

A single user request — *"Find all high-priority bugs from last sprint and email the list to the dev lead"* — becomes a chain the agent composes itself: `query_database(...)` → format results → `send_email(...)`.

### Planning strategies

- **Forward planning** — build the full plan upfront, then execute step by step.
- **Reactive planning** — decide each next step from the latest observation; adapts well to surprises.
- **Hierarchical planning** — decompose into sub-goals, each with its own steps:

```
Main goal: analyze the market
├── Research competitors → find list → analyze each
├── Review our performance → sales data → customer feedback
└── Synthesize findings
```

### Memory

- **Short-term (working)** — the current context window; gone when the session ends.
- **Long-term (persistent)** — facts stored in a database or vector store across sessions.
- **Episodic** — specific past interactions ("last week you asked about Project X").
- **Semantic** — distilled general facts ("this user prefers concise answers").

The practical payoff: an agent that hears "I'm working on Project Phoenix, our new mobile app" on Monday and on Wednesday can answer "How's the market for apps like mine?" without being re-told.

### Reflection

A reflection step has the agent critique its own draft before returning it: *generate → "is this accurate, complete, well-reasoned?" → revise if not*. It's the difference between "restart the server" and "drain pending transactions, gracefully stop services, *then* restart" — the second answer came from the agent catching its own shortcut.

## 5. Advanced RAG techniques

Naive RAG (one retrieval, one generation) fails in predictable ways: badly worded queries retrieve junk, there's no retry when retrieval misses, irrelevant context pollutes the prompt, multi-hop questions can't be answered, and nothing verifies the result. The techniques below each attack one of those failures.

### Query decomposition

Break a compound question into answerable sub-queries:

> "Compare the revenue growth of our top 3 products last year and explain which marketing campaigns were most effective"

becomes: top 3 products? → growth of each? → which campaigns ran? → results of each? Each sub-query retrieves cleanly; the synthesis happens at the end.

### Step-back prompting

Before the specific question ("How do I configure SSL on the XYZ-2000 router?"), ask the general one ("What are the principles of SSL configuration?"). General context first makes the specific retrieval — and the final answer — better grounded.

### HyDE: hypothetical document embeddings

The key insight: **your documents are written as answers, not questions** — so searching with a question-shaped vector is a mismatch. HyDE fixes the shape:

1. User asks: "What are the symptoms of network latency issues?"
2. The LLM *hallucinates a plausible answer* ("slow page loads, timeouts, packet loss…").
3. You embed that hypothetical answer and search with **it**.
4. Real documentation — which reads like the hypothetical — matches far better.
5. Generate the real answer from the retrieved docs.

The hallucination never reaches the user; it's only a better search key.

### Contextual compression

Retrieved chunks carry fluff. Compression extracts only what's relevant to the query before it hits the prompt — a 300-word chunk about company history that happens to end with "Q3 revenue reached $2.3M" gets compressed to that one sentence when the question is "What was Q3 revenue?". Fewer tokens, lower cost, sharper focus.

### Recursive retrieval

Documents reference other documents. Follow the trail: the cancellation policy says "see Refund Policy [DOC-123]" → fetch DOC-123 → it mentions corporate-policy exceptions → fetch those too. The final answer draws on the whole connected set.

### Query routing

Not every query belongs in the vector store:

```
Incoming query
├── Financial/aggregate question → SQL database
├── Technical docs              → vector store (engineering)
├── HR policy                   → vector store (HR)
├── Current events              → web search
└── General knowledge           → LLM directly, no retrieval
```

"What was our revenue last quarter?" should run a SQL query, not a similarity search.

### Self-query

Let the agent extract structure from natural language itself: *"Show me sales reports from the marketing department created after January 2024"* parses into a semantic query ("sales reports") plus filters (`department=marketing`, `date >= 2024-01-01`) — no hand-written filter logic.

### Iterative retrieval

Don't stop at round one. Retrieve → assess ("is this enough to answer?") → refine the query → retrieve again — until the agent judges it has sufficient evidence. This loop is what lets agentic RAG handle research-grade questions that no single retrieval can satisfy.

## 6. Evaluation: you can't improve what you don't measure

RAG systems fail silently — irrelevant retrievals, missed documents, hallucinated facts, answers that sound great and are wrong. Without measurement you won't even know *which* stage is failing.

### Retrieval metrics

- **Precision** = relevant retrieved / total retrieved. *Retrieved 10, 8 relevant → 0.80.*
- **Recall** = relevant retrieved / total relevant in the corpus. *20 relevant exist, you got 8 → 0.40.*
- **F1** = harmonic mean of the two.

The trade-off is real: retrieving 3 perfect chunks (100% precision) while missing 10 relevant ones starves the answer; retrieving 50 chunks to catch 12 relevant ones (92% recall, 24% precision) drowns the LLM in noise. In practice, aim for roughly **70–80% precision with 60–70% recall** and tune from there.

### Ranking metrics

- **MRR (Mean Reciprocal Rank)** — how early does the first relevant document appear? First hit at rank 1 → 1.0; at rank 3 → 0.33. Average across queries.
- **NDCG** — position-weighted relevance for graded (not just binary) judgments; rewards putting the *most* relevant docs at the top.

### Generation metrics

- **Answer relevance** — does it actually answer the question? ("We had a great quarter!" is not an answer to "What was Q3 revenue?")
- **Faithfulness / groundedness** — is every claim supported by the retrieved context? Context says $2.3M and the answer says $2.8M → hallucination, regardless of how confident it sounds.
- **Context relevance** — was the retrieved context even useful for this question?

### RAGAS

The RAGAS framework automates exactly these four scores — context precision, context recall, faithfulness, answer relevancy — using LLM-as-judge, which makes it practical to run on every release instead of only when something breaks.

### Building a test set

1. **Collect real user queries** — the best test data you'll ever get.
2. **Write golden answers** for each.
3. **Annotate which documents** should be retrieved.
4. **Cover the query taxonomy**: factual ("what is X"), procedural ("how do I X"), comparative, analytical ("why did X happen"), and multi-hop.

```json
{
  "query": "How do I reset my password?",
  "ground_truth_answer": "Click 'Forgot Password' on the login page...",
  "relevant_doc_ids": ["doc_123", "doc_456"],
  "expected_answer_contains": ["forgot password", "email link"]
}
```

### A/B testing and humans

Offline metrics get you to the starting line; production decides the race. Run variants (K=5/200-token chunks vs K=10/400-token chunks) against user satisfaction, task completion, latency, cost per query, and follow-up-question rate — and accept that the better variant sometimes costs more. And keep humans in the loop with a simple 1–5 rubric (accuracy, completeness, clarity, relevance, helpfulness): automated metrics are the smoke detector, humans are the fire inspection.

## Closing thoughts

If you remember three things from this guide:

1. **Retrieval quality caps answer quality.** No prompt engineering rescues bad chunks — invest in chunking, hybrid search, and reranking first.
2. **Agency is a loop, not a feature.** The wins of agentic RAG come from letting the system decide *whether, where, and how often* to retrieve.
3. **Evaluation is the system.** A RAG pipeline without metrics isn't engineering — it's vibes. Build the test set before you build the next feature.

Questions, war stories, or disagreements? My inbox is open — hit the Tavern. ⚔️
