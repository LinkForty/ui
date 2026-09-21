/**
 * The short-link domain used when a workspace has no verified default custom
 * domain of its own.
 *
 * ## Why this is duplicated
 *
 * `@linkforty/ui` is published independently and cannot import from the app that
 * consumes it, so a consuming app that needs the same value keeps its own copy.
 * That duplication is deliberate but it is also the obvious way for the two to
 * drift, so the consumer should assert they are equal in a test. Change one and
 * the other fails.
 *
 * ## This is not the CNAME target
 *
 * Customers point their own domains at `go.linkforty.com` via CNAME, and the
 * setup instructions name it separately. The two values happen to be identical
 * today and are not the same thing: moving the default short domain must not move
 * the target every existing customer's DNS already points at.
 */
export const DEFAULT_SHORTLINK_DOMAIN = 'go.linkforty.com';

/** The same value as an origin, for building a short URL. */
export const DEFAULT_SHORTLINK_ORIGIN = `https://${DEFAULT_SHORTLINK_DOMAIN}`;
