#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { evaluateFreshness, type FactVersion, type PredictionCase } from "./index.js";

const valueAfter = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const timelinePath = valueAfter("--timeline");
const predictionsPath = valueAfter("--predictions");
if (!timelinePath || !predictionsPath) {
  console.error("Usage: memory-freshness --timeline timeline.json --predictions predictions.json");
  process.exit(2);
}

const [timeline, predictions] = await Promise.all([
  readFile(timelinePath, "utf8").then((value) => JSON.parse(value) as FactVersion[]),
  readFile(predictionsPath, "utf8").then((value) => JSON.parse(value) as PredictionCase[]),
]);
console.log(JSON.stringify(evaluateFreshness(timeline, predictions), null, 2));
