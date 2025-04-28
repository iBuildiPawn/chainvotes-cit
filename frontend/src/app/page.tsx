'use client';

import Link from 'next/link';
import { WalletConnect } from '@/components/ui/WalletConnect';
import { useAccount } from 'wagmi';

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              ChainVotes: Secure Voting Platform on Ethereum L2
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Create and manage secure, transparent voting campaigns using blockchain technology.
              ChainVotes empowers organizations with decentralized, tamper-proof election systems.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-y-6">
              {isConnected ? (
                <Link
                  href="/dashboard"
                  className="rounded-md bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all"
                >
                  Launch App
                </Link>
              ) : (
                <div className="w-full max-w-xs">
                  <WalletConnect className="w-full py-3 text-lg" />
                </div>
              )}
              <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900 mt-2">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div id="features" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Blockchain Powered</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose ChainVotes?
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform combines the security of blockchain with a user-friendly interface to deliver 
              a voting system that's both trustworthy and easy to use.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Transparent & Tamper-Proof
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  All votes are recorded on the blockchain, creating an immutable record that can be verified by anyone without compromising voter privacy.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  Secure & Decentralized
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Our system eliminates single points of failure. Every vote is encrypted and the decentralized architecture prevents manipulation.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
