import { toStringSchema } from '../src/parsers';
import { z } from 'zod';

describe('toStringSchema', () => {
  it('should convert to z.string()', () => {
    const lexiconPartial = {};
    const schema = toStringSchema(lexiconPartial);
    expect(schema).toBeInstanceOf(z.ZodString);
  });

  it('should enforce minLength if specified', () => {
    const lexiconPartial = { minLength: 5 };
    const schema = toStringSchema(lexiconPartial);
    expect(() => schema.parse('valid')).not.toThrow();
    expect(() => schema.parse('no')).toThrow();
  });

  it('should enforce maxLength if specified', () => {
    const lexiconPartial = { maxLength: 10 };
    const schema = toStringSchema(lexiconPartial);
    expect(() => schema.parse('valid')).not.toThrow();
    expect(() => schema.parse('this is too long')).toThrow();
  });

  it('should set default value if const is specified', () => {
    const lexiconPartial = { const: 'defaultValue' };
    const schema = toStringSchema(lexiconPartial);
    expect(() => schema.parse('defaultValue')).not.toThrow();
    expect(() => schema.parse('anotherValue')).toThrow();
  });
});
