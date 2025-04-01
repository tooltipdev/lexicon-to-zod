import {
  toArraySchema,
  toBlobRefSchema,
  toBooleanSchema,
  toBytesSchema,
  toCidLinkSchema,
  toNullSchema,
  toNumberSchema,
  toObjectSchema,
  toProcedureSchemaMap,
  toQuerySchemaMap,
  toRecordSchemaMap,
  toRefSchema,
  toStringSchema,
  toSubscriptionSchemaMap,
  toUnionSchema,
  toUnknownSchema,
} from "../src/parsers";
import { z, ZodObject } from "zod";
import { LexiconToZodOptions } from "../src/types";

describe("toRecordSchemaMap", () => {
  let lexiconPartial: Record<string, any>;
  let options: LexiconToZodOptions;

  beforeEach(() => {
    lexiconPartial = {
      type: "record",
      key: "sampleKey",
      record: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      },
    };
    options = {
      typeParserDict: {
        object: toObjectSchema,
        string: toStringSchema,
        number: toNumberSchema,
      },
    };
  });

  it("should generate a schema with a literal key", () => {
    const schema = toRecordSchemaMap(lexiconPartial, "", options);
    const result = schema.key.parse("sampleKey");
    expect(result).toEqual("sampleKey");
  });

  it("should generate a schema with a record object", () => {
    const schema = toRecordSchemaMap(lexiconPartial, "", options);
    const result = schema.record.parse({ name: "John", age: 30 });
    expect(result).toEqual({ name: "John", age: 30 });
  });
});

describe("toQuerySchemaMap", () => {
  let lexiconPartial: Record<string, any>;
  let options: LexiconToZodOptions;

  beforeEach(() => {
    lexiconPartial = {
      parameters: {
        type: "params",
        properties: {
          term: { type: "string" },
          q: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
        },
      },
      output: {
        encoding: "application/json",
        schema: {
          type: "object",
          required: ["test"],
          properties: { cursor: { type: "string" }, num: { type: "integer" } },
        },
      },
    };

    options = {
      pathOptions: {},
      typeParserDict: {
        object: toObjectSchema,
        string: toStringSchema,
        integer: toNumberSchema,
      },
    };
  });

  it("should generate a valid query schema map", () => {
    const schemaMap = toQuerySchemaMap(lexiconPartial, "", options);

    expect(schemaMap).toHaveProperty("parameters");
    expect(schemaMap).toHaveProperty("output");
    expect(schemaMap.output).toHaveProperty("encoding");
    expect(schemaMap.output).toHaveProperty("schema");
  });

  it("should return a 'never' schema for missing property", () => {
    lexiconPartial.output = undefined;

    const schemaMap = toQuerySchemaMap(lexiconPartial, "", options);

    expect(schemaMap.output.schema).toBeInstanceOf(z.ZodNever);
    expect(schemaMap.output.encoding).toBeInstanceOf(z.ZodNever);
  });

  it("should correctly parse the parameters as an object schema", () => {
    const schemaMap = toQuerySchemaMap(lexiconPartial, "", options);

    const result = schemaMap.parameters.parse({
      term: "test",
      q: "search query",
      limit: 10,
    });

    expect(result).toEqual({
      term: "test",
      q: "search query",
      limit: 10,
    });
  });

  it("should correctly parse output encoding as literal", () => {
    const schemaMap = toQuerySchemaMap(lexiconPartial, "", options);

    const result = schemaMap.output.encoding.parse("application/json");
    expect(result).toBe("application/json");
  });

  it("shoud correctly parse output schema as object", () => {
    const schemaMap = toQuerySchemaMap(lexiconPartial, "", options);

    const result = schemaMap.output.schema.parse({
      cursor: "abc",
      num: 123,
    });

    expect(result).toEqual({
      cursor: "abc",
      num: 123,
    });
  });
});

describe("toProcedureSchemaMap", () => {
  let lexiconPartial: Record<string, any>;
  let options: LexiconToZodOptions;

  beforeEach(() => {
    lexiconPartial = {
      parameters: {
        type: "params",
        properties: {
          term: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
        },
      },
      output: {
        encoding: "application/json",
        schema: {
          type: "object",
          required: ["test"],
          properties: { cursor: { type: "string" }, num: { type: "integer" } },
        },
      },
      input: {
        encoding: "application/json",
        schema: {
          type: "object",
          required: ["query"],
          properties: { query: { type: "string" } },
        },
      },
    };

    options = {
      pathOptions: {},
      typeParserDict: {
        object: toObjectSchema,
        string: toStringSchema,
        integer: toNumberSchema,
      },
    };
  });

  it("should generate a valid procedure schema map", () => {
    const schemaMap = toProcedureSchemaMap(lexiconPartial, "", options);

    expect(schemaMap).toHaveProperty("parameters");
    expect(schemaMap).toHaveProperty("output");
    expect(schemaMap).toHaveProperty("input");
    expect(schemaMap.output).toHaveProperty("encoding");
    expect(schemaMap.output).toHaveProperty("schema");
    expect(schemaMap.input).toHaveProperty("encoding");
    expect(schemaMap.input).toHaveProperty("schema");
  });

  it("should return a 'never' schema for missing parameters", () => {
    lexiconPartial.parameters = undefined;

    const schemaMap = toProcedureSchemaMap(lexiconPartial, "", options);

    expect(schemaMap.parameters).toBeInstanceOf(z.ZodNever);
  });

  it("should correctly parse output encoding as literal", () => {
    const schemaMap = toProcedureSchemaMap(lexiconPartial, "", options);

    const result = schemaMap.output.encoding.parse("application/json");
    expect(result).toBe("application/json");
  });

  it("should correctly parse input encoding as literal", () => {
    const schemaMap = toProcedureSchemaMap(lexiconPartial, "", options);

    const result = schemaMap.input.encoding.parse("application/json");
    expect(result).toBe("application/json");
  });

  it("should correctly parse the output schema as object", () => {
    const schemaMap = toProcedureSchemaMap(lexiconPartial, "", options);

    const result = schemaMap.output.schema.parse({
      cursor: "abc",
      num: 123,
    });

    expect(result).toEqual({
      cursor: "abc",
      num: 123,
    });
  });

  it("should correctly parse the input schema as object", () => {
    const schemaMap = toProcedureSchemaMap(lexiconPartial, "", options);

    const result = schemaMap.input.schema.parse({
      query: "search query",
    });

    expect(result).toEqual({
      query: "search query",
    });
  });
});

describe("toSubscriptionSchemaMap", () => {
  let lexiconPartial: Record<string, any>;
  let options: LexiconToZodOptions;

  beforeEach(() => {
    lexiconPartial = {
      type: "subscription",
      parameters: {
        type: "params",
        properties: {
          cursor: {
            type: "integer",
          },
        },
      },
      message: {
        schema: {
          type: "union",
          refs: [
            "com.atproto.label.subscribeLabels",
            "com.atproto.label.subscribeLabels#info",
          ],
        },
      },
    };

    options = {
      pathOptions: {},
      typeParserDict: {
        object: toObjectSchema,
        string: toStringSchema,
        integer: toNumberSchema,
        union: toUnionSchema,
        ref: toRefSchema,
      },
      lexiconDict: {
        "com.atproto.label.subscribeLabels": {
          defs: {
            main: {
              type: "object",
              properties: {
                label: { type: "string" },
              },
            },
            info: {
              type: "object",
              properties: {
                info: { type: "string" },
              },
            },
          },
        },
      },
      followRefs: true,
    };
  });

  it("should generate a valid subscription schema map", () => {
    const schemaMap = toSubscriptionSchemaMap(lexiconPartial, "", options);

    expect(schemaMap).toHaveProperty("parameters");
    expect(schemaMap).toHaveProperty("message");
    expect(schemaMap.message).toHaveProperty("schema");
  });

  it("should correctly parse the parameters as an object schema", () => {
    const schemaMap = toSubscriptionSchemaMap(lexiconPartial, "", options);

    const result = schemaMap.parameters.parse({
      cursor: 123,
    });

    expect(result).toEqual({
      cursor: 123,
    });
  });

  it("should be a union type for message.schema", () => {
    const schemaMap = toSubscriptionSchemaMap(lexiconPartial, "", options);

    expect(schemaMap.message.schema).toBeInstanceOf(z.ZodUnion);
  });

  it("should handle the case where the 'message.schema' is missing", () => {
    lexiconPartial.message = undefined;

    const schemaMap = toSubscriptionSchemaMap(lexiconPartial, "", options);

    expect(schemaMap.message.schema).toBeInstanceOf(z.ZodNever);
  });

  it("should correctly parse a valid subtype input in the union schema", () => {
    const schemaMap = toSubscriptionSchemaMap(lexiconPartial, "", options);

    const result = schemaMap.message.schema.parse({
      info: "info data",
    });

    expect(result).toEqual({
      info: "info data",
    });
  });
});

describe("toStringSchema", () => {
  it("should convert to z.string()", () => {
    const lexiconPartial = {};
    const schema = toStringSchema(lexiconPartial);
    expect(schema).toBeInstanceOf(z.ZodString);
  });

  it("should enforce minLength if specified", () => {
    const lexiconPartial = { minLength: 5 };
    const schema = toStringSchema(lexiconPartial);
    expect(() => schema.parse("valid")).not.toThrow();
    expect(() => schema.parse("no")).toThrow();
  });

  it("should enforce maxLength if specified", () => {
    const lexiconPartial = { maxLength: 10 };
    const schema = toStringSchema(lexiconPartial);
    expect(() => schema.parse("valid")).not.toThrow();
    expect(() => schema.parse("this is too long")).toThrow();
  });

  it("should set default value if const is specified", () => {
    const lexiconPartial = { const: "defaultValue" };
    const schema = toStringSchema(lexiconPartial);
    const result = schema.parse(undefined);
    expect(result).toBe("defaultValue");
  });
});

describe("toNumberSchema", () => {
  it("should convert to z.number()", () => {
    const lexiconPartial = {};
    const schema = toNumberSchema(lexiconPartial);
    expect(schema).toBeInstanceOf(z.ZodNumber);
  });

  it("should enforce minimum value if specified", () => {
    const lexiconPartial = { minimum: 5 };
    const schema = toNumberSchema(lexiconPartial);

    expect(() => schema.parse(6)).not.toThrow();
    expect(() => schema.parse(4)).toThrow();
  });

  it("should enforce maximum value if specified", () => {
    const lexiconPartial = { maximum: 10 };
    const schema = toNumberSchema(lexiconPartial);

    expect(() => schema.parse(8)).not.toThrow();
    expect(() => schema.parse(12)).toThrow();
  });

  it("should set default value if const is specified", () => {
    const lexiconPartial = { const: 42 };
    const schema = toNumberSchema(lexiconPartial);

    const result = schema.parse(undefined);
    expect(result).toBe(42);
  });
});

describe("toBooleanSchema", () => {
  it("should convert to z.boolean()", () => {
    const lexiconPartial = {};
    const schema = toBooleanSchema(lexiconPartial);
    expect(schema).toBeInstanceOf(z.ZodBoolean);
  });

  it("should set default value if const is specified", () => {
    const lexiconPartial = { const: true };
    const schema = toBooleanSchema(lexiconPartial);

    const result = schema.parse(undefined);
    expect(result).toBe(true);
  });
});

describe("toBlobRefSchema", () => {
  let lexiconPartial: Record<string, any>;

  beforeEach(() => {
    lexiconPartial = {
      mimeType: "image/png",
      size: 123,
      ref: { $link: "some-link" },
    };
  });

  it("should generate the correct schema structure", () => {
    const schema = toBlobRefSchema(lexiconPartial);

    expect((schema as ZodObject<any>).shape).toHaveProperty("$type");
    expect((schema as ZodObject<any>).shape).toHaveProperty("mimeType");
    expect((schema as ZodObject<any>).shape).toHaveProperty("size");
    expect((schema as ZodObject<any>).shape).toHaveProperty("ref");
  });

  it('should set the default value for $type to "blob"', () => {
    const schema = toBlobRefSchema(lexiconPartial);

    const result = schema.parse(lexiconPartial);
    expect(result.$type).toBe("blob");
  });

  it("should require mimeType as a string", () => {
    const schema = toBlobRefSchema(lexiconPartial);

    expect(() => schema.parse(lexiconPartial)).not.toThrow();
    expect(() => schema.parse({ ...lexiconPartial, mimeType: 123 })).toThrow();
  });

  it("should coerce size to a number", () => {
    const schema = toBlobRefSchema(lexiconPartial);

    const result = schema.parse({ ...lexiconPartial, size: "123" });
    expect(result.size).toBe(123);
  });

  it("should validate the ref object structure", () => {
    const schema = toBlobRefSchema(lexiconPartial);

    const result = schema.parse(lexiconPartial);

    expect(result.ref).toHaveProperty("$link");
    expect(result.ref.$link).toBe("some-link");
  });
});

describe("toArraySchema", () => {
  const typeParserDict = {
    string: toStringSchema,
  };

  let lexiconPartial: Record<string, any>;

  beforeEach(() => {
    lexiconPartial = {
      items: { type: "string" },
      minLength: 1,
      maxLength: 5,
    };
  });

  it("should generate the correct schema structure for an array", () => {
    const schema = toArraySchema(lexiconPartial, "", { typeParserDict });
    expect(schema).toBeInstanceOf(z.ZodArray);
  });

  it("should apply the element schema correctly", () => {
    const schema = toArraySchema(lexiconPartial, "", { typeParserDict });

    const result = schema.parse(["test", "example"]);
    expect(result).toEqual(["test", "example"]);
  });

  it("should apply minLength constraint to the array", () => {
    const schema = toArraySchema(lexiconPartial, "", { typeParserDict });

    expect(() => schema.parse(["test"])).not.toThrow();
    expect(() => schema.parse([])).toThrow();
  });

  it("should apply maxLength constraint to the array", () => {
    const schema = toArraySchema(lexiconPartial, "", { typeParserDict });

    expect(() =>
      schema.parse(["test", "example", "sample", "item", "data"])
    ).not.toThrow();
    expect(() =>
      schema.parse(["test", "example", "sample", "item", "data", "extra"])
    ).toThrow();
  });
});

describe("toObjectSchema", () => {
  let lexiconPartial: Record<string, any>;
  let options: LexiconToZodOptions;

  beforeEach(() => {
    lexiconPartial = {
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name"],
    };
    options = {
      pathOptions: {},
      typeParserDict: {
        string: toStringSchema,
        number: toNumberSchema,
      },
    };
  });

  it("should generate a valid object schema", () => {
    const schema = toObjectSchema(lexiconPartial, "", options);

    expect(schema).toBeInstanceOf(z.ZodObject);
  });

  it("should validate a valid object schema", () => {
    const schema = toObjectSchema(lexiconPartial, "", options);
    const result = schema.parse({ name: "John", age: 30 });

    expect(result).toEqual({ name: "John", age: 30 });
  });

  it("should mark required properties as required in the schema", () => {
    const schema = toObjectSchema(lexiconPartial, "", options);

    expect(() => schema.parse({ age: 30 })).toThrow();
    expect(() => schema.parse({ name: "John", age: 30 })).not.toThrow();
  });

  it("should treat non-required properties as optional", () => {
    const schema = toObjectSchema(lexiconPartial, "", options);
    const result = schema.parse({ name: "John" });
    expect(result).toEqual({ name: "John" });
  });

  it("should support property overrides using dot-notated paths", () => {
    options.pathOptions = {
      age: { override: z.string() },
    };

    const schema = toObjectSchema(lexiconPartial, "", options);
    const result = schema.parse({ name: "John", age: "30" });

    expect(result).toEqual({ name: "John", age: "30" });
  });

  it("should skip properties with null override using dot-notated paths", () => {
    options.pathOptions = {
      name: { override: null },
    };

    const schema = toObjectSchema(lexiconPartial, "", options);
    const result = schema.parse({ age: 30 });

    expect(result).toEqual({ age: 30 });
  });
});

describe("toUnionSchema", () => {
  let lexiconDict: Record<string, any>;
  let options: LexiconToZodOptions;
  let lexiconPartial: Record<string, any>;

  beforeEach(() => {
    lexiconDict = {
      "com.example.user": {
        defs: {
          main: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
      "com.example.post": {
        defs: {
          main: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              author: { type: "ref", ref: "com.example.user" },
            },
          },
        },
      },
    };

    options = {
      lexiconDict,
      followRefs: true,
      typeParserDict: {
        object: toObjectSchema,
        string: toStringSchema,
        number: toNumberSchema,
        ref: toRefSchema,
      },
    };

    lexiconPartial = {
      refs: ["com.example.user", "com.example.post"],
    };
  });

  it("should generate a union schema from references", () => {
    const schema = toUnionSchema(lexiconPartial, "", options);

    let result = schema.parse({ name: "John", email: "john@example.com" });

    expect(result).toEqual({ name: "John", email: "john@example.com" });

    result = schema.parse({
      title: "foo",
      content: "bar",
      author: { name: "John", email: "john@example.com" },
    });

    expect(result).toEqual({
      title: "foo",
      content: "bar",
      author: { name: "John", email: "john@example.com" },
    });
  });

  it("should use the override schema if provided", () => {
    options.pathOptions = {
      "__union__.0": {
        override: z.object({ name: z.string(), email: z.number() }),
      },
    };

    lexiconPartial.refs = ["com.example.user"];

    const schema = toUnionSchema(lexiconPartial, "", options);
    const result = schema.parse({ name: "John", email: 1 });

    expect(result).toEqual({ name: "John", email: 1 });
  });

  it("should omit a subtype from the union if override is null", () => {
    options.pathOptions = {
      "__union__.1": { override: null },
    };

    lexiconPartial.refs = ["com.example.user", "com.example.post"];

    const schema = toUnionSchema(lexiconPartial, "", options);

    expect(() =>
      schema.parse({ name: "John", email: "john@example.com" })
    ).not.toThrow();

    expect(() =>
      schema.parse({
        title: "Post Title",
        content: "Post Content",
        author: { name: "John", email: "john@example.com" },
      })
    ).toThrow();
  });
});

describe("toRefSchema", () => {
  let lexiconDict: Record<string, any>;
  let options: LexiconToZodOptions;
  let lexiconPartial: Record<string, any>;

  beforeEach(() => {
    lexiconDict = {
      "com.example.user": {
        defs: {
          main: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
      "com.example.post": {
        defs: {
          main: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              author: { type: "ref", ref: "com.example.user" },
            },
          },
        },
      },
    };

    options = {
      lexiconDict,
      followRefs: true,
      typeParserDict: {
        object: toObjectSchema,
        string: toStringSchema,
        number: toNumberSchema,
      },
    };

    lexiconPartial = { ref: "com.example.user" };
  });

  it("should resolve reference schema when followRefs is true", () => {
    const schema = toRefSchema(lexiconPartial, "", options);
    const parsed = schema.parse({ name: "John", email: "john@example.com" });

    expect(parsed).toEqual({ name: "John", email: "john@example.com" });
  });

  it("should return z.any() when followRefs is false", () => {
    options.followRefs = false;

    const schema = toRefSchema(lexiconPartial, "", options);

    expect(schema).toBeInstanceOf(z.ZodAny);
  });

  it("should throw error if reference is not found in lexiconDict", () => {
    lexiconPartial.ref = "com.example.nonexistent";

    expect(() => toRefSchema(lexiconPartial, "", options)).toThrow();
  });
});

describe("toNullSchema", () => {
  let lexiconPartial: Record<string, any>;
  let options: LexiconToZodOptions;

  beforeEach(() => {
    lexiconPartial = {}; // null schema has no extra properties to check in lexiconPartial
    options = { pathOptions: {} };
  });

  it("should generate a valid null schema", () => {
    const schema = toNullSchema(lexiconPartial, "", options);

    expect(schema).toBeInstanceOf(z.ZodNull);
  });

  it("should accept null as a valid value", () => {
    const schema = toNullSchema(lexiconPartial, "", options);
    const result = schema.parse(null);

    expect(result).toBeNull();
  });

  it("should throw an error for non-null values", () => {
    const schema = toNullSchema(lexiconPartial, "", options);

    expect(() => schema.parse("Hello")).toThrow();
    expect(() => schema.parse(42)).toThrow();
    expect(() => schema.parse(undefined)).toThrow();
  });
});

describe("toCidLinkSchema", () => {
  let lexiconPartial: Record<string, any>;
  let options: LexiconToZodOptions;

  beforeEach(() => {
    lexiconPartial = {};
    options = { pathOptions: {} };
  });

  it("should generate a valid CidLink schema", () => {
    const schema = toCidLinkSchema(lexiconPartial, "", options);

    expect(schema).toBeInstanceOf(z.ZodObject);
  });

  it("should validate a valid CID link object", () => {
    const schema = toCidLinkSchema(lexiconPartial, "", options);
    const validValue = { $link: "Qm1234abcd" };

    const result = schema.parse(validValue);
    expect(result).toEqual(validValue);
  });

  it("should throw an error if $link is missing", () => {
    const schema = toCidLinkSchema(lexiconPartial, "", options);

    expect(() => schema.parse({})).toThrow();
  });

  it("should throw an error if $link is not a string", () => {
    const schema = toCidLinkSchema(lexiconPartial, "", options);

    expect(() => schema.parse({ $link: 12345 })).toThrow();
  });
});

describe("toBytesSchema", () => {
  let options: LexiconToZodOptions;

  beforeEach(() => {
    options = { pathOptions: {} };
  });

  it("should validate a valid bytes string", () => {
    const schema = toBytesSchema({}, "", options);
    const validValue = { $bytes: "Qm1234abcd" };

    const result = schema.parse(validValue);
    expect(result).toEqual(validValue);
  });

  it("should throw an error if $bytes is missing", () => {
    const schema = toBytesSchema({}, "", options);
    const invalidValue = {};

    expect(() => schema.parse(invalidValue)).toThrow();
  });

  it("should throw an error if $bytes is not a string", () => {
    const schema = toBytesSchema({}, "", options);
    const invalidValue = { $bytes: 12345 };

    expect(() => schema.parse(invalidValue)).toThrow();
  });

  it("should apply minLength constraint", () => {
    const lexiconPartial = { minLength: 5 };
    const schema = toBytesSchema(lexiconPartial, "", options);
    const invalidValue = { $bytes: "abcd" };
    const validValue = { $bytes: "Qm1234abcd" };

    expect(() => schema.parse(invalidValue)).toThrow();
    const result = schema.parse(validValue);
    expect(result).toEqual(validValue);
  });

  it("should apply maxLength constraint", () => {
    const lexiconPartial = { maxLength: 10 };
    const schema = toBytesSchema(lexiconPartial, "", options);
    const invalidValue = { $bytes: "Qm1234abcdlongerthan10" };
    const validValue = { $bytes: "Qm1234abcd" };

    expect(() => schema.parse(invalidValue)).toThrow();
    const result = schema.parse(validValue);
    expect(result).toEqual(validValue);
  });

  it("should apply both minLength and maxLength constraints", () => {
    const lexiconPartial = { minLength: 5, maxLength: 10 };
    const schema = toBytesSchema(lexiconPartial, "", options);

    expect(() => schema.parse({ $bytes: "abcd" })).toThrow();
    expect(() => schema.parse({ $bytes: "Qm1234abcdlongerthan10" })).toThrow();

    const result = schema.parse({ $bytes: "Qm1234ab" });

    expect(result).toEqual({ $bytes: "Qm1234ab" });
  });
});

describe("toUnknownSchema", () => {
  let options: LexiconToZodOptions;

  beforeEach(() => {
    options = { pathOptions: {} };
  });

  it("should generate a valid Unknown schema", () => {
    const schema = toUnknownSchema({}, "", options);

    expect(schema).toBeInstanceOf(z.ZodUnknown);
  });

  it("should allow any value to pass the unknown schema", () => {
    const schema = toUnknownSchema({}, "", options);

    const validValues = [
      { $unknown: "some string" },
      { $unknown: 12345 },
      { $unknown: null },
      { $unknown: undefined },
    ];

    validValues.forEach((value) => {
      expect(() => schema.parse(value)).not.toThrow();
    });
  });
});
