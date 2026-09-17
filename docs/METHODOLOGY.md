# Verification Methodology & Confidence Scoring

## 1. Overview

WikiFact Lens audits claims between structured metadata (infobox parts) and unstructured prose passages in Wikipedia articles. This document details the normalization heuristics, comparison algorithms, confidence formulas, and responsible AI safeguards used by the system.

---

## 2. Normalization Rules

Deterministic normalization ensures that trivial formatting differences (such as citations, punctuation, whitespace, and case) do not trigger false mismatches:

### 2.1 String & Punctuation Normalization
- Citation tags matching `\[\d+\]` or `\[note \d+\]` are removed.
- Leading and trailing quotation marks and brackets are stripped.
- Multiple consecutive whitespace characters are collapsed into a single space.
- Canonical lowercase comparison is performed alongside title-cased display.

### 2.2 Chronological Date Normalization
- Formats supported:
  - ISO 8601: `YYYY-MM-DD`
  - European format: `DD Month YYYY` (e.g. `10 December 1815`)
  - American format: `Month DD, YYYY` (e.g. `April 1, 1976`)
  - Year-only: `YYYY` (e.g. `1548`, `1945`)
- Each date is mapped to an internal representation:
  - `year`: Numeric year integer
  - `month`: 1–12 (or null if year-only)
  - `day`: 1–31 (or null if month/year-only)
  - `canonical`: Standardized string format for direct equality evaluation
- Specialized rule: If one source specifies `YYYY` and another specifies `DD Month YYYY`, and the year numbers match, the relationship is classified as consistent with a precision difference rather than a mismatch.

### 2.3 Named Entity & Titular Normalization
- Honorifics and peerage titles (e.g. `Duke of`, `Countess of`, `Earl of`, `Sir`, `Lord`, `King`) are recognized as title prefixes.
- For person comparisons, the core surname and given names are compared both verbatim and stripped of regional titles.
- For geographical entities, containment relationships (e.g. `Wilmslow, Cheshire, England` vs `Wilmslow, England`) are verified through token hierarchy.

---

## 3. The 5-Layer Engine Architecture

```
Structured Fact ──> [Layer 1: Verbatim Exact] ──(Match)──> MATCH
                         │ (No match)
                         ▼
                    [Layer 2: Semantic Containment] ──(Match)──> MATCH
                         │ (No match)
                         ▼
                    [Layer 3: Named Entity] ──(Match)──> MATCH
                         │ (No match)
                         ▼
                    [Layer 4: Chronological Date] ──(Match/Diff)──> MATCH / POSSIBLE_MISMATCH
                         │ (No candidate / ambiguous)
                         ▼
                    [Layer 5: Evidence Confidence] ──> Confidence Breakdown (0–100)
```

---

## 4. Evidence Confidence Scoring Matrix

Every candidate finding receives a confidence score calculated as:

$$\text{Confidence} = \text{Exactness} + \text{EntityMatch} + \text{NormConfidence} + \text{SemanticSim} - \text{ConflictPenalty}$$

| Component | Maximum Points | Description |
|---|---|---|
| **Exactness** | 30 pts | Verbatim string match between extracted value and structured claim |
| **Entity Match** | 25 pts | Alignment with expected category (e.g. valid date for date fields) |
| **Normalization** | 20 pts | Certainty of canonical format conversion |
| **Semantic Similarity** | 25 pts | Token overlap and sentence predicate alignment |
| **Conflict Penalty** | -25 pts | Subtracted when competing sentences assert differing values |

---

## 5. Responsible AI Guarantees

1. **Language Invariant**: The system never outputs terms like "False", "Fake", "Debunked", or "Error".
2. **Primary Conclusion**: Discrepancies are universally styled as `"Possible mismatch detected."`.
3. **Tripartite Evidence Separation**:
   - **Source Data**: The verbatim value from the infobox.
   - **Textual Evidence**: The verbatim sentence and offset from the prose.
   - **Model Interpretation**: The algorithmic or AI reconciliation hypothesis.
4. **Mandatory Human Verification**: All reports and evidence bridges feature persistent notices informing reviewers that differences require human domain expertise.
