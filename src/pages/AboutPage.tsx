import React from 'react';
import {
  ShieldAlert,
  Scale,
  Database,
  Layers,
  Sparkles,
  UserCheck,
  BookOpen,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div id="about-methodology-view" className="p-3.5 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Hero / Overview */}
      <div className="space-y-3 pb-4 border-b border-stone-200">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stone-100 text-stone-700 border border-stone-200">
          <Scale className="w-3 h-3 text-stone-600" />
          Evidence-Review System Architecture
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
          About WikiFact Lens
        </h1>
        <p className="text-xs md:text-sm text-stone-600 leading-relaxed max-w-3xl">
          WikiFact Lens is an advanced evidence-comparison research tool designed to identify potential inconsistencies between structured metadata (such as infobox key-values) and unstructured prose in Wikipedia articles.
        </p>
      </div>

      {/* Core Philosophy & Responsible AI */}
      <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-300 space-y-3">
        <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
          <span>Core Directive: Evidence Review, Not Truth Determination</span>
        </div>
        <p className="text-xs text-amber-900/90 leading-relaxed">
          WikiFact Lens <strong>never claims that a fact is false merely because two values differ</strong>.
          The exact conclusion phrase rendered by the system is strictly:
          <span className="inline-block mx-1.5 font-bold font-mono px-2 py-0.5 rounded bg-amber-200/80 text-amber-950 border border-amber-400">
            &ldquo;Possible mismatch detected.&rdquo;
          </span>
          The application operates under the fundamental premise that an algorithmic discrepancy between an infobox entry and body text could stem from differing historical calendar standards (e.g. Julian vs Gregorian), differing reference sources, incomplete prose updates, or editorial consensus nuances. Human verification is strictly required.
        </p>
      </div>

      {/* Dataset Architecture */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-stone-600" />
          The Wikimedia Structured Dataset Schema
        </h2>
        <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-3 text-xs text-stone-700 leading-relaxed">
          <p>
            WikiFact Lens parses authentic dumps structured according to the <strong>Wikimedia Enterprise Structured Contents format</strong>.
            Unlike raw wikitext, structured contents model Wikipedia articles as hierarchical trees of parts:
          </p>
          <ul className="space-y-2 list-disc list-inside text-stone-600 pl-1">
            <li>
              <strong>Infobox Trees:</strong> Nested part trees with <code className="font-mono text-stone-800 bg-stone-100 px-1 py-0.5 rounded">type: &quot;infobox&quot;</code> and <code className="font-mono text-stone-800 bg-stone-100 px-1 py-0.5 rounded">type: &quot;field&quot;</code>, extracting structured key-values and handling lists.
            </li>
            <li>
              <strong>Article Sections:</strong> Explicit section arrays with typed paragraphs, avoiding wikitext regex artifacts and preserving sentence boundaries.
            </li>
            <li>
              <strong>Abstract & Metadata:</strong> Standardized article identifiers, stable Wikipedia URLs, last-modified ISO dates, and categorized taxonomies.
            </li>
          </ul>
        </div>
      </div>

      {/* 5-Layer Comparison Pipeline */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-stone-600" />
          5-Layer Verification Engine
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-1.5">
            <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-mono text-[10px]">1</span>
              Layer 1: Exact Verbatim Normalization
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Strips wikitext citations <code className="font-mono">[1]</code>, removes formatting tags, harmonizes whitespace, and performs canonical case-insensitive matching.
            </p>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-1.5">
            <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-mono text-[10px]">2</span>
              Layer 2: Semantic Substring Containment
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Detects token containment and multi-word phrase overlaps, ensuring minor editorial prose variations are recognized.
            </p>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-1.5">
            <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-mono text-[10px]">3</span>
              Layer 3: Named Entity Classification
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Normalizes Person names (stripping peerage titles, honorifics, prefixes) and geographical locations (matching city-to-country hierarchical inclusion).
            </p>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-1.5">
            <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-mono text-[10px]">4</span>
              Layer 4: Specialized Chronological Normalization
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Parses ISO 8601, European DMY, and American MDY formats, isolating individual day, month, and year components to identify genuine numeric shifts.
            </p>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-1.5 md:col-span-2">
            <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-mono text-[10px]">5</span>
              Layer 5: Evidence Confidence Scoring (0-100)
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Computes a weighted confidence metric based on verbatim exactness (+30 pts), entity category alignment (+25 pts), normalization certainty (+20 pts), and semantic similarity (+25 pts), penalized by conflicting candidate statements (-25 pts).
            </p>
          </div>
        </div>
      </div>

      {/* Tripartite AI Grounding */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Tripartite Evidence Representation
        </h2>
        <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-3 text-xs text-stone-700 leading-relaxed">
          <p>
            When optional Gemini AI-assisted analysis is utilized for subtle semantic reconciliation, the system enforces a strict 3-part separation:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">1. Source Data</div>
              <div className="text-stone-500 text-[11px]">Directly taken from the structured infobox field without AI alterations.</div>
            </div>
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">2. Textual Evidence</div>
              <div className="text-stone-500 text-[11px]">The verbatim sentence and span location extracted from the prose body.</div>
            </div>
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">3. Model Interpretation</div>
              <div className="text-stone-500 text-[11px]">The analytical hypothesis explaining the variance for human review.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Human Review Decisions */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-stone-600" />
          Human Verification Taxonomy
        </h2>
        <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-2 text-xs text-stone-700">
          <p className="leading-relaxed mb-3">
            Reviewers may assign one of four objective verification determinations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40">
              <div className="font-bold text-emerald-950">Confirmed Match</div>
              <div className="text-[11px] text-emerald-800 mt-0.5">Human confirms both items refer to the same fact.</div>
            </div>
            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40">
              <div className="font-bold text-amber-950">Needs Human Review</div>
              <div className="text-[11px] text-amber-800 mt-0.5">Genuine ambiguity or source conflict requiring subject-matter research.</div>
            </div>
            <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
              <div className="font-bold text-stone-900">Not Comparable</div>
              <div className="text-[11px] text-stone-600 mt-0.5">Field and sentence speak of different contexts, scopes, or time periods.</div>
            </div>
            <div className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/40">
              <div className="font-bold text-purple-950">False Positive</div>
              <div className="text-[11px] text-purple-800 mt-0.5">Algorithmic syntactic misidentification.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
