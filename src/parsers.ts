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
} from "./utils";
import {
  LexiconToZodOptions,
  PathOptions,
  TypeParserMap,
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
 * @param TypeParserMap LexiconTypeParser map
 * @param options LexiconToZodOptions
 * @returns UniversalSchema
 */
export function defToSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  TypeParserMap: TypeParserMap,
  options?: LexiconToZodOptions
): UniversalSchema {
  const { type: lexiconType } = lexiconPartial;
  const parser = TypeParserMap[lexiconType] || TypeParserMap.$default;

  return parser(lexiconPartial, lexiconPropPath, TypeParserMap, options);
}

export function toRecordSchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  TypeParserMap: TypeParserMap,
  options?: LexiconToZodOptions
) {
  return {
    key: z.literal(lexiconPartial.key),
    record: TypeParserMap.object(
      lexiconPartial.record,
      toObjectPath(lexiconPropPath, "record"),
      TypeParserMap,
      options
    ),
  };
}

export function toQuerySchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  TypeParserMap: TypeParserMap,
  options?: LexiconToZodOptions
) {
  return {
    parameters: !lexiconPartial.parameters
      ? z.never()
      : TypeParserMap.object(
          lexiconPartial.parameters,
          toObjectPath(lexiconPropPath, "parameters"),
          TypeParserMap,
          options
        ),
    output: {
      encoding: !lexiconPartial.output
        ? z.never()
        : z.literal(lexiconPartial.output.encoding),
      schema: !lexiconPartial.output?.schema
        ? z.never()
        : defToSchema(
            lexiconPartial.output.schema,
            toObjectPath(lexiconPropPath, "ouput.schema"),
            TypeParserMap,
            options
          ).describe(lexiconPartial.output.description || ""),
    },
  };
}

export function toProcedureSchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  TypeParserMap: TypeParserMap,
  options?: LexiconToZodOptions
) {
  return {
    parameters: !lexiconPartial.parameters
      ? z.never()
      : TypeParserMap.object(
          lexiconPartial.parameters,
          toObjectPath(lexiconPropPath, "parameters"),
          TypeParserMap,
          options
        ),
    output: {
      encoding: !lexiconPartial.output
        ? z.never()
        : z.literal(lexiconPartial.output.encoding),
      schema: !lexiconPartial.output?.schema
        ? z.never()
        : defToSchema(
            lexiconPartial.output.schema,
            toObjectPath(lexiconPropPath, "output.schema"),
            TypeParserMap,
            options
          ).describe(lexiconPartial.output.description || ""),
    },
    input: {
      encoding: !lexiconPartial.input
        ? z.never()
        : z.literal(lexiconPartial.input.encoding),
      schema: !lexiconPartial.input?.schema
        ? z.never()
        : defToSchema(
            lexiconPartial.input.schema,
            toObjectPath(lexiconPropPath, "input.schema"),
            TypeParserMap,
            options
          ).describe(lexiconPartial.input.description || ""),
    },
  };
}

export function toSubscriptionSchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  TypeParserMap: TypeParserMap,
  options?: LexiconToZodOptions
) {
  return {
    parameters: !lexiconPartial.parameters
      ? z.never()
      : TypeParserMap.object(
          lexiconPartial.parameters,
          toObjectPath(lexiconPropPath, "parameters"),
          TypeParserMap,
          options
        ),
    message: {
      schema: !lexiconPartial.message?.schema
        ? z.never()
        : TypeParserMap.union(
            lexiconPartial.message.schema,
            toObjectPath(lexiconPropPath, "message.schema"),
            TypeParserMap,
            options
          ),
    },
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
  TypeParserMap: TypeParserMap,
  options?: LexiconToZodOptions
): ZodSchema {
  const elementPath = toArrayPath(lexiconPropPath);
  const elementSchema = extendSchema(
    lexiconPartial.items,
    defToSchema(lexiconPartial.items, elementPath, TypeParserMap, options),
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
  TypeParserMap: TypeParserMap,
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
          TypeParserMap,
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
  TypeParserMap: TypeParserMap,
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
          TypeParserMap.ref(
            { type: "ref", ref },
            subtypePath,
            TypeParserMap,
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
  TypeParserMap: TypeParserMap,
  options: LexiconToZodOptions = {}
) {
  if (options.followRefs !== true) return z.any();

  const lexiconDefs: Record<string, any> | undefined =
    options?.lexiconDict?.[refValueToNSID(lexiconPartial.ref)]?.defs;

  if (!lexiconDefs) throw new Error("Cannot infer reference Lexicon");

  const defKey = refValueToDefKey(lexiconPartial.ref);

  // Making the assumption that lexiconDefs['main'] will not be a primary type.
  return defToSchema(
    lexiconDefs[defKey],
    lexiconPropPath,
    TypeParserMap,
    options
  );
}
