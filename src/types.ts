import { ZodSchema, ZodOptional, z } from "zod";

// Provide additional functionality to Zod schemas via mixin.
export type ZodSchemaWrapper = { meta: () => Record<string, any> };
export type WrappedZodSchema<T extends ZodSchema> = ZodSchemaWrapper & T;

// Hacky! Using ZodOptional to haphazardly gesture towards Zod schemas with an inner type.
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

export type LexiconTypeParser = (
  lexiconPartial: Record<string, any>,
  path?: string,
  options?: LexiconToZodOptions
) => UniversalSchema;

export type TypeParserMap = {
  $default: LexiconTypeParser;
  boolean: LexiconTypeParser;
  integer: LexiconTypeParser;
  string: LexiconTypeParser;
  blob: LexiconTypeParser;
  object: LexiconTypeParser;
  array: LexiconTypeParser;
  union: LexiconTypeParser;
  ref: LexiconTypeParser;
  null: LexiconTypeParser;
  bytes: LexiconTypeParser;
  unknown: LexiconTypeParser;
  "cid-link": LexiconTypeParser;
  [type: string]: LexiconTypeParser;
};

export type PathOptions = {
  // Override Zod schema for target Lexicon property, or provide `null` to omit property.
  override?: UniversalSchema | null;
  // Additional metadata added to Zod schema via mixin.
  metadata?: Record<string, any>;
  // Additional properties added to object Zod schmea.
  additionalProps?: Record<string, UniversalSchema>;
  // `.isOptional()` will be invoked on Zod schemas if not set to 'true'.
  isRequired?: boolean;
  [option: string]: any;
};

export type LexiconToZodOptions = {
  // Resolve ref values to Lexicon schemas if set to 'true'
  followRefs?: boolean;
  // Dictionary of type-specific LexiconTypeParser implementations.
  typeParserDict?: Partial<TypeParserMap>;
  // Lexicon schema dictionary used for `ref` lookups.
  lexiconDict?: Record<string, Record<string, any>>;
  // Dictionary of options applied to path targeted schemas.
  pathOptions?: {
    // The full dot-notated path of the target schema.
    [path: string]: PathOptions;
  };
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
