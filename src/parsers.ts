/**
 * @TODO add cid-link support
 * @TODO add bytes support
 * @TODO add null support
 * @TODO add support for type properties (min, max, etc)
 */

import { z, ZodOptional, ZodSchema } from "zod";
import {
  zodSchemaWrapperMixin,
  toArrayPath,
  toObjectPath,
  toUnionPath,
  refValueToNSID,
  refValueToDefKey,
  setPathOptionToIsRequired,
} from "./utils";
import {
  LexiconToZodOptions,
  LexiconTypeParserMap,
  PathOptions,
  UniversalSchema,
} from "./types";

/**
 * Apply Lexicon metadata to a UniversalSchema.
 * @param lexiconPartial Lexicon JSON partial
 * @param lexiconPartialSchema Parsed Lexicon Zod schema
 * @param pathOptions pathOptions entry value
 * @returns UniversalSchema
 */
export function extendSchema(
  lexiconPartial: Record<string, any>,
  lexiconPartialSchema: UniversalSchema,
  pathOptions?: PathOptions
): UniversalSchema {
  if (lexiconPartial.description)
    lexiconPartialSchema = lexiconPartialSchema.describe(
      lexiconPartial.description
    );

  if (lexiconPartial.default)
    lexiconPartialSchema = lexiconPartialSchema.default(lexiconPartial.default);

  if (pathOptions?.isRequired !== true)
    lexiconPartialSchema = lexiconPartialSchema.optional();

  if (pathOptions?.metadata)
    lexiconPartialSchema = zodSchemaWrapperMixin(
      lexiconPartialSchema,
      pathOptions.metadata
    );

  return lexiconPartialSchema;
}

/**
 * Parse a non-primary Lexicon structure to a UniversalSchema.
 * @param lexiconPartial Lexicon JSON partial
 * @param lexiconPropPath Lexicon property path
 * @param lexiconTypeParserMap LexiconTypeParser map
 * @param options LexiconToZodOptions
 * @returns UniversalSchema
 */
export function defToSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  lexiconTypeParserMap: LexiconTypeParserMap,
  options?: LexiconToZodOptions
): UniversalSchema {
  const { type: lexiconType } = lexiconPartial;
  const parser =
    lexiconTypeParserMap[lexiconType] || lexiconTypeParserMap.$default;

  return parser(lexiconPartial, lexiconPropPath, lexiconTypeParserMap, options);
}

/**
 * Parse a primary Lexicon partial to a map of UniversalSchema instances.
 * The shape of the output schema will depend on the primary type.
 * @param lexiconPartial Lexicon JSON partial
 * @param lexiconPropPath Lexicon property path
 * @param lexiconTypeParserMap LexiconTypeParser map
 * @param options LexiconToZodOptions
 * @returns UniversalSchema
 */
// export function primaryDefToSchema(
//   lexiconPartial: Record<string, any>,
//   lexiconPropPath: string,
//   lexiconTypeParserMap: LexiconTypeParserMap,
//   options?: LexiconToZodOptions
// ) {
//   const attachMainProp = (
//     key: string,
//     partial: Record<string, any>,
//     options: LexiconToZodOptions
//   ) => {
//     const schemaMap: Record<string, UniversalSchema> = {};
//     const path = `main.${key}`;
//     setPathOptionToIsRequired(path, options);

//     // This is hacky.
//     if (!!partial.properties)
//       schemaMap[key] = toObjectSchema(
//         partial,
//         path,
//         lexiconTypeParserMap,
//         options
//       );
//     else
//       schemaMap[key] = defToSchema(
//         partial,
//         path,
//         lexiconTypeParserMap,
//         options
//       );
//   };

//   defSchemaMap.defs.main = {};

//   if (defValue?.input?.schema)
//     attachMainProp("input", defValue.input.schema, options);

//   if (defValue.output && defValue.output.schema)
//     attachMainProp("output", defValue.output.schema, options);

//   if (defValue.message && defValue.message.schema)
//     attachMainProp("message", defValue.message.schema, options);

//   if (defValue.record) attachMainProp("record", defValue.record, options);

//   if (defValue.parameters)
//     attachMainProp("parameters", defValue.parameters, options);

//   if (!Object.keys(defSchemaMap.defs.main).length)
//     defSchemaMap.defs.main = z.never();
// }

export function toRecordSchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  lexiconTypeParserMap: LexiconTypeParserMap,
  options?: LexiconToZodOptions
) {
  return {
    key: z.literal(lexiconPartial.key),
    record: lexiconTypeParserMap.object(
      lexiconPartial,
      toObjectPath(lexiconPropPath, "record"),
      lexiconTypeParserMap,
      options
    ),
  };
}

export function toQuerySchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  lexiconTypeParserMap: LexiconTypeParserMap,
  options?: LexiconToZodOptions
) {
  return {
    parameters: lexiconTypeParserMap.object(
      lexiconPartial.parameters,
      toObjectPath(lexiconPropPath, "parameters"),
      lexiconTypeParserMap,
      options
    ),
    output: !lexiconPartial.output?.schema
      ? z.never()
      : z.object({
        description: z.string().optional(),
      })
  };
}

export function toStringSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  options?: LexiconToZodOptions
) {
  return extendSchema(
    lexiconPartial,
    z.string(),
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toNumberSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  options?: LexiconToZodOptions
) {
  return extendSchema(
    lexiconPartial,
    // @TODO make coercion an option
    z.coerce.number(),
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toBooleanSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  options?: LexiconToZodOptions
) {
  return extendSchema(
    lexiconPartial,
    z.boolean(),
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toBlobRefSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  options?: LexiconToZodOptions
) {
  return extendSchema(
    lexiconPartial,
    z.object({
      $type: zodSchemaWrapperMixin(z.string().default("blob"), {
        readOnly: true,
      }),
      mimeType: z.string(),
      size: z.coerce.number(),
      ref: z.object({
        $link: z.string().describe("blob ref derived from uploadBlob"),
      }),
    }),
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toArraySchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  lexiconTypeParserMap: LexiconTypeParserMap,
  options?: LexiconToZodOptions
): ZodSchema {
  const elementPath = toArrayPath(lexiconPropPath);
  const elementSchema = extendSchema(
    lexiconPartial.items,
    defToSchema(
      lexiconPartial.items,
      elementPath,
      lexiconTypeParserMap,
      options
    ),
    options?.pathOptions?.[elementPath]
  );

  return extendSchema(
    lexiconPartial,
    z.array(elementSchema),
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toObjectSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  lexiconTypeParserMap: LexiconTypeParserMap,
  options?: LexiconToZodOptions
) {
  const propSchemaMap: Record<string, any> = {};

  Object.entries(lexiconPartial.properties).forEach(
    ([propKey, propPartial]) => {
      const propPath = toObjectPath(lexiconPropPath, propKey);
      const propOverride: UniversalSchema | null | undefined =
        options?.pathOptions?.[propPath]?.override;

      // Omit property if override is null.
      if (propOverride === null) return;

      if (propOverride) {
        propSchemaMap[propKey] = propOverride;
        return;
      }

      if (
        // Set path option 'isRequired' to true if Lexicon JSON dictates the field is required.
        lexiconPartial.required?.includes(propKey) &&
        // Don't override explicit false value if provided.
        options?.pathOptions?.[propPath]?.isRequired !== false
      ) {
        options = options || {};
        options.pathOptions = options.pathOptions || {};
        options.pathOptions[propPath] = options.pathOptions[propPath] || {};
        options.pathOptions[propPath].isRequired = true;
      }

      propSchemaMap[propKey] = extendSchema(
        propPartial as Record<string, any>,
        defToSchema(
          propPartial as Record<string, any>,
          propPath,
          lexiconTypeParserMap,
          options
        ),
        options?.pathOptions?.[propPath]
      );
    }
  );

  return extendSchema(
    lexiconPartial,
    z.object({
      ...propSchemaMap,
      // Attach additional schema properties that may not exist in Lexicon JSON.
      ...(options?.pathOptions?.[lexiconPropPath]?.additionalProps || {}),
    }),
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toUnionSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  lexiconTypeParserMap: LexiconTypeParserMap,
  options?: LexiconToZodOptions
) {
  const subtypeSet = lexiconPartial.refs.reduce(
    (
      acc: Array<ZodSchema | ZodOptional<ZodSchema>>,
      ref: string,
      i: number
    ) => {
      const subtypePath = toUnionPath(lexiconPropPath, i);
      const subtypeOverride: UniversalSchema | null | undefined =
        options?.pathOptions?.[subtypePath]?.override;

      // Omit subtype from union if override is null.
      if (subtypeOverride === null) return acc;

      acc.push(
        subtypeOverride ||
          lexiconTypeParserMap.ref(
            { type: "ref", ref },
            subtypePath,
            lexiconTypeParserMap,
            options
          )
      );

      return acc;
    },
    []
  );

  return extendSchema(
    lexiconPartial,
    z.union(subtypeSet),
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toRefSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  lexiconTypeParserMap: LexiconTypeParserMap,
  options: LexiconToZodOptions = {}
) {
  const lexiconDefs: Record<string, any> | undefined =
    options?.lexiconDict?.[refValueToNSID(lexiconPartial.ref)]?.defs;

  if (!lexiconDefs) throw new Error("Cannot infer reference Lexicon");

  const defKey = refValueToDefKey(lexiconPartial.ref);

  // Making the assumption that lexiconDefs['main'] will not be a primary type.
  return defToSchema(
    lexiconDefs[defKey],
    lexiconPropPath,
    lexiconTypeParserMap,
    options
  );
}
