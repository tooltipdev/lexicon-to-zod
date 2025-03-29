# lexicon-to-zod

Convert Lexicon JSON to Zod schemas.

Review types/code for information beyond this README.

## Installation

`npm i lexicon-to-zod`

## Basic Usage

Pass a full Lexicon JSON definition to the default export.

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

The returned map will include Zod schemas for each `defs` entry from the provided Lexicon.

**Lexicon JSON**

```
{
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
}
```

**Output Schema Map**

```
{
  defs: {
    main: {
      input: z.object({...}),
      output: z.object({...}),
    },
    someOtherDef: z.object({...})
  }
}
```

## Managing refs

If your Lexicon contains `ref` types you must set the `followRefs` option to `true` if you want them converted to Zod schemas. Additionally, you must pass a Lexicon dictionary via the `lexiconDict` option for Lexicon lookup.

`lexiconDict` should be in the format `{[NSID]: FullLexiconDocument}`.

```
import { lexiconToZod } from "lexicon-to-zod";

const lexiconDict = {...};
const lexicon = lexiconDict["com.atproto.some.cool.lexicon"];
const schemaMap = lexiconToZod(lexicon, { lexiconDict });

```
If the Lexicon graph you are trying to convert contains circular references **your code will throw errors**.

You will need to manage the circular reference with additional logic, or consider writing your own type parsers or schemas using `z.lazy`.

### SDK Lexicon Dictionary

You can utilize the built-in `@atproto/api` Lexicons to handle most standard behavior.

**Install Dependency**

`npm i @atproto/api`

**Utilize built-in Lexicons**

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

Each supported Lexicon type will be converted to a matching Zod schema type.

**Lexicon Partial**

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

**lexicon-to-zod Output**

```
z.object({foo: z.string()})
```

You can utilize the `typeParserDict` option to override a type parser, or add an unsupported type parser.

```
import { lexiconToZod } from "lexicon-to-zod";

const lexicon = ...;
const typeParserDict = {
  string: () => {},
  someCustomType: () => {}
};

const schemaMap = lexiconToZod(lexicon, { typeParserDict });
```

`typeParserDict` should be of type `TypeParserMap`. Provided type parsers will has priority over the included parser dictionary.

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
    "main": {
      "type": "procedure",
      "input": {
      "schema": {
          "properties": {
            "foo": { "type": "string" }
          }
        }
      },
      "output": {...},
    },
    "someOtherDef": {...}
  }
};

const pathOptions = {
  "main.input.foo": {
    "isRequired": true, // force field to be required
    "override": z.number() // override deeply nested schema
  },
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

Do it.

Fork the repo and open a pull request.

## Notes

- Review `src/types.ts` file for a better understanding of options.
- If you don't like the way a type parser works, override it with `typeParserDict`.
- If a type parser isn't supported, add it to `typeParserDict`.
- If a Lexicon is incomplete, or malformed, override some/all of its schema with `pathOptions`.
- Zod schemas are interoperable with many packages. For example, `shadcn` has form validation via `react-hook-form`. Think about creative ways of UI and code generation via schemas.
