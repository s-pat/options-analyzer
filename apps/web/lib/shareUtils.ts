/**
 * Utilities for shareable option links.
 *
 * URLs use the OCC contract symbol as the slug:
 *   /share/AAPL250117C00190000
 *
 * OCC format: {SYMBOL}{YYMMDD}{C|P}{8-digit-strike-thousandths}
 * e.g. AAPL250117C00190000 → AAPL, Jan 17 2025, Call, $190.00
 */

export interface ParsedContract {
  symbol: string;
  optionType: 'call' | 'put';
  strike: number;
  expirationDate: Date;
  /** Unix timestamp in seconds */
  expirationTimestamp: number;
}

/**
 * Parse an OCC option contract symbol into its components.
 * Returns null if the symbol doesn't match the expected format.
 */
export function parseContractSymbol(contractSymbol: string): ParsedContract | null {
  // OCC: up to 6 alpha chars (symbol), 6 digits (YYMMDD), C or P, 8 digits (strike * 1000)
  const match = contractSymbol.toUpperCase().match(/^([A-Z.]{1,6})(\d{6})(C|P)(\d{8})$/);
  if (!match) return null;

  const [, symbol, dateStr, typeChar, strikeStr] = match;

  const year = 2000 + parseInt(dateStr.slice(0, 2), 10);
  const month = parseInt(dateStr.slice(2, 4), 10) - 1; // 0-indexed
  const day = parseInt(dateStr.slice(4, 6), 10);
  const expirationDate = new Date(year, month, day);

  return {
    symbol,
    optionType: typeChar === 'C' ? 'call' : 'put',
    strike: parseInt(strikeStr, 10) / 1000,
    expirationDate,
    expirationTimestamp: Math.floor(expirationDate.getTime() / 1000),
  };
}

/**
 * Build a full share URL for a contract symbol.
 * Falls back to a relative path on the server where window is unavailable.
 */
export function buildShareUrl(contractSymbol: string): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? 'https://optionslab.io';
  return `${origin}/share/${contractSymbol}`;
}
