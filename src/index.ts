export type FactVersion = {
  id: string;
  key: string;
  value: unknown;
  validFrom: string;
  validTo?: string;
  source?: string;
};

export type PredictionCase = {
  id: string;
  observedAt: string;
  returnedFactIds: string[];
};

export type CaseResult = {
  id: string;
  expectedFactIds: string[];
  returnedFactIds: string[];
  staleFactIds: string[];
  unknownFactIds: string[];
  missingFactIds: string[];
  precision: number;
  recall: number;
  provenanceCoverage: number;
};

export type FreshnessReport = {
  cases: CaseResult[];
  summary: {
    cases: number;
    freshnessPrecision: number;
    freshnessRecall: number;
    staleLeakRate: number;
    unknownFactRate: number;
    provenanceCoverage: number;
  };
};

const timestamp = (value: string): number => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`Invalid timestamp: ${value}`);
  return parsed;
};

export function activeFactsAt(timeline: FactVersion[], observedAt: string): FactVersion[] {
  const at = timestamp(observedAt);
  const active = timeline.filter((fact) => {
    const starts = timestamp(fact.validFrom) <= at;
    const ends = fact.validTo === undefined || at < timestamp(fact.validTo);
    return starts && ends;
  });

  const byKey = new Map<string, FactVersion>();
  for (const fact of active.sort((a, b) => timestamp(a.validFrom) - timestamp(b.validFrom))) {
    byKey.set(fact.key, fact);
  }
  return [...byKey.values()];
}

// Quality scores (precision, recall, coverage) are vacuously perfect when there
// is nothing to score, so an empty denominator means 1.
const ratio = (numerator: number, denominator: number): number =>
  denominator === 0 ? 1 : numerator / denominator;

// Leak scores invert that: nothing returned means nothing leaked, so an empty
// denominator means 0. Using `ratio` here would report a 100% leak rate.
const leakRate = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : numerator / denominator;

export function evaluateCase(timeline: FactVersion[], prediction: PredictionCase): CaseResult {
  const allById = new Map(timeline.map((fact) => [fact.id, fact]));
  const expected = activeFactsAt(timeline, prediction.observedAt);
  const expectedIds = new Set(expected.map((fact) => fact.id));
  const returned = [...new Set(prediction.returnedFactIds)];
  const correct = returned.filter((id) => expectedIds.has(id));
  const staleFactIds = returned.filter((id) => allById.has(id) && !expectedIds.has(id));
  const unknownFactIds = returned.filter((id) => !allById.has(id));
  const missingFactIds = [...expectedIds].filter((id) => !returned.includes(id));
  const withProvenance = returned.filter((id) => Boolean(allById.get(id)?.source));

  return {
    id: prediction.id,
    expectedFactIds: [...expectedIds],
    returnedFactIds: returned,
    staleFactIds,
    unknownFactIds,
    missingFactIds,
    precision: ratio(correct.length, returned.length),
    recall: ratio(correct.length, expectedIds.size),
    provenanceCoverage: ratio(withProvenance.length, returned.length),
  };
}

export function evaluateFreshness(timeline: FactVersion[], predictions: PredictionCase[]): FreshnessReport {
  const cases = predictions.map((prediction) => evaluateCase(timeline, prediction));
  const returnedCount = cases.reduce((sum, item) => sum + item.returnedFactIds.length, 0);
  const average = (selector: (result: CaseResult) => number): number =>
    ratio(cases.reduce((sum, item) => sum + selector(item), 0), cases.length);

  return {
    cases,
    summary: {
      cases: cases.length,
      freshnessPrecision: average((item) => item.precision),
      freshnessRecall: average((item) => item.recall),
      staleLeakRate: leakRate(cases.reduce((sum, item) => sum + item.staleFactIds.length, 0), returnedCount),
      unknownFactRate: leakRate(cases.reduce((sum, item) => sum + item.unknownFactIds.length, 0), returnedCount),
      provenanceCoverage: average((item) => item.provenanceCoverage),
    },
  };
}
