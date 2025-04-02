/**
 * @TODO add support for coerce to primitives
 * @TODO review support for type properties (min, max, etc)
 */

import {
  z,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodSchema,
  ZodString,
} from "zod";
import {
  zodSchemaWrapperMixin,
  toArrayPath,
  toObjectPath,
  toUnionPath,
  refValueToNSID,
  refValueToDefKey,
  getTypeParserSafe,
  setPathToOptional,
  parseZodSchemaRootRecursive,
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

  if (pathOptions?.isOptional === true)
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
  let schema: UniversalSchema = z.string();

  if (lexiconPartial.minLength)
    schema = (schema as ZodString).min(lexiconPartial.minLength);
  if (lexiconPartial.maxLength)
    schema = (schema as ZodString).max(lexiconPartial.maxLength);
  if (lexiconPartial.const) schema = schema.default(lexiconPartial.const);

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
  let schema: UniversalSchema = z.number();

  if (lexiconPartial.minimum)
    schema = (schema as ZodNumber).gte(lexiconPartial.minimum);
  if (lexiconPartial.maximum)
    schema = (schema as ZodNumber).lte(lexiconPartial.maximum);
  if (lexiconPartial.const) schema = schema.default(lexiconPartial.const);

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
  let schema: UniversalSchema = z.boolean();

  if (lexiconPartial.const) schema = schema.default(lexiconPartial.const);

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
  const elementSchema = defToSchema(lexiconPartial.items, elementPath, options);

  let schema = z.array(elementSchema);

  if (lexiconPartial.minLength) schema = schema.min(lexiconPartial.minLength);
  if (lexiconPartial.maxLength) schema = schema.max(lexiconPartial.maxLength);

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
        !lexiconPartial.required?.includes(propKey) &&
        options?.pathOptions?.[propPath]?.isOptional !== false
      ) {
        // Set path option 'isRequired' to true if Lexicon JSON dictates the field is required.
        setPathToOptional(propPath, options);
      }

      propSchemaMap[propKey] = defToSchema(
        propPartial as Record<string, any>,
        propPath,
        options
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

      let subtypeSchema =
        subtypeOverride ||
        getTypeParserSafe(options, "ref", true)(
          { type: "ref", ref },
          subtypePath,
          options
        );

      /**
       * Object subtypes will overlap if strict is not applied.
       * @TODO add support for discriminated unions
       */
      if (parseZodSchemaRootRecursive(subtypeSchema) instanceof ZodObject)
        subtypeSchema = (subtypeSchema as ZodObject<any>).strict();

      acc.push(subtypeSchema);

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

  const lexiconDefs: Record<string, any> | undefined =
    options?.lexiconDict?.[refValueToNSID(lexiconPartial.ref)]?.defs;

  if (!lexiconDefs) throw new Error("Cannot infer reference Lexicon");

  const defKey = refValueToDefKey(lexiconPartial.ref);
  const def = lexiconDefs[defKey];

  if (!def) throw new Error("Cannot infer reference Lexicon def");

  return defToSchema(def, lexiconPropPath, options);
}

export function toNullSchema(
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return extendSchema(
    lexiconPartial,
    z.null(),
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

  if (lexiconPartial.minLength)
    schemaRoot.$bytes = schemaRoot.$bytes.min(lexiconPartial.minLength);
  if (lexiconPartial.maxLength)
    schemaRoot.$bytes = schemaRoot.$bytes.max(lexiconPartial.maxLength);

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
    z.unknown(),
    options.pathOptions?.[lexiconPropPath]
  );
}
