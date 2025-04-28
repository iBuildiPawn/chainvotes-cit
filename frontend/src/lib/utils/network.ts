export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export function assertSepolia(chainId: number) {
  if (chainId !== 11155111) { // Sepolia chain ID
    throw new NetworkError('Please connect to the Sepolia testnet');
  }
}