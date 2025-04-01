import { parsers } from "../src";
import {
  toNumberSchema,
  toObjectSchema,
  toRefSchema,
  toStringSchema,
  toUnionSchema,
} from "../src/parsers";

import { LexiconToZodOptions } from "../src/types";

describe("parsers map", () => {
  let options: LexiconToZodOptions;

  beforeEach(() => {
    options = {
      typeParserDict: {
        object: toObjectSchema,
        string: toStringSchema,
        integer: toNumberSchema,
        ref: toRefSchema,
        union: toUnionSchema,
      },
      followRefs: true,
      lexiconDict: {
        "com.atproto.label.subscribeLabels": {
          defs: {
            main: {
              type: "object",
              properties: {
                foo: { type: "string" },
              },
            },
            labels: {
              type: "object",
              properties: {
                label: { type: "string" },
                test: { type: "string" },
              },
            },
            info: {
              type: "object",
              properties: {
                test: { type: "string" },
              },
            },
          },
        },
      },
    };
  });

  it("should validate 'record' schema with valid input", () => {
    const lexiconPartial = {
      key: "someKey",
      record: {
        type: "object",
        properties: { name: { type: "string" }, age: { type: "integer" } },
      },
    };
    const schema = parsers().record(lexiconPartial, options);
    const validInput = { name: "John", age: 30 };
    expect(() => schema.record.parse(validInput)).not.toThrow();
  });

  it("should validate 'query' schema with valid input", () => {
    const lexiconPartial = {
      parameters: {
        type: "params",
        properties: { term: { type: "string" }, q: { type: "string" } },
      },
      output: {
        encoding: "application/json",
        schema: {
          type: "object",
          properties: {
            cursor: { type: "string" },
            test: { type: "string" },
          },
        },
      },
    };
    const schema = parsers().query(lexiconPartial, options);
    const validParameters = { term: "search", q: "query" };
    const validOutput = { cursor: "abc", test: "test" };
    expect(() => schema.parameters.parse(validParameters)).not.toThrow();
    expect(() => schema.output.schema.parse(validOutput)).not.toThrow();
  });

  it("should validate 'procedure' schema with valid input", () => {
    const lexiconPartial = {
      parameters: {
        type: "params",
        properties: { inputParam: { type: "string" } },
      },
      output: {
        encoding: "application/json",
        schema: {
          type: "object",
          properties: { responseCode: { type: "integer" } },
        },
      },
      input: {
        encoding: "application/json",
        schema: {
          type: "object",
          properties: { requestData: { type: "string" } },
        },
      },
    };
    const schema = parsers().procedure(lexiconPartial, options);
    const validParameters = { inputParam: "data" };
    const validOutput = { responseCode: 200 };
    const validInput = { requestData: "request data" };
    expect(() => schema.parameters.parse(validParameters)).not.toThrow();
    expect(() => schema.output.schema.parse(validOutput)).not.toThrow();
    expect(() => schema.input.schema.parse(validInput)).not.toThrow();
  });

  it("should validate 'subscription' schema with valid input", () => {
    const lexiconPartial = {
      parameters: {
        type: "params",
        properties: { cursor: { type: "integer" } },
      },
      message: {
        schema: {
          type: "union",
          refs: [
            "com.atproto.label.subscribeLabels#labels",
            "com.atproto.label.subscribeLabels#info",
          ],
        },
      },
    };
    const schema = parsers().subscription(lexiconPartial, options);
    const validParameters = { cursor: 123 };
    const validMessage = { label: "important", test: "test" };
    expect(() => schema.parameters.parse(validParameters)).not.toThrow();
    expect(() => schema.message.schema.parse(validMessage)).not.toThrow();
  });

  it("should validate 'string' schema with valid input", () => {
    const lexiconPartial = { type: "string" };
    const schema = parsers().string(lexiconPartial, options);
    const validInput = "some string";
    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should validate 'integer' schema with valid input", () => {
    const lexiconPartial = { type: "integer" };
    const schema = parsers().integer(lexiconPartial, options);
    const validInput = 42;
    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should validate 'boolean' schema with valid input", () => {
    const lexiconPartial = { type: "boolean" };
    const schema = parsers().boolean(lexiconPartial, options);
    const validInput = true;
    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should validate 'blob' schema with valid input", () => {
    const lexiconPartial = {};
    const schema = parsers().blob(lexiconPartial, options);
    expect(() =>
      schema.parse({
        mimeType: "image/png",
        size: 123,
        ref: { $link: "some-link" },
      })
    ).not.toThrow();
  });

  it("should validate 'object' schema with valid input", () => {
    const lexiconPartial = {
      type: "object",
      properties: { name: { type: "string" }, age: { type: "integer" } },
    };
    const schema = parsers().object(lexiconPartial, options);
    const validInput = { name: "John", age: 30 };
    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should validate 'union' schema with valid input (following refs)", () => {
    const lexiconPartial = {
      type: "union",
      refs: [
        "com.atproto.label.subscribeLabels#labels",
        "com.atproto.label.subscribeLabels#info",
      ],
    };
    const schema = parsers().union(lexiconPartial, options);
    const validInput = { label: "urgent", test: "test" };
    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should validate 'ref' schema with valid input (following refs)", () => {
    const lexiconPartial = {
      type: "ref",
      ref: "com.atproto.label.subscribeLabels#labels",
    };
    const schema = parsers().ref(lexiconPartial, options);
    const validInput = { label: "urgent", test: "test" };
    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should validate 'null' schema with valid input", () => {
    const lexiconPartial = {};
    const schema = parsers().null(lexiconPartial, options);
    const validInput = null;
    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should validate 'bytes' schema with valid input", () => {
    const lexiconPartial = {};
    const schema = parsers().bytes(lexiconPartial, options);
    expect(() => schema.parse({ $bytes: "Qm1234abcd" })).not.toThrow();
  });

  it("should validate 'unknown' schema with valid input", () => {
    const lexiconPartial = { type: "unknown" };
    const schema = parsers().unknown(lexiconPartial, options);
    const validInput = "any type";
    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should validate 'cid-link' schema with valid input", () => {
    const lexiconPartial = {};
    const schema = parsers()["cid-link"](lexiconPartial, options);
    const validInput = { $link: "someLink" };
    expect(() => schema.parse(validInput)).not.toThrow();
  });
});
