import { describe, expect, it } from 'vitest';
import { shortUrlForms } from './shortUrl';

const templated = { short_code: 'abc123', template_slug: 'promo', domain: undefined };
const untemplated = { short_code: 'abc123', template_slug: undefined, domain: undefined };

describe('shortUrlForms', () => {
  it('uses the bare form on an own host, with the template form as the alternate', () => {
    expect(shortUrlForms(templated, 'https://link.example.com', ['link.example.com'])).toEqual({
      primary: 'https://link.example.com/abc123',
      alternate: 'https://link.example.com/promo/abc123',
    });
  });

  it('keeps the template form on a host the workspace does not own', () => {
    expect(shortUrlForms(templated, 'https://go.example.com', ['link.example.com'])).toEqual({
      primary: 'https://go.example.com/promo/abc123',
      alternate: null,
    });
  });

  it('keeps the template form when no own hosts are given', () => {
    expect(shortUrlForms(templated, 'https://link.example.com')).toEqual({
      primary: 'https://link.example.com/promo/abc123',
      alternate: null,
    });
  });

  it("prefers the link's own domain over the base origin", () => {
    expect(
      shortUrlForms({ ...templated, domain: 'link.example.com' }, 'https://go.example.com', ['link.example.com']),
    ).toEqual({ primary: 'https://link.example.com/abc123', alternate: 'https://link.example.com/promo/abc123' });
    expect(
      shortUrlForms({ ...templated, domain: 'go.example.com' }, 'https://link.example.com', ['link.example.com']),
    ).toEqual({ primary: 'https://go.example.com/promo/abc123', alternate: null });
  });

  it('has no alternate for a link without a template', () => {
    expect(shortUrlForms(untemplated, 'https://link.example.com', ['link.example.com'])).toEqual({
      primary: 'https://link.example.com/abc123',
      alternate: null,
    });
    expect(shortUrlForms(untemplated, 'https://go.example.com')).toEqual({
      primary: 'https://go.example.com/abc123',
      alternate: null,
    });
  });

  it('compares hosts case-insensitively and ignores a trailing slash on the origin', () => {
    expect(shortUrlForms(templated, 'https://Link.Example.com/', ['LINK.example.COM']).primary).toBe(
      'https://Link.Example.com/abc123',
    );
  });
});
