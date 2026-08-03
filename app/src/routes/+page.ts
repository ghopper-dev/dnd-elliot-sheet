/**
 * The sheet has no server dependency yet — all state lives in localStorage — so
 * it prerenders to a static HTML file that the Node adapter serves directly.
 * That is what makes it loadable with no signal, which ROADMAP §2 calls a design
 * principle rather than a feature.
 *
 * ⚠ Remove this when accounts land: a prerendered page cannot be per-user.
 */
export const prerender = true;
