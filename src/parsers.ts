/**
 * @TODO add support for coerce to primitives
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
  getTypeParserSafe,
  setPathOptionToIsRequired,
} from "./utils";
import { LexiconToZodOptions, PathOptions, UniversalSchema } from "./types";

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
 * @param options LexiconToZodOptions
 * @returns UniversalSchema
 */
export function defToSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
): UniversalSchema {
  return getTypeParserSafe(options, lexiconPartial.type)(
    lexiconPartial,
    lexiconPropPath,
    options
  );
}

export function toRecordSchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return {
    key: z.literal(lexiconPartial.key),
    record: getTypeParserSafe(options, "object", true)(
      lexiconPartial.record,
      toObjectPath(lexiconPropPath, "record"),
      options
    ),
  };
}

export function toQuerySchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return {
    parameters: !lexiconPartial.parameters
      ? z.never()
      : getTypeParserSafe(options, "object", true)(
          lexiconPartial.parameters,
          toObjectPath(lexiconPropPath, "parameters"),
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
            options
          ).describe(lexiconPartial.output.description || ""),
    },
  };
}

export function toProcedureSchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return {
    parameters: !lexiconPartial.parameters
      ? z.never()
      : getTypeParserSafe(options, "object", true)(
          lexiconPartial.parameters,
          toObjectPath(lexiconPropPath, "parameters"),
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
            options
          ).describe(lexiconPartial.input.description || ""),
    },
  };
}

export function toSubscriptionSchemaMap(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return {
    parameters: !lexiconPartial.parameters
      ? z.never()
      : getTypeParserSafe(options, "object", true)(
          lexiconPartial.parameters,
          toObjectPath(lexiconPropPath, "parameters"),
          options
        ),
    message: {
      schema: !lexiconPartial.message?.schema
        ? z.never()
        : getTypeParserSafe(options, "union", true)(
            lexiconPartial.message.schema,
            toObjectPath(lexiconPropPath, "message.schema"),
            options
          ),
    },
  };
}

export function toStringSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  const schema = z.string();

  if (lexiconPartial.minLength) schema.min(lexiconPartial.minLength);
  if (lexiconPartial.maxLength) schema.max(lexiconPartial.maxLength);
  if (lexiconPartial.const) schema.default(lexiconPartial.const);

  return extendSchema(
    lexiconPartial,
    schema,
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toNumberSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  const schema = z.number();

  if (lexiconPartial.minimum) schema.gte(lexiconPartial.minimum);
  if (lexiconPartial.maximum) schema.lte(lexiconPartial.maximum);
  if (lexiconPartial.const) schema.default(lexiconPartial.const);

  return extendSchema(
    lexiconPartial,
    // @TODO make coercion an option
    schema,
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toBooleanSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  const schema = z.boolean();

  if (lexiconPartial.const) schema.default(lexiconPartial.const);

  return extendSchema(
    lexiconPartial,
    schema,
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toBlobRefSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
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
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  const elementPath = toArrayPath(lexiconPropPath);
  const elementSchema = extendSchema(
    lexiconPartial.items,
    defToSchema(lexiconPartial.items, elementPath, options),
    options?.pathOptions?.[elementPath]
  );

  const schema = z.array(elementSchema);

  if (lexiconPartial.minLength) schema.min(lexiconPartial.minLength);
  if (lexiconPartial.maxLength) schema.max(lexiconPartial.maxLength);

  return extendSchema(
    lexiconPartial,
    schema,
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toObjectSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  const propSchemaMap: Record<string, any> = {};

  // @TODO add support for `nullable`
  Object.entries(lexiconPartial.properties).forEach(
    ([propKey, propPartial]) => {
      const propPath = toObjectPath(lexiconPropPath, propKey);
      const propOverride = options?.pathOptions?.[propPath]?.override;

      // Omit property if override is null.
      if (propOverride === null) return;

      if (propOverride) {
        propSchemaMap[propKey] = propOverride;
        return;
      }

      if (
        lexiconPartial.required?.includes(propKey) &&
        options?.pathOptions?.[propPath]?.isRequired !== false
      ) {
        // Set path option 'isRequired' to true if Lexicon JSON dictates the field is required.
        setPathOptionToIsRequired(propPath, options);
      }

      propSchemaMap[propKey] = extendSchema(
        propPartial as Record<string, any>,
        defToSchema(propPartial as Record<string, any>, propPath, options),
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

function refToSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  const lexiconDefs: Record<string, any> | undefined =
    options?.lexiconDict?.[refValueToNSID(lexiconPartial.ref)]?.defs;

  if (!lexiconDefs) throw new Error("Cannot infer reference Lexicon");

  const defKey = refValueToDefKey(lexiconPartial.ref);

  return defToSchema(lexiconDefs[defKey], lexiconPropPath, options);
}

export function toUnionSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  const subtypeSet = lexiconPartial.refs.reduce(
    (
      acc: Array<ZodSchema | ZodOptional<ZodSchema>>,
      ref: string,
      i: number
    ) => {
      const subtypePath = toUnionPath(lexiconPropPath, i);
      const subtypeOverride = options?.pathOptions?.[subtypePath]?.override;

      // Omit subtype from union if override is null.
      if (subtypeOverride === null) return acc;

      acc.push(
        subtypeOverride ||
          refToSchema({ type: "ref", ref }, subtypePath, options)
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
  lexiconPropPath?: string,
  options?: LexiconToZodOptions
) {
  if (options?.followRefs !== true) return z.any();

  return refToSchema(lexiconPartial, lexiconPropPath, options);
}

export function toNullSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return extendSchema(
    lexiconPartial,
    z.never(),
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toCidLinkSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return extendSchema(
    lexiconPartial,
    z.object({
      $link: z.string(),
    }),
    options.pathOptions?.[lexiconPropPath]
  );
}

export function toBytesSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  const schemaRoot = {
    $bytes: z.string(),
  };

  if (lexiconPartial.minLength) schemaRoot.$bytes.min(lexiconPartial.minLength);
  if (lexiconPartial.maxLength) schemaRoot.$bytes.max(lexiconPartial.maxLength);

  return extendSchema(
    lexiconPartial,
    z.object(schemaRoot),
    options.pathOptions?.[lexiconPropPath]
  );
}

export function toUnknownSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return extendSchema(
    lexiconPartial,
    z.any(),
    options.pathOptions?.[lexiconPropPath]
  );
}
