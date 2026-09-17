# WikiFact Lens — Wikimedia Structured Evidence Comparison Tool

**WikiFact Lens** is a research-grade evidence-comparison and verification application built on authentic **Wikimedia Enterprise Structured Wikipedia Datasets**. It audits structured information in Wikipedia articles (such as infobox fields) against statements in the article's main prose to identify potential inconsistencies and facilitate human verification.

---

## ⚠️ Core Directive & Responsible AI Policy

> **"WikiFact Lens identifies possible inconsistencies between structured data and article text. A detected difference is not proof that either value is incorrect. Findings require human verification."**

1. **Evidence-Review Tool, Not a Truth-Determination System**: The application **NEVER** claims that a fact is false merely because two values differ.
2. **Exact Conclusion Phrase**: For discrepancies, the system strictly concludes:
   ```
   "Possible mismatch detected."
   ```
3. **No "Fact is False" Actions**: Human auditor actions are strictly bounded to:
   - `Confirmed Match`
   - `Needs Human Review`
   - `Not Comparable`
   - `False Positive`

---

## 🏛️ Flagship Feature: The Evidence Bridge

The visual differentiator of WikiFact Lens is the **6-Stage Evidence Bridge**, which connects every claim to its source through an unbroken audit trail:

```
[1. Infobox Fact] ──> [2. Normalization] ──> [3. Text Evidence] ──> [4. 5-Layer Engine] ──> [5. Conclusion] ──> [6. Human Review]
```

1. **Infobox Fact**: Raw value, field key, and category from the Wikimedia Enterprise Infobox part tree.
2. **Deterministic Normalization**: Stripping citation tags, canonical ISO dates, geographical and titular normalization.
3. **Prose Evidence**: Verbatim sentence from article body with character offsets and target keyword highlighting.
4. **5-Layer Engine Evaluation**: Layer identification (Exact, Semantic, Entity, Specialized, or Confidence).
5. **Auto Conclusion**: Strict phrasing (`Possible mismatch detected.`, `Consistent with article text.`, etc.).
6. **Auditor Review**: Human determination and notes persisted in the audit ledger.

---

## 🔬 The 5-Layer Verification Engine

1. **Layer 1: Exact Verbatim Normalization**
   - Canonical case-insensitive comparison
   - Stripping of wikitext citation references (`[1]`, `[note 2]`) and punctuation
2. **Layer 2: Semantic Substring Containment**
   - Token overlap and multi-word phrase containment
3. **Layer 3: Named Entity Classification**
   - Normalization of Person names (stripping peerage titles, honorifics, prefixes)
   - Location inclusion (matching city to state/country)
4. **Layer 4: Specialized Chronological Normalization**
   - Multi-format parsing (ISO 8601, European DMY, American MDY, Year-only)
   - Isolating day, month, and year shifts to detect numeric variance
5. **Layer 5: Evidence Confidence Scoring (0–100)**
   - Exactness: up to +30 pts
   - Entity Match: up to +25 pts
   - Normalization Certainty: up to +20 pts
   - Semantic Similarity: up to +25 pts
   - Conflicting Statement Penalty: -25 pts

---

## 📊 Benchmark Dataset Included

The application ships with authentic Wikipedia articles modeled directly on the **Wikimedia Enterprise Structured Contents schema**:

- `Duke of Châtellerault` (ID: `874312`) — Historic creation date discrepancy (1548 vs 1549)
- `Ada Lovelace` (ID: `1284`) — Scientific biography with birth dates and collaborator references
- `Alan Turing` (ID: `8203`) — Cryptanalyst biography with educational institutions and dates
- `Alexander Fleming` (ID: `18564`) — Nobel prize laureate with discovery timelines
- `Marie Curie` (ID: `19167`) — Multiple Nobel prizes and element discoveries
- `Apple Inc.` (ID: `856`) — Corporate infobox with founding dates and executive roles
- `Wikipedia` (ID: `33947`) — Encyclopedic entry with launch dates and owners
- `James Webb Space Telescope` (ID: `5013098`) — Aerospace mission with launch date and orbit
- `Rosalind Franklin` (ID: `25779`) — Biophysicist with institution and discovery dates
- `Apollo 11` (ID: `841`) — Lunar mission with launch and landing coordinates

---

## 🚀 Application Architecture

- **Backend**: Node.js + TypeScript + Express (`server.ts`, `/server/routes/api.ts`, `/server/services/`)
- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide Icons + Motion
- **Dataset Adapter**: Recursive parser traversing Wikimedia Enterprise part trees (`infobox`, `field`, `section`)
- **AI Integration**: Optional server-side Gemini 3.8 Flash for subtle semantic reconciliation with tripartite evidence separation:
  1. *Source Data*
  2. *Textual Evidence*
  3. *Model Interpretation*

---

## 📡 API Reference

- `GET /api/health`: Service health and dataset article count
- `GET /api/articles/search?q={query}`: Query indexed articles
- `GET /api/articles/:id`: Get article overview and extracted structured facts
- `GET /api/articles/:id/compare?ai={bool}`: Run 5-layer comparison on all facts
- `POST /api/articles/:id/compare-fact`: Compare single fact on demand
- `GET /api/reviews`: List findings with status and review filters for the Review Queue
- `POST /api/reviews/:factId`: Record human verification decision and notes
- `GET /api/stats`: Dynamic dashboard metrics (mismatches, matches, reviews)
- `GET /api/reports/:articleId`: Generate official audit report with methodology and limitations
- `POST /api/articles/import`: Ingest custom Wikimedia Enterprise JSON articles

---

## 📜 License

Apache-2.0
