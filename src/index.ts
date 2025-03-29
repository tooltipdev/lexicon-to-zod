import { z } from "zod";
import {
  defToSchema,
  toArraySchema,
  toBlobRefSchema,
  toBooleanSchema,
  toNumberSchema,
  toObjectSchema,
  toProcedureSchemaMap,
  toQuerySchemaMap,
  toRecordSchemaMap,
  toRefSchema,
  toStringSchema,
  toSubscriptionSchemaMap,
  toUnionSchema,
} from "./parsers";
import {
  LexiconToZodOptions,
  PrimaryTypeParserMap,
  PrimaryTypeSchema,
  TypeParserMap,
} from "./types";
import { setPathOptionToIsRequired } from "./utils";

/**
 * Curry LexiconTypeParser which utilizes simplified LexiconTypeParser.
 * @param parser simplified LexiconTypeParser
 * @returns LexiconTypeParser
 */
const toLexiconTypeParser =
  (parser: Function) =>
  (
    lexiconPartial: Record<string, any>,
    lexiconPropPath: string,
    TypeParserMap: TypeParserMap,
    options?: LexiconToZodOptions
  ) =>
    parser(lexiconPartial, lexiconPropPath, options);

const primaryTypeParserMap: PrimaryTypeParserMap = {
  record: toRecordSchemaMap,
  subscription: toSubscriptionSchemaMap,
  query: toQuerySchemaMap,
  procedure: toProcedureSchemaMap,
};

// Merge with `LexiconToZodOptions.typeParserDict` to produce block scoped `typeParserMap`.
const defaultTypeParserMap: TypeParserMap = {
  $default: () => z.any(),
  string: toLexiconTypeParser(toStringSchema),
  integer: toLexiconTypeParser(toNumberSchema),
  boolean: toLexiconTypeParser(toBooleanSchema),
  blob: toLexiconTypeParser(toBlobRefSchema),
  array: toArraySchema,
  object: toObjectSchema,
  union: toUnionSchema,
  ref: toRefSchema,
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
  const typeParserMap = Object.assign(
    {},
    defaultTypeParserMap,
    options.typeParserDict || {}
  );

  for (const [defKey, defValue] of <[[string, any]]>(
    Object.entries(lexicon.defs)
  )) {
    const defOverride = options.pathOptions?.[defKey]?.override;

    // Omit def if its root pathOptions path is set to `null`.
    if (defOverride === null) continue;

    setPathOptionToIsRequired(defKey, options);

    if (defOverride) {
      schemaMap.defs[defKey] = defOverride;
    }

    const { success: isPrimaryType } = PrimaryTypeSchema.safeParse(
      defValue.type
    );

    const parser = isPrimaryType
      ? primaryTypeParserMap[defValue.type as keyof PrimaryTypeParserMap]
      : typeParserMap.object;

    schemaMap.defs[defKey] = parser(defValue, defKey, typeParserMap, options);
  }

  return schemaMap;
}

export const parsers = {
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
};
