# lexicon-to-zod

Convert Lexicon JSON to Zod schemas.

## Installation

`npm i lexicon-to-zod`

## Basic Usage

Pass a Lexicon JSON definition.

```
import lexiconToZod from "lexicon-to-zod";

const schemaMap = lexiconToZod(lexicon);

```

The returned schema map will include Zod schemas for each `defs` entry from the provided Lexicon.

**Lexicon**

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

## Optional Lexicon Dictionary

If your Lexicon contains `ref` types you must pass a Lexicon dictionary via the `lexiconDict` option.

```
import lexiconToZod from "lexicon-to-zod";

const schemaMap = lexiconToZod(lexicon, { lexiconDict });

```

The dictionary should be in the format `{[NSID]: FullLexiconDocument}`.

### SDK Derived Dictionary

You can utilize the built-in `@atproto/api` Lexicons to handle most standard behavior.
`npm i --save-dev @atproto/api`

```
import lexiconToZod from "lexicon-to-zod";

// Import `@atproto/api` Lexicon schema dictionary.
import { schemaDict } from "@atproto/api/dist/client/lexicons";

// Convert `@atproto/api` map keys to NSID format.
const lexiconDict: Record<string, any> = Object.values(schemaDict).reduce(
  (acc, l) => ({ [l.id]: l, ...acc }),
  {}
);

// Select Lexicon from the `@atproto/api` Lexicon map.
const lexicon = lexiconDict["app.bsky.feed.post"];

// Pass `@atproto/api` map to `lexicon-to-zod`.
const schemaMap = lexiconToZod(lexicon, { lexiconDict });
```

## Type Handling

Each supported Lexicon type will be converted to a matching Zod schema type.

**Lexicon Partial**

```
{
    "type": "object",
    "properties": {
      "foo": { "type": "string" }
    }
}
```

**lexicon-to-zod Output**

```
z.object({foo: z.string()})
```

You can utilize the `typeParserDict` option to override a type parser, or add an unsupported type parser.

```
import lexiconToZod from "lexicon-to-zod";

const typeParserDict = {
    string: () => {},
    someCustomType: () => {}
};

const schemaMap = lexiconToZod(lexicon, { typeParserDict });
```

`typeParserDict` should be of type `LexiconTypeParserMap` and has priority over included parser dictionary.

Parser dictionary keys are inferred from Lexicon `type` values, so any unsupported types can be added via `typeParserDict`. When your type key is inferred your custom parser will automatically be invoked.
