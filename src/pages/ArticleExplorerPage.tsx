import React, { useState, useEffect } from 'react';
import { ArticleOverview, ComparisonResult } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { apiClient } from '../services/apiClient.js';
import {
  Search,
  ExternalLink,
  Tag,
  Calendar,
  Layers,
  ChevronRight,
  Database,
  BookOpen,
  Scale,
  Sparkles,
  FileCheck,
  ArrowLeft
} from 'lucide-react';

interface ArticleExplorerPageProps {
  selectedArticleId: string | null;
  onSelectArticle: (id: string) => void;
  onSelectFactForComparison: (articleId: string, factId: string) => void;
  onGenerateReport: (articleId: string) => void;
}

export const ArticleExplorerPage: React.FC<ArticleExplorerPageProps> = ({
  selectedArticleId,
  onSelectArticle,
  onSelectFactForComparison,
  onGenerateReport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [article, setArticle] = useState<ArticleOverview | null>(null);
  const [articleComparisons, setArticleComparisons] = useState<ComparisonResult[]>([]);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [comparingAll, setComparingAll] = useState(false);
  const [activeView, setActiveView] = useState<'facts' | 'text' | 'schema'>('facts');
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'detail'>(selectedArticleId ? 'detail' : 'list');

  // Search articles
  useEffect(() => {
    let isCancelled = false;
    apiClient.searchArticles(searchQuery)
      .then(list => {
        if (!isCancelled) setSearchResults(list);
      })
      .catch(err => console.error('Search failed:', err));
    return () => { isCancelled = true; };
  }, [searchQuery]);

  // Load article details when selectedArticleId changes
  useEffect(() => {
    if (!selectedArticleId) {
      setMobileViewMode('list');
      return;
    }
    setMobileViewMode('detail');
    let isCancelled = false;

    setLoadingArticle(true);
    apiClient.getArticleOverview(selectedArticleId)
      .then(data => {
        if (!isCancelled) {
          setArticle(data);
          setLoadingArticle(false);
        }
      })
      .catch(err => {
        console.error('Failed to load article:', err);
        if (!isCancelled) setLoadingArticle(false);
      });

    // Also fetch cached or fresh comparisons
    apiClient.compareArticle(selectedArticleId, false)
      .then(data => {
        if (!isCancelled && data.results) {
          setArticleComparisons(data.results);
        }
      })
      .catch(err => console.error('Failed to fetch comparisons:', err));

    return () => { isCancelled = true; };
  }, [selectedArticleId]);

  const handleCompareAll = async () => {
    if (!selectedArticleId) return;
    setComparingAll(true);
    try {
      const data = await apiClient.compareArticle(selectedArticleId, true);
      if (data.results) {
        setArticleComparisons(data.results);
      }
    } catch (err) {
      console.error('Failed to compare all facts:', err);
    } finally {
      setComparingAll(false);
    }
  };

  const sampleArticles = [
    { id: '874312', name: 'Duke of Châtellerault' },
    { id: '1284', name: 'Ada Lovelace' },
    { id: '8203', name: 'Alan Turing' },
    { id: '18564', name: 'Alexander Fleming' },
    { id: '19167', name: 'Marie Curie' },
    { id: '856', name: 'Apple Inc.' }
  ];

  return (
    <div id="article-explorer-view" className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Header & Search Bar */}
      <div className="space-y-3 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Wikimedia Article Explorer
          </h1>
          <p className="text-xs md:text-sm text-stone-600 mt-0.5">
            Select a benchmark article from the dataset repository to inspect its structured infoboxes, prose sections, and comparison state.
          </p>
        </div>

        {/* Search input with quick sample chips */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="article-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by article title, keyword, or identifier..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-stone-400 font-medium mr-1">Examples:</span>
            {sampleArticles.map(sample => (
              <button
                key={sample.id}
                onClick={() => {
                  onSelectArticle(sample.id);
                  setSearchQuery('');
                  setMobileViewMode('detail');
                }}
                className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                  selectedArticleId === sample.id
                    ? 'bg-stone-900 text-white border-stone-900 font-medium'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Directory list + Article Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search Results / Article List */}
        <div className={`lg:col-span-4 space-y-3 ${mobileViewMode === 'detail' && selectedArticleId ? 'hidden lg:block' : 'block'}`}>
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center justify-between">
            <span>Articles ({searchResults.length})</span>
            <span className="text-[10px] font-mono text-stone-400">Wikimedia Dataset</span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100 shadow-2xs max-h-[700px] overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                No articles matching &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              searchResults.map(art => {
                const isSelected = selectedArticleId === art.identifier;
                return (
                  <button
                    key={art.identifier}
                    onClick={() => {
                      onSelectArticle(art.identifier);
                      setMobileViewMode('detail');
                    }}
                    className={`w-full p-3.5 text-left transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-stone-900 text-white'
                        : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="text-xs font-bold truncate">
                        {art.name}
                      </div>
                      <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-stone-300' : 'text-stone-500'
                      }`}>
                        {art.abstract}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {art.factCount} facts
                        </span>
                        <span className={`text-[10px] ${
                          isSelected ? 'text-stone-400' : 'text-stone-400'
                        }`}>
                          ID: {art.identifier}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isSelected ? 'text-stone-300' : 'text-stone-400'
                    }`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Article Content */}
        <div className={`lg:col-span-8 space-y-4 ${mobileViewMode === 'list' && selectedArticleId ? 'hidden lg:block' : 'block'}`}>
          {/* Mobile Back Button */}
          {selectedArticleId && (
            <button
              onClick={() => setMobileViewMode('list')}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 rounded-lg border border-stone-300 shadow-2xs mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Article List</span>
            </button>
          )}

          {!selectedArticleId ? (
            <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3">
              <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="text-sm font-serif font-bold text-stone-800">
                Select an Article to Inspect
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Choose an article from the directory on the left or click an example above to explore its structured infoboxes and text.
              </p>
            </div>
          ) : loadingArticle || !article ? (
            <div className="p-8 bg-white border border-stone-200 rounded-xl animate-pulse space-y-4">
              <div className="h-6 bg-stone-200 rounded w-1/3" />
              <div className="h-4 bg-stone-200 rounded w-full" />
              <div className="h-32 bg-stone-200 rounded" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Article Header Card */}
              <div className="p-4 sm:p-5 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono mb-1">
                      <span>Article ID: {article.identifier}</span>
                      <span>•</span>
                      <span>Wikimedia Structured Dataset</span>
                    </div>
                    <h2 className="text-xl font-serif font-bold text-stone-900">
                      {article.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Wikipedia</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => onGenerateReport(article.identifier)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Audit Report</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200/80">
                  <strong className="text-stone-900 font-semibold">Abstract: </strong>
                  {article.abstract}
                </p>

                {/* Categories */}
                {article.categories && article.categories.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <Tag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    {article.categories.map((cat, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* View Switcher Tabs & Compare All Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setActiveView('facts')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                      activeView === 'facts'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 bg-stone-100'
                    }`}
                  >
                    Structured Facts ({article.structuredFacts.length})
                  </button>
                  <button
                    onClick={() => setActiveView('text')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                      activeView === 'text'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 bg-stone-100'
                    }`}
                  >
                    Prose Sections ({article.sections.length})
                  </button>
                  <button
                    onClick={() => setActiveView('schema')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                      activeView === 'schema'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 bg-stone-100'
                    }`}
                  >
                    Raw Schema (JSON)
                  </button>
                </div>

                {activeView === 'facts' && (
                  <button
                    onClick={handleCompareAll}
                    disabled={comparingAll}
                    className="px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-stone-300 disabled:opacity-50 self-start sm:self-auto shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{comparingAll ? 'Analyzing...' : 'Re-run Comparison'}</span>
                  </button>
                )}
              </div>

              {/* Tab View 1: Structured Infobox Facts */}
              {activeView === 'facts' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {article.structuredFacts.map((fact) => {
                      const comp = articleComparisons.find(c => c.factId === fact.id);
                      return (
                        <div
                          key={fact.id}
                          className="p-4 bg-white border border-stone-200 hover:border-stone-300 rounded-xl shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-stone-900">
                                {fact.label}
                              </span>
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                                {fact.category}
                              </span>
                              {comp && <StatusBadge status={comp.status} size="sm" />}
                            </div>

                            <div className="text-xs font-mono text-stone-800 bg-stone-50 px-2.5 py-1 rounded border border-stone-200 inline-block max-w-full truncate">
                              Value: <strong>{fact.originalValue}</strong>
                            </div>

                            {comp && comp.evidence && (
                              <div className="text-[11px] text-stone-500 line-clamp-1 italic">
                                Evidence in text: &ldquo;{comp.evidence.sentence}&rdquo;
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => onSelectFactForComparison(article.identifier, fact.id)}
                              className="px-3 py-1.5 text-xs font-medium text-stone-900 bg-stone-100 hover:bg-stone-900 hover:text-white rounded-lg transition-all border border-stone-300 inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>Inspect Evidence Bridge</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab View 2: Prose Sections */}
              {activeView === 'text' && (
                <div className="space-y-3">
                  {article.sections && article.sections.length > 0 ? (
                    article.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-2.5"
                      >
                        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono flex items-center justify-between border-b border-stone-100 pb-1.5">
                          <span>Section: {sec.name}</span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            {sec.has_parts?.length || 0} part(s)
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {sec.has_parts && sec.has_parts.length > 0 ? (
                            sec.has_parts.map((p, pIdx) => (
                              <p key={pIdx} className="text-xs text-stone-800 leading-relaxed">
                                {p.value}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs text-stone-400 italic">No paragraphs in this section.</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-stone-400 bg-white border border-stone-200 rounded-xl">
                      No prose sections available for this article.
                    </div>
                  )}
                </div>
              )}

              {/* Tab View 3: Raw Schema */}
              {activeView === 'schema' && (
                <div className="p-4 bg-stone-900 text-stone-100 rounded-xl overflow-x-auto max-h-[500px]">
                  <pre className="text-xs font-mono leading-relaxed">
                    {JSON.stringify(article, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
