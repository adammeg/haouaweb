/** Provider-neutral JSON Schema; opt in only for a model supporting json_schema. */
export function clinicalOutputFormat(chunkIds: string[]): Record<string, unknown> {
  const string = { type: "string" };
  const strings = { type: "array", items: string };
  const object = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
  const citations = { type: "array", items: object({ chunkId: chunkIds.length ? { type: "string", enum: chunkIds } : { type: "string" } }), ...(chunkIds.length ? {} : { maxItems: 0 }) };
  return { type: "json_schema", json_schema: { name: "clinical_analysis", strict: true, schema: object({
    schemaVersion: { type: "string", enum: ["clinical-analysis-v1"] }, summary: strings,
    hypotheses: { type: "array", items: object({ label: string, confidence: { type: "string", enum: ["strongly_supported", "plausible", "must_exclude", "insufficient_information"] }, supportingFacts: strings, limitingFacts: strings, citations }) },
    redFlags: { type: "array", items: object({ label: string, urgency: { type: "string", enum: ["none", "routine", "rapid", "immediate"] }, rationale: string, citations }) },
    missingInformation: strings, suggestedInvestigations: strings, followUp: strings, citations, limitations: strings,
  }) } };
}
