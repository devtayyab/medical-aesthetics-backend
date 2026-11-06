/**
 * Launch feature flags. Off unless the build sets the env var to "true".
 *
 * VITE_FEATURE_GIFT_CARDS: gift card purchase/redeem for clients and the live
 *   admin Gift Cards module. Off = "coming soon" state everywhere.
 * VITE_FEATURE_LOYALTY: loyalty points / wallet shown to clients.
 *   Off = clients see no points or wallet.
 */
export const FEATURE_GIFT_CARDS = import.meta.env.VITE_FEATURE_GIFT_CARDS === 'true';
export const FEATURE_LOYALTY = import.meta.env.VITE_FEATURE_LOYALTY === 'true';
