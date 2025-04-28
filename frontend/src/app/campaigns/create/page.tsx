'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { useWalletGuard } from '@/lib/hooks/useWalletGuard';
import { Dialog } from '@/components/ui/Dialog';
import { WalletConnect } from '@/components/ui/WalletConnect';
import CampaignWizard from '@/components/campaigns/CampaignWizard';

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

export default function CreateCampaign() {
  const router = useRouter();
  const { requireWallet } = useWalletGuard();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Use the wallet guard to ensure the user has connected their wallet
  const checkWallet = async () => {
    try {
      await requireWallet(() => {
        // Wallet is connected, nothing to do
      });
      return true;
    } catch (error) {
      setIsConnectModalOpen(true);
      return false;
    }
  };

  // Call checkWallet on page load
  useState(() => {
    checkWallet();
  });

  return (
    <div className="min-h-screen">
      <main className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
                Campaign Setup Wizard
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Follow the steps below to create and configure your voting campaign.
              </p>
            </div>
          </div>

          {/* Multi-step Wizard */}
          <CampaignWizard />
        </div>
      </main>

      {/* Connect Wallet Dialog */}
      <Dialog
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      >
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-card p-6">
          <h3 className="text-lg font-medium leading-6 text-foreground">Connect Wallet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You need to connect your wallet to create and manage campaigns.
          </p>
          <div className="mt-4">
            <WalletConnect />
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Toast notifications */}
      <ToastContainer>
        {toast.show && (
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            show={toast.show}
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
          />
        )}
      </ToastContainer>
    </div>
  );
}