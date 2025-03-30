import { z } from "zod";
import {
  toArraySchema,
  toBlobRefSchema,
  toBooleanSchema,
  toBytesSchema,
  toCidLinkSchema,
  toNullSchema,
  toNumberSchema,
  toObjectSchema,
  toProcedureSchemaMap,
  toQuerySchemaMap,
  toRecordSchemaMap,
  toRefSchema,
  toStringSchema,
  toSubscriptionSchemaMap,
  toUnionSchema,
  toUnknownSchema,
} from "./parsers";
import { LexiconToZodOptions, TypeParserMap } from "./types";
import { getTypeParserSafe, setPathOptionToIsRequired } from "./utils";

// Merge with `LexiconToZodOptions.typeParserDict`.
const defaultTypeParserMap: TypeParserMap = {
  $default: () => z.any(),
  string: toStringSchema,
  integer: toNumberSchema,
  boolean: toBooleanSchema,
  blob: toBlobRefSchema,
  array: toArraySchema,
  object: toObjectSchema,
  union: toUnionSchema,
  ref: toRefSchema,
  null: toNullSchema,
  bytes: toBytesSchema,
  unknown: toUnknownSchema,
  "cid-link": toCidLinkSchema,
};

const primaryTypeParserMap = {
  record: toRecordSchemaMap,
  subscription: toSubscriptionSchemaMap,
  query: toQuerySchemaMap,
  procedure: toProcedureSchemaMap,
};

/**
 * Infer a map of Zod schemas from a Lexicon `refs` dictionary.
 * @param lexicon Lexicon JSON definition
 * @returns UniversalSchema map
 */
export function lexiconToZod(
  lexicon: Record<string, any>,
  options: LexiconToZodOptions = {}
) {
  const schemaMap: Record<string, any> = { defs: {} };
  const typeParserDict = Object.assign(
    {},
    defaultTypeParserMap,
    options.typeParserDict || {}
  );

  options.typeParserDict = typeParserDict;

  for (const [defKey, defValue] of <[[string, Record<string, any>]]>(
    Object.entries(lexicon.defs)
  )) {
    const defOverride = options.pathOptions?.[defKey]?.override;

    // Omit def if override is null.
    if (defOverride === null) continue;

    if (defOverride) {
      schemaMap.defs[defKey] = defOverride;
      continue;
    }

    setPathOptionToIsRequired(defKey, options);

    // Note: this is the only place we handle primary types.
    const parser =
      primaryTypeParserMap[
        defValue.type as keyof typeof primaryTypeParserMap
      ] || getTypeParserSafe(options, "object", true);

    schemaMap.defs[defKey] = parser(defValue, defKey, options);
  }

  return schemaMap;
}

/**
 * Convenience factory method; returns a map of all built-in primary and non-primary type parsers.
 * @returns Map of built-in parsers
 */
export function parsers() {
  return {
    record: toRecordSchemaMap,
    query: toQuerySchemaMap,
    procedure: toProcedureSchemaMap,
    subscription: toSubscriptionSchemaMap,
    string: toStringSchema,
    integer: toNumberSchema,
    boolean: toBooleanSchema,
    blob: toBlobRefSchema,
    array: toArraySchema,
    object: toObjectSchema,
    union: toUnionSchema,
    ref: toRefSchema,
    null: toNullSchema,
    bytes: toBytesSchema,
    unknown: toUnknownSchema,
    "cid-link": toCidLinkSchema,
  };
}
