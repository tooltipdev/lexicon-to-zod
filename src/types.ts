import { ZodSchema, ZodOptional, z } from "zod";

/**
 * Provide additional functionality to Zod schemas.
 *
 * Mostly used for adding developer quality of life metadata to Zod schemas.
 */
export type ZodSchemaWrapper = { meta: () => Record<string, any> };
export type WrappedZodSchema<T extends ZodSchema> = ZodSchemaWrapper & T;

/**
 * We use ZodOptional in a hacky way here.
 * It's being used to haphazardly gesture towards Zod schemas with an outer wrapper of some
 * kind (ie it includes "_innerType"). This would apply to Zod types such as ZodOptional and ZodDefault.
 */
export type WrappedZodOptional<T extends ZodSchema> = ZodOptional<
  WrappedZodSchema<T>
>;

export type WrappedSchema<T extends ZodSchema> =
  | WrappedZodSchema<T>
  | WrappedZodOptional<T>;

export type UniversalSchema =
  | ZodSchema
  | ZodOptional<ZodSchema>
  | WrappedSchema<ZodSchema>;

export type PathOptions = {
  /**
   * Override the Zod schema for a Lexicon property with your
   * own Zod schema.
   *
   * Providing `null` will omit the property from the output Zod schema.
   */
  override?: UniversalSchema | null;
  // Additional metadata to be merged via zodSchemaWrapperMixin (ie ZodSchemaWrapper)
  metadata?: Record<string, any>;
  // Additional properties added to path targeted Object schemas.
  additionalProps?: Record<string, UniversalSchema>;
  // `.isOptional()` will be invoked on path Zod schemas not flagged with `isRequired`.
  isRequired?: boolean;
};

export type LexiconToZodOptions = {
  followRefs?: boolean;
  typeParserDict?: Partial<TypeParserMap>;
  // Provide a Lexicon schema dictionary for `ref` lookups.
  lexiconDict?: Record<string, Record<string, any>>;
  // Dictionary of options applied to specific schema properties.
  pathOptions?: {
    // The full dot-notated path of the target schema property.
    [path: string]: PathOptions;
  };
};

export type LexiconTypeParser<T> = (
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  lexiconTypeParserMap: TypeParserMap,
  options?: LexiconToZodOptions
) => T;

export type PrimaryTypeParserMap = {
  record: LexiconTypeParser<Record<string, any>>;
  query: LexiconTypeParser<Record<string, any>>;
  procedure: LexiconTypeParser<Record<string, any>>;
  subscription: LexiconTypeParser<Record<string, any>>;
};

export type TypeParserMap = {
  $default: LexiconTypeParser<UniversalSchema>;
  boolean: LexiconTypeParser<UniversalSchema>;
  integer: LexiconTypeParser<UniversalSchema>;
  string: LexiconTypeParser<UniversalSchema>;
  blob: LexiconTypeParser<UniversalSchema>;
  object: LexiconTypeParser<UniversalSchema>;
  array: LexiconTypeParser<UniversalSchema>;
  union: LexiconTypeParser<UniversalSchema>;
  ref: LexiconTypeParser<UniversalSchema>;
  [type: string]: LexiconTypeParser<UniversalSchema>;
};

/**
 * Bespoke nested path structures for targeting Lexicon properties with LexiconToZodOptions.pathOptions.
 */

export type ObjectPath = `${string}.${string}`;
export type ArrayPath = `${string}.__array__`;
export type UnionPath = `${string}.__union__.${number}`;

/**
 * ATProtocol related types
 */

export const PrimaryTypeSchema = z.union([
  z.literal("query"),
  z.literal("procedure"),
  z.literal("subscription"),
  z.literal("record"),
]);

export const NonPrimaryTypeSchema = z.union([
  z.literal("null"),
  z.literal("boolean"),
  z.literal("integer"),
  z.literal("string"),
  z.literal("bytes"),
  z.literal("cid-link"),
  z.literal("blob"),
  z.literal("array"),
  z.literal("object"),
  z.literal("params"),
  z.literal("token"),
  z.literal("ref"),
  z.literal("union"),
  z.literal("unknown"),
]);

export type LexiconPrimaryType = z.infer<typeof PrimaryTypeSchema>;
export type NonPrimaryType = z.infer<typeof NonPrimaryTypeSchema>;
