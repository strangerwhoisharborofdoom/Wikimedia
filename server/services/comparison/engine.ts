import {
  StructuredFact,
  ComparisonResult,
  ComparisonStatus,
  TextEvidenceCandidate,
  RawWikimediaArticle
} from '../../types/index.js';
import {
  normalizeDate,
  cleanText,
  normalizePersonName,
  normalizeOrgName,
  splitIntoSentences,
  NormalizedDate
} from '../normalization/normalizer.js';
import { analyzeNuancedEvidenceWithGemini } from '../gemini/analyzer.js';

export class ComparisonEngine {
  /**
   * Run the 5-layer comparison engine for all structured facts in an article
   */
  public async compareArticleFacts(
    article: RawWikimediaArticle,
    facts: StructuredFact[],
    useAI = true
  ): Promise<ComparisonResult[]> {
    const results: ComparisonResult[] = [];

    // Gather full text and list of all sentences with section context
    const indexedSentences: Array<{ sentence: string; sectionName: string; index: number }> = [];

    if (article.abstract) {
      const absSentences = splitIntoSentences(article.abstract);
      absSentences.forEach((s, idx) => {
        indexedSentences.push({ sentence: s, sectionName: 'Lead / Abstract', index: idx });
      });
    }

    if (article.article_sections && Array.isArray(article.article_sections)) {
      for (const sec of article.article_sections) {
        if (sec.has_parts && Array.isArray(sec.has_parts)) {
          for (const p of sec.has_parts) {
            if (p.value) {
              const sList = splitIntoSentences(p.value);
              sList.forEach((s, idx) => {
                indexedSentences.push({ sentence: s, sectionName: sec.name || 'Body', index: idx });
              });
            }
          }
        }
      }
    }

    return await Promise.all(
      facts.map(fact => this.compareSingleFact(article, fact, indexedSentences, useAI))
    );
  }

  /**
   * Compare a single structured fact against article text using 5 layers
   */
  public async compareSingleFact(
    article: RawWikimediaArticle,
    fact: StructuredFact,
    indexedSentences: Array<{ sentence: string; sectionName: string; index: number }>,
    useAI = true
  ): Promise<ComparisonResult> {
    const fieldLower = fact.field.toLowerCase();
    const origVal = fact.originalValue;
    const normVal = fact.normalizedValue;

    // Search for candidate sentences in the article text
    const candidates = this.findCandidateSentences(fact, indexedSentences);

    // If no candidate sentences found by deterministic heuristic, try Gemini if permitted
    let aiDistinction: ComparisonResult['aiDistinction'] = undefined;
    let aiAssisted = false;

    if (candidates.length === 0 && useAI) {
      const topPassages = indexedSentences.slice(0, 10).map(s => s.sentence).join(' ');
      const aiResult = await analyzeNuancedEvidenceWithGemini(
        fact.label,
        origVal,
        article.abstract || '',
        topPassages
      );

      if (aiResult && aiResult.hasEvidence && aiResult.textualSentence) {
        candidates.push({
          sentence: aiResult.textualSentence,
          extractedValue: aiResult.extractedValue || origVal,
          normalizedValue: cleanText(aiResult.extractedValue || origVal),
          location: {
            startChar: 0,
            endChar: aiResult.textualSentence.length,
            sectionName: 'Contextual AI Discovery'
          },
          confidence: aiResult.confidenceScore || 80,
          matchType: aiResult.isMismatch ? 'normalized' : 'exact'
        });

        aiAssisted = true;
        aiDistinction = {
          sourceData: `Structured Infobox: [${fact.label}] = "${origVal}"`,
          textualEvidence: `Article Statement: "${aiResult.textualSentence}"`,
          modelInterpretation: aiResult.modelInterpretation || aiResult.explanation
        };
      }
    }

    // Determine Status, Scores, and Explanations
    if (candidates.length === 0) {
      return {
        factId: fact.id,
        articleId: String(article.identifier),
        articleTitle: article.name,
        field: fact.field,
        label: fact.label,
        category: fact.category,
        status: 'NO_TEXTUAL_EVIDENCE',
        conclusionText: 'Information unavailable in the provided dataset.',
        structuredValue: origVal,
        textualValue: null,
        normalizedStructuredValue: normVal,
        normalizedTextualValue: null,
        evidence: null,
        allCandidates: [],
        evidenceConfidence: 0,
        confidenceBreakdown: {
          exactness: 0,
          entityMatch: 0,
          normalizationConfidence: 0,
          semanticSimilarity: 0,
          conflictPenalty: 0
        },
        comparisonMethod: 'Heuristic text scanning + syntactic extraction',
        whyFlagged: `No statements matching field "${fact.label}" were identified in the article text passages.`,
        interpretation: 'The article text does not explicitly restate or reference this structured infobox field.',
        requiredAction: 'Human verification to confirm if this detail is missing or documented in unparsed sections.',
        aiAssisted: false,
        timestamp: new Date().toISOString()
      };
    }

    // Evaluate best candidate
    const primaryCandidate = candidates[0];

    // Check for truly conflicting high-confidence candidates
    const hasConflictingCandidates = candidates.length > 1 && candidates.some(c =>
      c.normalizedValue !== primaryCandidate.normalizedValue &&
      c.confidence >= 85 &&
      (primaryCandidate.confidence - c.confidence) <= 8
    );

    // Layer 1 & 4 Specialized comparison
    const comparisonEval = this.evaluateCandidateMatch(fact, primaryCandidate);

    let status: ComparisonStatus = 'MATCH';
    let conclusionText = 'Consistent with article text.';
    let whyFlagged = `The structured field value "${origVal}" matches the statement found in the article text.`;
    let interpretation = 'The values are consistent after canonical normalization.';

    if (!comparisonEval.isMatch) {
      status = 'POSSIBLE_MISMATCH';
      conclusionText = 'Possible mismatch detected.';
      whyFlagged = `The structured field contains "${origVal}", while the article text contains "${primaryCandidate.extractedValue}".`;
      interpretation = comparisonEval.explanation || 'The values differ after canonical normalization. Human review is recommended to assess chronological or contextual nuance.';
    } else if (hasConflictingCandidates) {
      status = 'REVIEW_REQUIRED';
      conclusionText = 'Ambiguous or conflicting textual evidence.';
      whyFlagged = `Multiple differing statements regarding "${fact.label}" were found in the article text.`;
      interpretation = `Found "${primaryCandidate.extractedValue}" alongside alternative references in other sections.`;
    }

    // Layer 5: Evidence Confidence Calculation
    const confidenceScores = this.calculateConfidence(fact, primaryCandidate, comparisonEval.isMatch, hasConflictingCandidates);

    return {
      factId: fact.id,
      articleId: String(article.identifier),
      articleTitle: article.name,
      field: fact.field,
      label: fact.label,
      category: fact.category,
      status,
      conclusionText,
      structuredValue: origVal,
      textualValue: primaryCandidate.extractedValue,
      normalizedStructuredValue: normVal,
      normalizedTextualValue: primaryCandidate.normalizedValue,
      evidence: primaryCandidate,
      allCandidates: candidates,
      evidenceConfidence: confidenceScores.total,
      confidenceBreakdown: confidenceScores.breakdown,
      comparisonMethod: comparisonEval.method,
      whyFlagged,
      interpretation,
      requiredAction: 'Human verification',
      aiAssisted,
      aiDistinction,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Search for sentences in article that correspond to a fact
   */
  private findCandidateSentences(
    fact: StructuredFact,
    sentences: Array<{ sentence: string; sectionName: string; index: number }>
  ): TextEvidenceCandidate[] {
    const candidates: TextEvidenceCandidate[] = [];
    const cat = fact.category;
    const fieldTokens = fact.field.toLowerCase().split('_');
    const labelTokens = fact.label.toLowerCase().split(' ');

    const allKeywords = Array.from(new Set([...fieldTokens, ...labelTokens]))
      .filter(w => w.length > 2 && !['date', 'name', 'field', 'title', 'part'].includes(w));

    // For dates
    const factDate = normalizeDate(fact.originalValue);

    for (const item of sentences) {
      const s = item.sentence;
      const sLower = s.toLowerCase();

      // Check for exact value match in sentence
      if (sLower.includes(fact.originalValue.toLowerCase())) {
        candidates.push({
          sentence: s,
          extractedValue: fact.originalValue,
          normalizedValue: fact.normalizedValue,
          location: {
            startChar: sLower.indexOf(fact.originalValue.toLowerCase()),
            endChar: sLower.indexOf(fact.originalValue.toLowerCase()) + fact.originalValue.length,
            sectionName: item.sectionName
          },
          confidence: 95,
          matchType: 'exact'
        });
        continue;
      }

      // If category is Date
      if (cat === 'date') {
        const fieldKey = fact.field.toLowerCase();
        // Determine specific predicate keyword
        let specificKeywords: string[] = [];
        if (fieldKey.includes('birth') || fieldKey.includes('born')) specificKeywords = ['born', 'birth'];
        else if (fieldKey.includes('death') || fieldKey.includes('died')) specificKeywords = ['died', 'death', 'killed'];
        else if (fieldKey.includes('creation') || fieldKey.includes('created')) specificKeywords = ['created', 'creation'];
        else if (fieldKey.includes('founded') || fieldKey.includes('established')) specificKeywords = ['founded', 'established', 'founding'];
        else if (fieldKey.includes('launch')) specificKeywords = ['launched', 'launch'];
        else if (fieldKey.includes('landing')) specificKeywords = ['landed', 'landing'];
        else if (fieldKey.includes('nobel') || fieldKey.includes('award') || fieldKey.includes('prize')) specificKeywords = ['awarded', 'nobel', 'prize', 'received'];
        else specificKeywords = allKeywords;

        const hasSpecificKeyword = specificKeywords.some(k => sLower.includes(k));
        const hasGeneralKeyword = allKeywords.some(k => sLower.includes(k));

        if (hasSpecificKeyword || hasGeneralKeyword) {
          // Extract year or date phrase from sentence
          const yearRegex = /\b(1[4-9]\d{2}|20\d{2})\b/g;
          let match;
          while ((match = yearRegex.exec(s)) !== null) {
            const extractedYear = match[1];
            const localStart = Math.max(0, match.index - 25);
            const localEnd = Math.min(s.length, match.index + 30);
            const snippet = s.slice(localStart, localEnd);
            const fullSnippetDate = normalizeDate(snippet);

            const chosenVal = fullSnippetDate && !fullSnippetDate.isYearOnly
              ? fullSnippetDate.canonical
              : extractedYear;

            // Score higher if sentence has the specific predicate keyword
            let score = 70;
            if (hasSpecificKeyword) score = 92;
            else if (hasGeneralKeyword) score = 75;

            candidates.push({
              sentence: s,
              extractedValue: chosenVal,
              normalizedValue: fullSnippetDate ? fullSnippetDate.canonical : extractedYear,
              location: {
                startChar: match.index,
                endChar: match.index + extractedYear.length,
                sectionName: item.sectionName
              },
              confidence: score,
              matchType: factDate && factDate.canonical === chosenVal ? 'exact' : 'normalized'
            });
          }
        }
      }

      // If category is Person
      if (cat === 'person') {
        const normPerson = normalizePersonName(fact.originalValue);
        const tokens = normPerson.split(' ').filter(t => t.length > 2);
        const matchesToken = tokens.filter(t => sLower.includes(t));
        if (matchesToken.length >= Math.min(tokens.length, 2)) {
          candidates.push({
            sentence: s,
            extractedValue: fact.originalValue,
            normalizedValue: normPerson,
            location: {
              startChar: 0,
              endChar: s.length,
              sectionName: item.sectionName
            },
            confidence: 85,
            matchType: 'semantic'
          });
        }
      }

      // If category is Location
      if (cat === 'location') {
        const locParts = fact.originalValue.split(',').map(p => p.trim().toLowerCase());
        const matchedParts = locParts.filter(p => sLower.includes(p));
        if (matchedParts.length > 0) {
          candidates.push({
            sentence: s,
            extractedValue: matchedParts.join(', '),
            normalizedValue: cleanText(matchedParts.join(', ')),
            location: {
              startChar: 0,
              endChar: s.length,
              sectionName: item.sectionName
            },
            confidence: 80,
            matchType: 'partial'
          });
        }
      }

      // General keyword-based fallback
      if (candidates.length === 0 && allKeywords.length > 0) {
        const matched = allKeywords.filter(k => sLower.includes(k));
        if (matched.length === allKeywords.length) {
          candidates.push({
            sentence: s,
            extractedValue: s,
            normalizedValue: cleanText(s),
            location: {
              startChar: 0,
              endChar: s.length,
              sectionName: item.sectionName
            },
            confidence: 65,
            matchType: 'partial'
          });
        }
      }
    }

    // Sort candidates by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates;
  }

  /**
   * Evaluate whether a candidate statement matches the structured fact
   */
  private evaluateCandidateMatch(
    fact: StructuredFact,
    candidate: TextEvidenceCandidate
  ): { isMatch: boolean; method: string; explanation?: string } {
    const origFact = fact.originalValue;
    const candVal = candidate.extractedValue;

    // Layer 1: Exact string comparison (case-insensitive)
    if (origFact.trim().toLowerCase() === candVal.trim().toLowerCase()) {
      return {
        isMatch: true,
        method: 'Layer 1: Exact verbatim normalized comparison'
      };
    }

    // Layer 4: Specialized Date Comparison
    if (fact.category === 'date') {
      const d1 = normalizeDate(origFact);
      const d2 = normalizeDate(candVal);

      if (d1 && d2) {
        // If year mismatch (e.g. 1548 vs 1549)
        if (d1.year && d2.year && d1.year !== d2.year) {
          return {
            isMatch: false,
            method: 'Layer 4: Specialized chronological date normalization',
            explanation: `Year mismatch: structured infobox states year ${d1.year}, but article text states year ${d2.year}.`
          };
        }

        // Full date comparison
        if (!d1.isYearOnly && !d2.isYearOnly) {
          if (d1.canonical === d2.canonical) {
            return {
              isMatch: true,
              method: 'Layer 4: Canonical date normalization'
            };
          } else {
            return {
              isMatch: false,
              method: 'Layer 4: Canonical date normalization',
              explanation: `Calendar date variance: structured infobox states "${d1.canonical}", whereas article text states "${d2.canonical}".`
            };
          }
        }

        // One is year only, one is full date
        if (d1.year === d2.year) {
          return {
            isMatch: true,
            method: 'Layer 4: Year-level chronological agreement'
          };
        }
      }
    }

    // Layer 3: Person name matching
    if (fact.category === 'person') {
      const p1 = normalizePersonName(origFact);
      const p2 = normalizePersonName(candVal);
      if (p1 === p2 || p1.includes(p2) || p2.includes(p1)) {
        return {
          isMatch: true,
          method: 'Layer 3: Named entity person normalization'
        };
      }
    }

    // Layer 3: Location containment matching
    if (fact.category === 'location') {
      const l1 = cleanText(origFact).toLowerCase();
      const l2 = cleanText(candVal).toLowerCase();
      if (l1.includes(l2) || l2.includes(l1)) {
        return {
          isMatch: true,
          method: 'Layer 3: Geographic hierarchy & containment comparison'
        };
      }
    }

    // Layer 2: Normalized text containment
    const t1 = cleanText(origFact).toLowerCase();
    const t2 = cleanText(candVal).toLowerCase();
    if (t1.includes(t2) || t2.includes(t1)) {
      return {
        isMatch: true,
        method: 'Layer 2: Semantic substring containment'
      };
    }

    return {
      isMatch: false,
      method: 'Multi-layer composite comparison',
      explanation: `Observed discrepancy between structured value ("${origFact}") and textual candidate ("${candVal}").`
    };
  }

  /**
   * Layer 5: Explainable Evidence Confidence calculation
   */
  private calculateConfidence(
    fact: StructuredFact,
    candidate: TextEvidenceCandidate,
    isMatch: boolean,
    hasConflict: boolean
  ): {
    total: number;
    breakdown: ComparisonResult['confidenceBreakdown'];
  } {
    let exactness = candidate.matchType === 'exact' ? 30 : candidate.matchType === 'normalized' ? 25 : 18;
    let entityMatch = fact.category !== 'general' ? 25 : 20;
    let normalizationConfidence = 20;
    let semanticSimilarity = isMatch ? 25 : 15;
    let conflictPenalty = hasConflict ? 25 : 0;

    const rawTotal = exactness + entityMatch + normalizationConfidence + semanticSimilarity - conflictPenalty;
    const total = Math.min(99, Math.max(15, rawTotal));

    return {
      total,
      breakdown: {
        exactness,
        entityMatch,
        normalizationConfidence,
        semanticSimilarity,
        conflictPenalty
      }
    };
  }
}
