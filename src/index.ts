import { z } from "zod";
import {
  defToSchema,
  toArraySchema,
  toBlobRefSchema,
  toBooleanSchema,
  toNumberSchema,
  toObjectSchema,
  toRefSchema,
  toStringSchema,
  toUnionSchema,
} from "./parsers";
import { LexiconToZodOptions, LexiconTypeParserMap } from "./types";
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
    lexiconTypeParserMap: LexiconTypeParserMap,
    options?: LexiconToZodOptions
  ) =>
    parser(lexiconPartial, lexiconPropPath, options);

// Merge with `LexiconToZodOptions.typeParserDict` to produce block scoped `typeParserMap`.
const defaultTypeParserMap: LexiconTypeParserMap = {
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
export default function lexiconToZod(
  lexicon: Record<string, any>,
  options: LexiconToZodOptions = {}
) {
  const defSchemaMap: Record<string, any> = { defs: {} };
  const mergedTypeParserMap = Object.assign(
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

    /**
     * Gather possible props for various primary Lexicon types.
     * Note: This is the only place we process primary types or related properties.
     */
    if (defKey === "main") {
      const attachMainProp = (
        key: string,
        partial: Record<string, any>,
        options: LexiconToZodOptions
      ) => {
        const path = `main.${key}`;
        setPathOptionToIsRequired(path, options);
        defSchemaMap.defs.main[key] = defToSchema(
          partial,
          path,
          mergedTypeParserMap,
          options
        );
      };

      defSchemaMap.defs.main = {};

      if (defValue.input)
        attachMainProp("input", defValue.input.schema, options);

      if (defValue.output)
        attachMainProp("output", defValue.output.schema, options);

      if (defValue.message)
        attachMainProp("message", defValue.message.schema, options);

      if (defValue.record) attachMainProp("record", defValue.record, options);

      if (defValue.parameters)
        attachMainProp("parameters", defValue.parameters, options);
    } else {
      defSchemaMap.defs[defKey] = defToSchema(
        defValue,
        defKey,
        mergedTypeParserMap,
        options
      );
    }
  }

  return defSchemaMap;
}
