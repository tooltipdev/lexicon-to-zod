# lexicon-to-zod

Convert [Lexicon](https://atproto.com/guides/lexicon) JSON to [Zod](https://zodjs.netlify.app/) schemas.

Review [types](https://github.com/tooltipdev/lexicon-to-zod/blob/main/src/types.ts) and [code](https://github.com/tooltipdev/lexicon-to-zod/tree/main/src) for information beyond this README.

## Installation

`npm i lexicon-to-zod`

## Basic Usage

### Parsing Full Lexicon Documents

You can generate a map of Zod schemas for a full Lexicon document via the `lexiconToZod` method.

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
      "input": { schema: {...} },
      "output": { schema: {...} },
    },
    "someOtherDef": {...}
  }
}
```

#### Output Zod Schema Map

```
{
  defs: {
    main: {
      input: { schema: z.object({...}) },
      output: { schema: z.object({...}) },
    },
    someOtherDef: z.object({...})
  }
}
```

### Parsing Lexicon Partials

You can generate Zod schemas for subsections of Lexicon documents by utilizing built-in type parsers. The output will be an individual Zod schema instead of a map of Zod schemas.

```
import { parsers } from "lexicon-to-zod";

const lexicon = {
  "lexicon": 1,
  "id": "com.atproto.some.cool.lexicon",
  "defs": {
    "main": {...},
    "someOtherDef": {
      "type": "object",
      "properties": {
        "foo": {
          "type": "string"
        }
      }
    }
  }
};

const { object: objectParser } = parsers();
const schema = objectParser(lexicon.defs.someOtherDef);

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
Schema generation can be modified via LexiconToZodOptions. These options will be discussed further in this README. The option [type definition](https://github.com/tooltipdev/lexicon-to-zod/blob/main/src/types.ts#L56) can be used as a reference.

## Managing refs

Some Lexicon types contain references to other Lexicon definitions, for example `ref` type values and `union.refs` values. In these cases, referenced Lexicons need to be gathered to fulfil schema generation, or a placeholder schema will be provided.

To enable Lexicon lookups you must set the `followRefs` option to `true`. A Lexicon dictionary _must_ be provided via the `lexiconDict` option for Lexicon reference lookup if `followRefs` is set to `true`.

`lexiconDict` must be in the format `{[NSID]: FullLexiconDocument}`.

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
const schemaMap = lexiconToZod(lexicon, {
  followRefs: true
  lexiconDict,
});

```

#### `ref` Type

If your Lexicon contains `ref` types you must set the `followRefs` option to `true` if you want them converted to Zod schemas. If the `followRefs` option is omitted, `ref` field types will be converted to `z.any()`.

#### Union types

If your Lexicon contains `union` types you must set the `followRefs` option to `true` if you want its subtypes converted to Zod schemas. If the `followRefs` option is omitted, `union` subtype schemas will be converted to `z.any()`.

### Circular References
If the Lexicon graph you are trying to convert contains circular references _your code will throw errors_. You will need to manage the circular reference with additional logic.

Consider writing your own type parsers or schemas using `z.lazy`.

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

## Type Handling

Each supported Lexicon type will be converted to a matching Zod schema type. You can utilize the `typeParserDict` option to override a type parser, or add an unsupported type parser.

```
import { lexiconToZod } from "lexicon-to-zod";

const lexicon = ...;
const typeParserDict = {
  string: () => {},
  someCustomType: () => {}
};

const schemaMap = lexiconToZod(lexicon, { typeParserDict });
```

`typeParserDict` should be of type `TypeParserMap`. Provided type parsers will have priority over the built-in parser dictionary.

Parser dictionary keys are inferred from Lexicon `type` values, so any unsupported types can be added to `typeParserDict`. When your type is encountered during schema generation your custom type parser will be invoked.

### $default Parser

If no parser can be matched to a Lexicon `type` value the `$default` type parser will be used. The included `$default` parser will simply return `z.any()`.

You can override `$default` via the `typeParserDict` option to provide your own custom implementation.

## Fine Tuning Schema Generation

`pathOptions` is an optional map that provides more granular control over Zod schema generation. It allows for functionality such as omitting Lexicon fields from schema output, or overriding schema generation with your own Zod schema.

Each key in the map is a dot-notated path pointing to the output schema field, and map values are of type `PathOptions`.

```
import { lexiconToZod } from "lexicon-to-zod";

const lexicon = {
  "lexicon": 1,
  "id": "com.atproto.some.cool.lexicon",
  "defs": {
    "main": {...},
    "someDef": {...}
    "someOtherDef": {...}
  }
};

const pathOptions = {
  "someDef.someProp: {
    "metadata": {...}, // arbitrary metadata attached to output schema
    "additionalProps": {...}, // additional properties for output 'object' schemas,
    "isOptional": true // force property to be optional
  },
  "someOtherDef.someProp: {
    "override": z.string() // override output schema
  }
  "someOtherDef.someOtherProp: {
    "override": null // omit Lexicon field from output schema
  }
};

const schemaMap = lexiconToZod(lexicon, { pathOptions });
```

### Special Field Paths

When writing dot-notated paths for targeting with `pathOptions` you need to use special path structures for certain types and subtypes.

| Target field type | Path structure           |
| ----------------- | ------------------------ |
| Array Elements    | `somePath.__array__`     |
| Union Subtypes    | `somePath.__union__.0-n` |

## Contributing

All contributions are appreciated. Fork the repo and open a pull request.

## Notes

- Review `src/types.ts` file for a better understanding of options.
- If you don't like the way a type parser works, override it with `typeParserDict`.
- If a type parser isn't supported, add it to `typeParserDict`.
- If a Lexicon is incomplete, or malformed, override some/all of its schema with `pathOptions`.
- Zod schemas are interoperable with many packages. For example, `shadcn` has form validation via `react-hook-form`. Think about creative ways of UI and code generation via schemas.
