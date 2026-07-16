/**
 * Formats a numeric price into Indonesian Rupiah (Rp) currency format.
 * Removes decimal places and uses dot as the thousands separator.
 * Example: 50000 -> "Rp 50.000"
 */
export function formatRp(price: number): string {
  // Check if price is valid
  if (typeof price !== 'number' || isNaN(price)) {
    return 'Rp 0';
  }
  
  // Use id-ID locale to format as integer Rupiah
  const formatted = Math.round(price).toLocaleString('id-ID');
  return `Rp ${formatted}`;
}
