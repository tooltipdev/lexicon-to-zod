# lexicon-to-zod

Runtime validation for ATProtocol Lexicons 🔎📜

## Overview

lexicon-to-zod is a fully extensible framework for generating [Zod](https://zodjs.netlify.app/) schemas for validating [ATProtocol](https://atproto.com/) [Lexicon](https://atproto.com/specs/lexicon) JSON.

- Validate Lexicon input, output, and records
- Validate full or partial Lexicon structures
- Automatically follow refs for Lexicon graph validation
- Customize schema generation at multiple levels

Review [types](https://github.com/tooltipdev/lexicon-to-zod/blob/main/src/types.ts) and [code](https://github.com/tooltipdev/lexicon-to-zod/tree/main/src) for information beyond this README.

## Installation

`npm i lexicon-to-zod`

## Basic Usage

### Parsing Full Lexicon Documents

You can generate a map of Zod schemas for a full Lexicon document via the exported `lexiconToZod` method. Each entry in the `defs` dictionary will be converted to a Zod schema.

#### Example

```
import { lexiconToZod } from "lexicon-to-zod";

const lexicon = {
  "lexicon": 1,
  "id": "com.atproto.some.cool.lexicon",
  "defs": {
    "main": {
      "type": "procedure",
      "input": {...},
      "output": {...},
    },
    "someOtherDef": {...}
  }
};

const schemaMap = lexiconToZod(lexicon);
```

#### Input Lexicon Document

```
{
  "lexicon": 1,
  "id": "com.atproto.some.cool.lexicon",
  "defs": {
    "main": {
      "type": "procedure",{...},
      "input": {
        "encoding: ...,
        "schema": {...}
      },
      "output": {
        "encoding: ...,
        "schema": {...}
      },
    },
    "someOtherDef": {
      "type": "object",
      "properties": {...}
    }
  }
}
```

#### Output Zod Schema Map

```
{
  defs: {
    main: {
      input: {
        encoding: z.literal(...),
        schema: z.object({...})
      },
      output: {
        encoding: z.literal(...),
        schema: z.object({...})
      },
    },
    someOtherDef: z.object({...})
  }
}
```

#### Validate Data

Each schema can be used to validate Lexicon JSON data. Review [Zod documentation](https://zod.dev/?id=basic-usage) for more information on schema usage and customization.

#### Example

```
import { lexiconToZod } from "lexicon-to-zod";

const lexicon = {
  "lexicon": 1,
  "id": "com.atproto.some.cool.lexicon",
  "defs": {
    "main": {
      "type": "procedure",
      "input": {...},
      "output": {...},
    },
    "user": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "email": {"type": "string"}
      }
    }
  }
};

const schemaMap = lexiconToZod(lexicon);
const userValidator = schemaMap.defs.user;

let results = userValidator.parse({
  "name": "John",
  "email": "john.username@gmail.com"
})

// prints {"name": "John", "email": "john.username@gmail.com"}
console.log(results)

// throws due to invalid type
results = userValidator.parse({
  "name": 123, // invalid type
  "email": "john.username@gmail.com"
});

/**
 * Or using safeParse.
 */

let safeParseResults = userValidator.safeParse({
  "name": "John",
  "email": "john.username@gmail.com"
})

// prints {"success": true, "data": {...}}
console.log(safeParseResults);

safeParseResults = userValidator.safeParse({
  "name": 123, // invalid type
  "email": "john.username@gmail.com"
})

// prints {"success": false, "error": ...}
console.log(safeParseResults);
```

### Parsing Lexicon Partials

You can generate Zod schemas for subsections of Lexicon documents by utilizing the built-in type parsers. The output will be an individual Zod schema instead of a map of Zod schemas.

#### Example

```
import { parsers } from "lexicon-to-zod";

const { object: objectParser } = parsers();
const lexiconPartial = {
  "type": "object",
  "properties": {
    "foo": {
      "type": "string"
    }
  }
};
const schema = objectParser(lexiconPartial);
const results = schema.parse({ "foo": "bar" })
```

#### Input Lexicon Partial

```
{
  "type": "object",
  "properties": {
    "foo": {
      "type": "string"
    }
  }
}
```

#### Output Zod Schema

```
z.object({
  foo: z.string()
})
```

## LexiconToZodOptions

Schema generation can be modified via LexiconToZodOptions. These options will be mentioned further in this README.

The [option type definition](https://github.com/tooltipdev/lexicon-to-zod/blob/main/src/types.ts#L56) should be used as a reference.

## Managing refs

Some Lexicon types contain references to other Lexicon definitions, for example `ref` values and `union.refs` values. In these cases, referenced Lexicons need to be gathered to fulfil schema generation, otherwise a placeholder schema will be used.

- To enable Lexicon lookups you must set the `followRefs` option to `true`.
- A Lexicon dictionary _must_ be provided via the `lexiconDict` option for Lexicon reference lookup if `followRefs` is set to `true`.
- `lexiconDict` must be in the format `{[NSID]: FullLexiconDocument}`.

#### Example

```
import { lexiconToZod } from "lexicon-to-zod";

const lexiconDict = {
  "com.atproto.some.cool.lexicon": {
    main: {...},
    "someOtherDef": {
      "type": "ref",
      "ref": "lex:com.atproto.some.other.lexicon#someCoolDef"
    }
  },
  "com.atproto.some.other.lexicon": {
    main: {...},
    "someCoolDef": {...}
  },
};

const lexicon = lexiconDict["com.atproto.some.cool.lexicon"];

// Lexicon refs will resolve to proper Zod schemas.
const schemaMap = lexiconToZod(lexicon, {
  followRefs: true
  lexiconDict,
});
```

#### `ref` Type

If your Lexicon contains `ref` types you must set the `followRefs` option to `true` if you want them converted to Zod schemas. If the `followRefs` option is omitted, `ref` field types will be converted to `z.any()`.

#### Union types

If your Lexicon contains `union` types you must set the `followRefs` option to `true` if you want its subtypes converted to Zod schemas. If the `followRefs` option is omitted, `union` subtype schemas will be converted to `z.any()`.

#### Circular References

If the Lexicon graph you are trying to convert contains circular references _your code will throw errors_. You will need to manage the circular reference with additional logic.

- Consider writing your own type parsers or schemas using `z.lazy`.
- [Handling recursive references with Zod](https://zod.dev/?id=recursive-types)
- [Handling circular references with Zod](https://zod.dev/?id=cyclical-objects)

### SDK Lexicon Dictionary

You can pass the `@atproto/api` [Lexicon map](https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/lexicons.ts#L12) as `lexiconDict` to handle most standard behavior.

#### Install Dependency

`npm i @atproto/api`

#### Import built-in Lexicons

```
import { lexiconToZod } from "lexicon-to-zod";

// Import Lexicon dictionary.
import { schemaDict } from "@atproto/api/dist/client/lexicons";

// Convert dictionary keys to NSID format.
const lexiconDict: Record<string, any> =
  Object.values(schemaDict).reduce((acc, l) => ({[l.id]: l, ...acc}),  {});

const lexicon = lexiconDict["app.bsky.feed.post"];
const schemaMap = lexiconToZod(lexicon, { lexiconDict });
```

## Lexicon Type Handling

Each supported Lexicon type will be converted to a matching Zod schema type using a type specific type parser. You can utilize the `typeParserDict` option to override a type parser, or add an unsupported type parser.

#### Example

```
import { lexiconToZod } from "lexicon-to-zod";

const lexicon = ...;
const typeParserDict = {
  // will be used to generate schemas for `string` Lexicon fields
  string: () => {},
  // will be used to generate schemas for `someCustomType` Lexicon fields
  someCustomType: () => {}
};

const schemaMap = lexiconToZod(lexicon, { typeParserDict });
```

`typeParserDict` should be of type `TypeParserMap`. Provided type parsers will have priority over the built-in parser dictionary.

Type parser selection is based off of a Lexicon fields `type` value, so any unsupported Lexicon types can be added to `typeParserDict`. When the type is encountered during schema generation your custom type parser will be invoked.

### $default Parser

If no parser can be matched to a Lexicon `type` value the `$default` type parser will be used. The included `$default` parser will simply return `z.any()`.

You can override `$default` via the `typeParserDict` option to provide your own custom implementation.

## Fine Tuning Schema Generation

`pathOptions` is an optional map that provides more granular control over Zod schema generation at the individual Lexicon property/field level. It allows for functionality such as omitting Lexicon fields from schema input/output, or overriding schema generation for a single property with your own Zod schema.

- Each key in the map is a dot-notated path pointing to the output schema field.
- Map values are of type `PathOptions`.
- Dot notated paths are relative to the parser input structure.
  - `lexiconToZod` produces a map of schemas, one schema for each def (main, etc).
    - `pathOption` keys should include the leading path (ie `main.input.schema`, `someDef.someProp`).
  - Individual type parsers (object, array, string, etc) will produce no outer structure.
    - `pathOptions` keys should include no leading path (ie `someProp`).

#### Example

```
import { lexiconToZod, parsers } from "lexicon-to-zod";

const lexicon = {
  "lexicon": 1,
  "id": "com.atproto.some.cool.lexicon",
  "defs": {
    "main": {
      "type": "record",
      "record": {
        "type": "object",
        "properties: {...}
      }
    },
    "someDef": {
      "type": "object",
      "properties: {...}
    }
  }
};

const schemaMap = lexiconToZod(lexicon, {
  pathOptions: {
    "main.record.someProp: {
      "metadata": {...}, // arbitrary metadata attached to output schema
      "additionalProps": {...}, // additional properties for output 'object' schemas,
    },
    "main.record.someOtherProp: {
      "isOptional": true // apply ".isOptional()" to field
    },
    "someOtherDef.someProp: {
      "override": z.string() // override output schema
    },
    "someOtherDef.someOtherProp: {
      "override": null // omit Lexicon field from output schema
    }
  }
});

const schema = parsers().object(lexicon.defs.someDef, {
  "someProp: {
    "override": z.string() // override output schema
  },
  "someOtherProp: {
    "override": null // omit Lexicon field from output schema
  }
});
```

### Special Field Paths

You must use special path structures for certain types and subtypes when writing dot-notated paths for `pathOptions` .

| Target field type | Path structure           | Description                                |
| ----------------- | ------------------------ | ------------------------------------------ |
| Array Elements    | `somePath.__array__`     | Target Array element schema                |
| Union Subtypes    | `somePath.__union__.0-n` | Target Union subtype schema at index {0-n} |

## Contributing

All contributions are appreciated. Fork the repo and open a pull request.

## Notes

- Review [`src/types.ts`](https://github.com/tooltipdev/lexicon-to-zod/blob/main/src/types.ts) file for a better understanding of options.
- If you don't like the way a type parser works, override it with `typeParserDict`.
- If a type parser isn't supported, add it to `typeParserDict`.
- If a Lexicon is incomplete, or malformed, override some/all of its schema with `pathOptions`.
- Zod schemas are interoperable with many packages. For example, `shadcn` has form validation via `react-hook-form`. Think about creative ways of UI and code generation via schemas.
