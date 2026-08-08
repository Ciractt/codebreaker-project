/**
 * Values both sides of the wire need. Deliberately free of 'server-only' —
 * lib/offers cannot be imported from a client component, and the countdown bar
 * has to know how long the window is to draw itself.
 */

/** How long a customer has once they activate an offer. */
export const REDEMPTION_WINDOW_MINUTES = 10;
