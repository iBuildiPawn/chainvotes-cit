/**
 * Truncates an Ethereum address to show only the first and last few characters
 * @param address The full Ethereum address
 * @param startLength Number of characters to show from the start (default: 6)
 * @param endLength Number of characters to show from the end (default: 4)
 * @returns The truncated address string
 */
export function truncateAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}