/**
 * Normalization layer for WikiFact Lens.
 * Provides deterministic, explainable normalizations for dates, entities, names,
 * and textual representations without destroying semantic nuances.
 */

const MONTHS: { [key: string]: number } = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface NormalizedDate {
  year?: number;
  month?: number;
  day?: number;
  canonical: string;
  isYearOnly: boolean;
}

export function normalizeDate(input: string): NormalizedDate | null {
  if (!input) return null;
  const clean = input
    .replace(/\[\d+\]/g, '') // remove citation markers like [1]
    .replace(/\(.*?\)/g, '') // remove parentheses
    .replace(/[,\.]/g, ' ')
    .trim();

  // Pattern 1: ISO YYYY-MM-DD
  const isoMatch = clean.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        year,
        month,
        day,
        canonical: `${day} ${MONTH_NAMES[month]} ${year}`,
        isYearOnly: false
      };
    }
  }

  // Pattern 2: Day Month Year (e.g. 10 December 1815 or 10 Dec 1815)
  const dmyMatch = clean.match(/\b(\d{1,2})\s+([a-zA-Z]+)\s+(\d{3,4})\b/i);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const mStr = dmyMatch[2].toLowerCase();
    const year = parseInt(dmyMatch[3], 10);
    const month = MONTHS[mStr];
    if (month && day >= 1 && day <= 31) {
      return {
        year,
        month,
        day,
        canonical: `${day} ${MONTH_NAMES[month]} ${year}`,
        isYearOnly: false
      };
    }
  }

  // Pattern 3: Month Day Year (e.g. December 10 1815 or April 1 1976)
  const mdyMatch = clean.match(/\b([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{3,4})\b/i);
  if (mdyMatch) {
    const mStr = mdyMatch[1].toLowerCase();
    const day = parseInt(mdyMatch[2], 10);
    const year = parseInt(mdyMatch[3], 10);
    const month = MONTHS[mStr];
    if (month && day >= 1 && day <= 31) {
      return {
        year,
        month,
        day,
        canonical: `${day} ${MONTH_NAMES[month]} ${year}`,
        isYearOnly: false
      };
    }
  }

  // Pattern 4: Month Year (e.g. December 1815)
  const myMatch = clean.match(/\b([a-zA-Z]+)\s+(\d{3,4})\b/i);
  if (myMatch) {
    const mStr = myMatch[1].toLowerCase();
    const year = parseInt(myMatch[2], 10);
    const month = MONTHS[mStr];
    if (month) {
      return {
        year,
        month,
        canonical: `${MONTH_NAMES[month]} ${year}`,
        isYearOnly: false
      };
    }
  }

  // Pattern 5: Year only (e.g. 1548 or 1976)
  const yearMatch = clean.match(/\b(\d{3,4})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year >= 100 && year <= 2100) {
      return {
        year,
        canonical: `${year}`,
        isYearOnly: true
      };
    }
  }

  return null;
}

export function cleanText(input: string): string {
  if (!input) return '';
  return input
    .replace(/\[\d+\]/g, '') // remove footnotes
    .replace(/\s+/g, ' ') // collapse whitespaces
    .replace(/["'“”‘’]/g, '') // remove quote types
    .trim();
}

export function normalizePersonName(name: string): string {
  return cleanText(name)
    .toLowerCase()
    .replace(/\b(sir|lord|lady|baron|baroness|count|countess|earl|duke|duchess|dr|king|queen|prince|princess|mr|mrs|ms)\b/g, '')
    .replace(/\b(\d+(?:st|nd|rd|th)?\s+earl\s+of\s+[a-z]+)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeOrgName(name: string): string {
  return cleanText(name)
    .toLowerCase()
    .replace(/\b(inc|incorporated|corp|corporation|llc|ltd|limited|company|co)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  // Clean citations first
  const sanitized = text.replace(/\[\d+\]/g, '');
  // Match sentences, keeping punctuation
  const matches = sanitized.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  if (!matches) return [sanitized.trim()];
  return matches
    .map(s => s.trim())
    .filter(s => s.length > 5);
}

export function classifyFieldCategory(fieldName: string): 'date' | 'person' | 'location' | 'organization' | 'number' | 'general' {
  const f = fieldName.toLowerCase();
  if (f.includes('date') || f.includes('year') || f.includes('born') || f.includes('died') || f.includes('founded') || f.includes('launch') || f.includes('creation') || f.includes('landing')) {
    return 'date';
  }
  if (f.includes('founder') || f.includes('holder') || f.includes('author') || f.includes('person') || f.includes('spouse') || f.includes('father') || f.includes('mother') || f.includes('commander') || f.includes('pilot') || f.includes('monarch') || f.includes('ceo')) {
    return 'person';
  }
  if (f.includes('place') || f.includes('location') || f.includes('city') || f.includes('country') || f.includes('headquarters') || f.includes('site')) {
    return 'location';
  }
  if (f.includes('org') || f.includes('operator') || f.includes('company') || f.includes('contractor') || f.includes('owner') || f.includes('institution') || f.includes('alma_mater')) {
    return 'organization';
  }
  if (f.includes('count') || f.includes('number') || f.includes('revenue') || f.includes('population')) {
    return 'number';
  }
  return 'general';
}
