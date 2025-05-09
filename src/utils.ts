import {
  ArrayPath,
  DiscriminatedParserMap,
  LexiconToZodOptions,
  ObjectPath,
  UnionPath,
  WrappedZodSchema,
  ZodSchemaWrapper,
} from "./types";

import { ZodDefault, ZodOptional, ZodSchema } from "zod";

/**
 * Set a `pathOption[path].isOptional` to `true` for a given path.
 * @param lexiconPropPath Dot notated path
 * @param options existing LexiconToZodOptions
 * @returns LexiconToZodOptions
 */
export function setPathToOptional(
  lexiconPropPath: string,
  options: LexiconToZodOptions
): LexiconToZodOptions {
  options.pathOptions = options.pathOptions || {};
  options.pathOptions[lexiconPropPath] =
    options.pathOptions[lexiconPropPath] || {};
  options.pathOptions[lexiconPropPath].isOptional = true;

  return options;
}

/**
 * Recursively traverse and gather root Zod schema by unwrapping "optional" and "default" schema wrappers.
 * @param schema Zod schema
 * @returns ZodSchema
 */
export function parseZodSchemaRootRecursive(
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
export function zodSchemaWrapperMixin<T extends ZodSchema>(
  schema: T | ZodOptional<T> | ZodDefault<T>,
  metadata: Record<string, unknown> = {}
) {
  /**
   * Unpack root schema to attach metadata.
   *
   * This is a useful quality of life feature because metadata won't be
   * attached to a parent "default" or "optional" schema wrapper when traversing
   * the output Zod schema structure during development.
   */
  const targetSchema = parseZodSchemaRootRecursive(schema);

  (targetSchema as ZodSchemaWrapper & T).meta = () => metadata;

  return schema as WrappedZodSchema<T>;
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
  return toObjectPath(path, "__array__") as ArrayPath;
}

/**
 * Create an Object property reference key.
 * @param path Leading dot notated path
 * @param key New object property key
 * @returns ObjectPath
 */
export function toObjectPath(path: string, key: string): ObjectPath | string {
  return path ? `${path}.${key}` : key;
}

/**
 * Create a Union subtype reference key.
 * @param path Leading dot notated path
 * @param index Union subtype set index
 * @returns UnionPath
 */
export function toUnionPath(path: string, index: number): UnionPath {
  return toObjectPath(path, `__union__.${index}`) as UnionPath;
}

/**
 * Safely gather a type parser from a TypeParserMap. Will throw if no parser is found.
 * @param options LexiconToZodOptions
 * @param type Target type
 * @param strict disable $default parser
 * @returns Lexicon type parser
 */
export function getTypeParserSafe<T extends keyof DiscriminatedParserMap>(
  options: LexiconToZodOptions,
  type: T,
  strict: boolean = false
): DiscriminatedParserMap[T] {
  let parser = options.typeParserDict?.[type] as unknown as DiscriminatedParserMap[T];

  if (!parser) parser = strict ? null : options.typeParserDict?.$default;
  if (!parser) throw new Error(`Unsupported parser type: ${type}`);

  return parser;
}
