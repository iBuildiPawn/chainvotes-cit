'use client';

import { useState, useEffect } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/lib/contracts/voting';

interface GasEstimatorProps {
  functionName: string;
  args: any[];
  isActive: boolean;
  onOptimize?: () => void;
}

export function GasEstimator({ functionName, args, isActive, onOptimize }: GasEstimatorProps) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ethUsdPrice, setEthUsdPrice] = useState<number | null>(null);
  
  // Function to fetch ETH price in USD
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthUsdPrice(data.ethereum.usd);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
      }
    };
    
    fetchEthPrice();
  }, []);
  
  // Estimate gas when args change
  useEffect(() => {
    if (!isActive || !publicClient || !address) return;
    
    const estimateGas = async () => {
      setIsEstimating(true);
      setError(null);
      
      try {
        // Get current gas price
        const gasPrice = await publicClient.getGasPrice();
        setGasPrice(gasPrice);
        
        // Estimate gas for the transaction
        const gasEstimate = await publicClient.estimateContractGas({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName,
          args,
          account: address
        });
        
        setGasEstimate(gasEstimate);
      } catch (error) {
        console.error('Gas estimation error:', error);
        setError('Could not estimate gas. This transaction might fail.');
      } finally {
        setIsEstimating(false);
      }
    };
    
    estimateGas();
  }, [publicClient, address, functionName, args, isActive]);
  
  // Calculate costs
  const gasCostInEth = gasEstimate && gasPrice 
    ? formatEther(gasEstimate * gasPrice)
    : null;
  
  const gasCostInUsd = gasCostInEth && ethUsdPrice 
    ? (parseFloat(gasCostInEth) * ethUsdPrice).toFixed(2)
    : null;
  
  // Gas optimization tips based on the function
  const getOptimizationTips = () => {
    switch (functionName) {
      case 'addPositions':
        return (
          <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
            <li>Consider adding fewer positions in a single transaction</li>
            <li>Keep position names and descriptions concise</li>
            <li>Try splitting positions into multiple transactions if needed</li>
          </ul>
        );
      case 'registerCandidatesBatch':
        return (
          <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
            <li>Consider adding fewer candidates in a single transaction</li>
            <li>Keep candidate metadata concise</li>
            <li>Minimize image URL length when possible</li>
          </ul>
        );
      default:
        return null;
    }
  };
  
  if (!isActive) return null;
  
  return (
    <div className="rounded-md bg-muted/50 border border-border p-3 my-4">
      <div className="flex items-start">
        <InformationCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-foreground">Transaction Cost Estimate</h4>
          
          {isEstimating ? (
            <p className="text-xs text-muted-foreground mt-1">Estimating transaction cost...</p>
          ) : error ? (
            <div>
              <p className="text-xs text-error mt-1">{error}</p>
              {getOptimizationTips()}
            </div>
          ) : (
            <div>
              {gasEstimate && gasPrice && (
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Estimated gas: <span className="font-mono">{gasEstimate.toString()}</span> units
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cost: <span className="font-medium text-foreground">{gasCostInEth}</span> ETH
                    {gasCostInUsd && (
                      <span className="ml-1 text-muted-foreground">
                        (≈${gasCostInUsd})
                      </span>
                    )}
                  </p>
                  
                  {getOptimizationTips()}
                </div>
              )}
              
              {onOptimize && (
                <button
                  type="button"
                  onClick={onOptimize}
                  className="mt-3 text-xs font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  Optimize for lower gas costs
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}