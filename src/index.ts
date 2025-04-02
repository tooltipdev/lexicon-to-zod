import {
  toArraySchema as toArraySchemaParser,
  toBlobRefSchema as toBlobRefSchemaParser,
  toBooleanSchema as toBooleanSchemaParser,
  toBytesSchema as toBytesSchemaParser,
  toCidLinkSchema as toCidLinkSchemaParser,
  toNullSchema as toNullSchemaParser,
  toNumberSchema as toNumberSchemaParser,
  toObjectSchema as toObjectSchemaParser,
  toProcedureSchemaMap as toProcedureSchemaMapParser,
  toQuerySchemaMap as toQuerySchemaMapParser,
  toRecordSchemaMap as toRecordSchemaMapParser,
  toRefSchema as toRefSchemaParser,
  toStringSchema as toStringSchemaParser,
  toSubscriptionSchemaMap as toSubscriptionSchemaMapParser,
  toUnionSchema as toUnionSchemaParser,
  toUnknownSchema as toUnknownSchemaParser,
} from "./parsers";

import {
  LexiconToZodOptions,
  TypeParserMap,
  UniversalSchema,
} from "./types";
import { getTypeParserSafe } from "./utils";
import { z } from "zod";

/**
 * Export individual type parsers for convenience.
 */

export const toArraySchema = toArraySchemaParser;
export const toBlobRefSchema = toBlobRefSchemaParser;
export const toBooleanSchema = toBooleanSchemaParser;
export const toBytesSchema = toBytesSchemaParser;
export const toCidLinkSchema = toCidLinkSchemaParser;
export const toNullSchema = toNullSchemaParser;
export const toNumberSchema = toNumberSchemaParser;
export const toObjectSchema = toObjectSchemaParser;
export const toProcedureSchemaMap = toProcedureSchemaMapParser;
export const toQuerySchemaMap = toQuerySchemaMapParser;
export const toRecordSchemaMap = toRecordSchemaMapParser;
export const toRefSchema = toRefSchemaParser;
export const toStringSchema = toStringSchemaParser;
export const toSubscriptionSchemaMap = toSubscriptionSchemaMapParser;
export const toUnionSchema = toUnionSchemaParser;
export const toUnknownSchema = toUnknownSchemaParser;

// Default TypeParserMap for internal use; merged with typeParserDict input.
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

// Map of primary type parsers for internal use.
const primaryTypeParserMap = {
  record: toRecordSchemaMap,
  subscription: toSubscriptionSchemaMap,
  query: toQuerySchemaMap,
  procedure: toProcedureSchemaMap,
};

/**
 * Convert a Lexicon document into a Zod schema map.
 * @param lexicon Lexicon document
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
 * Return map of all built-in type parsers.
 * Each type parser is modified to match the interface of `lexiconToZod`.
 * @returns built-in parser map
 */
export function parsers() {
  return Object.entries({
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
  }).reduce(
    (acc, [type, typeParser]) => {
      acc[type] = (
        lexiconPartial: Record<string, any>,
        options: LexiconToZodOptions = {}
      ) => {
        options.typeParserDict = Object.assign(
          {},
          defaultTypeParserMap,
          options.typeParserDict || {}
        );

        return typeParser(lexiconPartial, "", options) as UniversalSchema;
      };

      return acc;
    },
    {} as Record<
      string,
      (
        lexiconPartial: Record<string, any>,
        options?: LexiconToZodOptions
      ) => UniversalSchema | Record<string, any>
    >
  );
}
