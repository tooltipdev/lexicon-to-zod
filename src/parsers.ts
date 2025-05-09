/**
 * @TODO add support for coerce to primitives
 * @TODO review support for type properties (min, max, etc)
 */

import {
  z,
  ZodAnyDef,
  ZodBoolean,
  ZodDefault,
  ZodDiscriminatedUnionOption,
  ZodLiteral,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodRawShape,
  ZodSchema,
  ZodString,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
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
} from "./utils";
import {
  ArrayPartial,
  BooleanPartial,
  BytesPartial,
  IntegerPartial,
  LexiconPartial,
  LexiconToZodOptions,
  NullPartial,
  ObjectPartial,
  PathOptions,
  ProcedurePartial,
  QueryPartial,
  RecordPartial,
  RefPartial,
  StringPartial,
  SubscriptionPartial,
  UnionPartial,
  UniversalSchema,
  WrappedSchema,
  WrappedZodSchema,
} from "./types";

/**
 * Apply Lexicon metadata to a UniversalSchema.
 * @param lexiconPartial Lexicon JSON partial
 * @param lexiconPartialSchema Parsed Lexicon Zod schema
 * @param pathOptions pathOptions entry value
 * @returns extended Lexicon Zod schema
 */
export function extendSchema<T extends ZodSchema>(
  lexiconPartial: LexiconPartial,
  lexiconPartialSchema: T,
  pathOptions?: PathOptions
) {
  let schema: T | ZodDefault<T> | ZodOptional<T> | WrappedZodSchema<T> =
    lexiconPartialSchema;

  if (lexiconPartial.description)
    schema = lexiconPartialSchema.describe(lexiconPartial.description);

  if (lexiconPartial.default)
    schema = lexiconPartialSchema.default(lexiconPartial.default);

  if (pathOptions?.isOptional === true)
    schema = lexiconPartialSchema.optional();

  if (pathOptions?.metadata)
    schema = zodSchemaWrapperMixin(lexiconPartialSchema, pathOptions.metadata);

  return schema;
}

/**
 * Parse a non-primary Lexicon structure to a UniversalSchema.
 * @param lexiconPartial Lexicon JSON partial
 * @param lexiconPropPath Lexicon property path
 * @param options LexiconToZodOptions
 * @returns UniversalSchema
 */
export function defToSchema(
  lexiconPartial,
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
  lexiconPartial: RecordPartial,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return {
    key: z.literal(lexiconPartial.key),
    record: (
      getTypeParserSafe(options, "object", true) as typeof toObjectSchema
    )(lexiconPartial.record, toObjectPath(lexiconPropPath, "record"), options),
  };
}

export function toQuerySchemaMap(
  lexiconPartial: QueryPartial,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return {
    parameters: !lexiconPartial.parameters
      ? z.never()
      : getTypeParserSafe(options, "object", true)(
          lexiconPartial.parameters as unknown as ObjectPartial,
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
  lexiconPartial: ProcedurePartial,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return {
    parameters: !lexiconPartial.parameters
      ? z.never()
      : getTypeParserSafe(options, "object", true)(
          lexiconPartial.parameters as unknown as ObjectPartial,
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
  lexiconPartial: SubscriptionPartial,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return {
    parameters: !lexiconPartial.parameters
      ? z.never()
      : getTypeParserSafe(options, "object", true)(
          lexiconPartial.parameters as unknown as ObjectPartial,
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
  lexiconPartial: StringPartial,
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
  lexiconPartial: IntegerPartial,
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
  lexiconPartial: BooleanPartial,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  let schema: ZodBoolean | ZodDefault<ZodBoolean> = z.boolean();

  if (lexiconPartial.const) schema = schema.default(lexiconPartial.const);

  return extendSchema(
    lexiconPartial,
    schema,
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toBlobRefSchema(
  lexiconPartial: LexiconPartial & { type: "blob" },
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
  lexiconPartial: ArrayPartial,
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

export function toObjectSchema<T extends {properties: Record<string, LexiconPartial>}>(
  lexiconPartial: T,
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  const propSchemaMap = {} as Record<
    keyof T["properties"],
    ReturnType<typeof extendSchema>
  >;

  // @TODO add support for `nullable`
  Object.entries(lexiconPartial.properties).forEach(
    (entry) => {
      const [propKey, propPartial]: [keyof T['properties'], LexiconPartial] = entry
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
        // Set path option 'isOptional' to true if Lexicon/options don't dictate that the field is required.
        setPathToOptional(propPath, options);
      }

      propSchemaMap[propKey] = defToSchema(propPartial, propPath, options);
    }
  );

  return z.object({
    ...propSchemaMap,
    // Attach additional schema properties that may not exist in Lexicon JSON.
    ...(options?.pathOptions?.[lexiconPropPath]?.additionalProps || {}),
  });
}

export function toUnionSchema(
  lexiconPartial: UnionPartial,
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

      options.pathOptions = options.pathOptions || {};
      options.pathOptions[subtypePath] = options.pathOptions[subtypePath] || {};
      options.pathOptions[subtypePath].additionalProps =
        options.pathOptions[subtypePath].additionalProps || {};
      options.pathOptions[subtypePath].additionalProps["$type"] = z.literal(
        ref.replace("lex:", "")
      );

      const subtypeSchema =
        subtypeOverride ||
        getTypeParserSafe(options, "ref", true)(
          { type: "ref", ref },
          subtypePath,
          options
        );

      acc.push(subtypeSchema);

      return acc;
    },
    []
  );

  return extendSchema(
    lexiconPartial,
    z.discriminatedUnion(
      "$type",
      subtypeSet as [(typeof subtypeSet)[0], ...typeof subtypeSet]
    ),
    options?.pathOptions?.[lexiconPropPath]
  );
}

export function toRefSchema(
  lexiconPartial: RefPartial,
  lexiconPropPath?: string,
  options?: LexiconToZodOptions
) {
  if (options?.followRefs !== true) return z.any();

  const lexiconDefs: Record<string, LexiconPartial> | undefined =
    options?.lexiconDict?.[refValueToNSID(lexiconPartial.ref)]?.defs;

  if (!lexiconDefs) throw new Error("Cannot infer reference Lexicon");

  const defKey = refValueToDefKey(lexiconPartial.ref);
  const def = lexiconDefs[defKey];

  if (!def) throw new Error("Cannot infer reference Lexicon def");

  return defToSchema(def, lexiconPropPath, options);
}

export function toNullSchema(
  lexiconPartial: NullPartial,
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
  lexiconPartial: LexiconPartial & { type: "cid-link" },
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
  lexiconPartial: BytesPartial,
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
  lexiconPartial: LexiconPartial & { type: "unknown" },
  lexiconPropPath: string = "",
  options: LexiconToZodOptions = {}
) {
  return extendSchema(
    lexiconPartial,
    z.unknown(),
    options.pathOptions?.[lexiconPropPath]
  );
}
