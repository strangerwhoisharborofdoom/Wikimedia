import fs from 'fs';
import path from 'path';
import {
  RawWikimediaArticle,
  InfoboxPart,
  StructuredFact,
  ArticleOverview,
  ArticleSection
} from '../../types/index.js';
import {
  normalizeDate,
  cleanText,
  classifyFieldCategory
} from '../normalization/normalizer.js';
import { WIKIMEDIA_DATASET } from '../../../src/data/wikimediaDataset.js';

export class WikimediaDatasetAdapter {
  private articles: Map<string, RawWikimediaArticle> = new Map();
  private dataFilePath: string;

  constructor(filePath?: string) {
    this.dataFilePath = filePath || path.join(process.cwd(), 'data', 'wikimedia_structured_dataset.json');
    this.loadDataset();
  }

  public loadDataset(): void {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const content = fs.readFileSync(this.dataFilePath, 'utf-8');
        const rawArticles: RawWikimediaArticle[] = JSON.parse(content);
        this.articles.clear();
        for (const art of rawArticles) {
          this.articles.set(String(art.identifier), art);
          this.articles.set(art.name.toLowerCase(), art);
        }
        console.log(`[WikimediaDatasetAdapter] Loaded ${rawArticles.length} authentic articles from ${this.dataFilePath}`);
      } else {
        console.warn(`[WikimediaDatasetAdapter] Dataset file not found at ${this.dataFilePath}, falling back to bundled dataset`);
        this.articles.clear();
        for (const art of WIKIMEDIA_DATASET) {
          this.articles.set(String(art.identifier), art);
          this.articles.set(art.name.toLowerCase(), art);
        }
        console.log(`[WikimediaDatasetAdapter] Loaded ${WIKIMEDIA_DATASET.length} bundled authentic articles`);
      }
    } catch (err) {
      console.error('[WikimediaDatasetAdapter] Error loading dataset, using bundled dataset:', err);
      this.articles.clear();
      for (const art of WIKIMEDIA_DATASET) {
        this.articles.set(String(art.identifier), art);
        this.articles.set(art.name.toLowerCase(), art);
      }
    }
  }

  public getRawArticleList(): RawWikimediaArticle[] {
    // Return unique articles by identifier
    const seen = new Set<string>();
    const list: RawWikimediaArticle[] = [];
    for (const [key, art] of this.articles.entries()) {
      const idStr = String(art.identifier);
      if (!seen.has(idStr)) {
        seen.add(idStr);
        list.push(art);
      }
    }
    return list;
  }

  public getArticleById(idOrName: string): RawWikimediaArticle | null {
    const direct = this.articles.get(idOrName);
    if (direct) return direct;
    const lower = idOrName.toLowerCase();
    const byName = this.articles.get(lower);
    if (byName) return byName;
    return null;
  }

  /**
   * Search articles with case-insensitivity, substring matching, and category filtering
   */
  public searchArticles(query: string): Array<{
    identifier: string;
    name: string;
    url: string;
    abstract: string;
    categoryCount: number;
    factCount: number;
  }> {
    const q = query.trim().toLowerCase();
    const articles = this.getRawArticleList();

    if (!q) {
      return articles.map(art => ({
        identifier: String(art.identifier),
        name: art.name,
        url: art.url,
        abstract: art.abstract || '',
        categoryCount: art.categories?.length || 0,
        factCount: this.extractStructuredFacts(art).length
      }));
    }

    const filtered = articles.filter(art => {
      const nameMatch = art.name.toLowerCase().includes(q);
      const abstractMatch = art.abstract?.toLowerCase().includes(q);
      const catMatch = art.categories?.some(c => c.name.toLowerCase().includes(q));
      return nameMatch || abstractMatch || catMatch;
    });

    // Sort by name relevance
    filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (aName === q) return -1;
      if (bName === q) return 1;
      if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
      if (bName.startsWith(q) && !aName.startsWith(q)) return 1;
      return aName.localeCompare(bName);
    });

    return filtered.map(art => ({
      identifier: String(art.identifier),
      name: art.name,
      url: art.url,
      abstract: art.abstract || '',
      categoryCount: art.categories?.length || 0,
      factCount: this.extractStructuredFacts(art).length
    }));
  }

  /**
   * Recursively extract structured facts from the raw infoboxes tree
   */
  public extractStructuredFacts(article: RawWikimediaArticle): StructuredFact[] {
    const facts: StructuredFact[] = [];
    let counter = 1;

    const traverse = (part: InfoboxPart, currentPath: string) => {
      const pathStr = currentPath ? `${currentPath} > ${part.name}` : part.name;

      if (part.type === 'field' && part.value) {
        const val = String(part.value).trim();
        if (val) {
          const cat = classifyFieldCategory(part.name);
          let norm = cleanText(val);
          if (cat === 'date') {
            const dateObj = normalizeDate(val);
            if (dateObj) norm = dateObj.canonical;
          }

          const label = part.name
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());

          facts.push({
            id: `fact-${article.identifier}-${counter++}`,
            field: part.name,
            label,
            originalValue: val,
            normalizedValue: norm,
            category: cat,
            rawPath: pathStr
          });
        }
      }

      if (part.type === 'list' && part.values && part.values.length > 0) {
        for (const val of part.values) {
          const v = String(val).trim();
          if (v) {
            const cat = classifyFieldCategory(part.name);
            facts.push({
              id: `fact-${article.identifier}-${counter++}`,
              field: part.name,
              label: part.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              originalValue: v,
              normalizedValue: cleanText(v),
              category: cat,
              rawPath: pathStr
            });
          }
        }
      }

      if (part.has_parts && Array.isArray(part.has_parts)) {
        for (const sub of part.has_parts) {
          traverse(sub, pathStr);
        }
      }
    };

    if (article.infoboxes && Array.isArray(article.infoboxes)) {
      for (const box of article.infoboxes) {
        traverse(box, '');
      }
    }

    return facts;
  }

  /**
   * Get formatted ArticleOverview for client presentation
   */
  public getArticleOverview(idOrName: string): ArticleOverview | null {
    const art = this.getArticleById(idOrName);
    if (!art) return null;

    // Build full text from sections
    const textPieces: string[] = [];
    if (art.abstract) textPieces.push(art.abstract);

    if (art.article_sections && Array.isArray(art.article_sections)) {
      for (const sec of art.article_sections) {
        if (sec.has_parts && Array.isArray(sec.has_parts)) {
          for (const p of sec.has_parts) {
            if (p.value) textPieces.push(p.value);
          }
        }
      }
    }

    const fullText = textPieces.join('\n\n');
    const structuredFacts = this.extractStructuredFacts(art);

    return {
      identifier: String(art.identifier),
      name: art.name,
      url: art.url,
      abstract: art.abstract || '',
      date_modified: art.date_modified || '',
      categories: art.categories || [],
      fullText,
      structuredFacts,
      sections: art.article_sections || []
    };
  }

  /**
   * Ingest a custom raw Wikimedia Enterprise article or dataset update
   */
  public ingestArticle(article: RawWikimediaArticle): void {
    this.articles.set(String(article.identifier), article);
    this.articles.set(article.name.toLowerCase(), article);
  }
}
