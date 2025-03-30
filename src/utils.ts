import {
  ArrayPath,
  LexiconToZodOptions,
  LexiconTypeParser,
  ObjectPath,
  UnionPath,
  WrappedZodOptional,
  WrappedZodSchema,
} from "./types";

import { ZodOptional, ZodSchema } from "zod";

/**
 * Set a `pathOption[path].isOptional` to `true` for a given path.
 * @param lexiconPropPath Dot notated path
 * @param options existing LexiconToZodOptions
 * @returns LexiconToZodOptions
 */
export function setPathOptionToIsRequired(
  lexiconPropPath: string,
  options: LexiconToZodOptions
): LexiconToZodOptions {
  options.pathOptions = options.pathOptions || {};
  options.pathOptions[lexiconPropPath] =
    options.pathOptions[lexiconPropPath] || {};
  options.pathOptions[lexiconPropPath].isRequired = true;

  return options;
}

/**
 * Recursively traverse and gather root Zod schema by unwrapping "optional" and "default" schema wrappers.
 * @param schema Zod schema
 * @returns ZodSchema
 */
function parseZodSchemaRootRecursive(
  schema: ZodSchema | ZodOptional<ZodSchema>
) {
  if ((schema as ZodOptional<ZodSchema>)._def.innerType)
    return parseZodSchemaRootRecursive(
      (schema as ZodOptional<ZodSchema>)._def.innerType
    );

  return schema as ZodSchema;
}

/**
 * Merge ZodSchemaWrapper implementation with Zod schema and coerce to WrappedSchema.
 * @param schema Zod schema
 * @param metadata Metadata to return with ZodSchemaWrapper#meta
 * @returns WrappedSchema
 */
export function zodSchemaWrapperMixin(
  schema: ZodSchema | ZodOptional<ZodSchema>,
  metadata: Record<string, any> = {}
) {
  /**
   * Unpack root schema to attach metadata.
   *
   * This is a useful quality of life feature because metadata won't be
   * attached to a parent "default" or "optional" schema wrapper when traversing
   * the output Zod schema structure during development.
   */
  const targetSchema = parseZodSchemaRootRecursive(schema);

  (targetSchema as WrappedZodSchema<ZodSchema>).meta = () => metadata;

  return schema as WrappedZodSchema<ZodSchema> | WrappedZodOptional<ZodSchema>;
}

/**
 * Infer a Lexicon field key from a Lexicon `ref` field type value.
 * @param ref Lexicon reference
 * @returns string
 */
export function refValueToDefKey(ref: string): string {
  return ref.split("#")[1] || "main";
}

/**
 * Infer a Lexicon NSID from a Lexicon `ref` field type value.
 * @param ref Lexicon reference
 * @returns LexiconSchemaKey
 */
export function refValueToNSID(ref: string): string {
  return ref.replace("lex:", "").split("#")[0];
}

/**
 * Create an Array element reference key.
 * @param path Leading dot notated path
 * @returns ArrayPath
 */
export function toArrayPath(path: string): ArrayPath {
  return `${path}.__array__`;
}

/**
 * Create an Object property reference key.
 * @param path Leading dot notated path
 * @param key New object property key
 * @returns ObjectPath
 */
export function toObjectPath(path: string, key: string): ObjectPath {
  return `${path}.${key}`;
}

/**
 * Create a Union subtype reference key.
 * @param path Leading dot notated path
 * @param index Union subtype set index
 * @returns UnionPath
 */
export function toUnionPath(path: string, index: number): UnionPath {
  return `${path}.__union__.${index}`;
}

/**
 * Safely gather a type parser from a TypeParserMap. Will throw if no parser is found.
 * @param options LexiconToZodOptions
 * @param type Target type
 * @param strict disable $default parser
 * @returns LexiconTypeParser
 */
export function getTypeParserSafe(
  options: LexiconToZodOptions,
  type: string,
  strict: boolean = false
) {
  let parser: LexiconTypeParser | null | undefined =
    options.typeParserDict?.[type];

  if (!parser) parser = strict ? null : options.typeParserDict?.$default;
  if (!parser) throw new Error(`Unsupported parser type: ${type}`);

  return parser;
}
