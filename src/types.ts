import { ZodSchema, ZodOptional } from "zod";

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
  override?: ZodSchema | ZodOptional<ZodSchema>;
  // Additional metadata to be merged via zodSchemaWrapperMixin (ie ZodSchemaWrapper)
  metadata?: Record<string, any>;
  // Additional properties added to path targeted Object schemas.
  additionalProps?: Record<string, UniversalSchema>;
  // `.isOptional()` will be invoked on path Zod schemas not flagged with `isRequired`.
  isRequired?: boolean;
};

export type LexiconToZodOptions = {
  typeParserDict?: Partial<LexiconTypeParserMap>;
  // Provide a Lexicon schema dictionary for `ref` lookups.
  lexiconDict?: Record<string, Record<string, any>>;
  // Dictionary of options applied to specific Lexicon properties.
  pathOptions?: {
    // The full dot notated path of the target Lexicon property.
    [lexiconFieldPath: string]: PathOptions;
  };
};

export type LexiconTypeParser = (
  lexiconPartial: Record<string, any>,
  lexiconPropPath: string,
  lexiconTypeParserMap: LexiconTypeParserMap,
  options?: LexiconToZodOptions
) => UniversalSchema;

export type LexiconTypeParserMap = {
  $default: LexiconTypeParser;
  boolean: LexiconTypeParser;
  integer: LexiconTypeParser;
  string: LexiconTypeParser;
  blob: LexiconTypeParser;
  object: LexiconTypeParser;
  array: LexiconTypeParser;
  union: LexiconTypeParser;
  ref: LexiconTypeParser;
  [type: string]: LexiconTypeParser;
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

export type LexiconPrimaryType =
  | "query"
  | "procedure"
  | "subscription"
  | "record";
