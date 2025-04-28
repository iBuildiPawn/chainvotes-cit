'use client';

import React, { Fragment } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { useIsMounted } from '@/lib/hooks/useIsMounted';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, children }: DialogProps) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70" aria-hidden="true" />
        </Transition.Child>

        {/* Full-screen container to center the panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {/* The actual dialog panel */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            {/* Wrap children in a div to avoid passing props to a Fragment */}
            <div className="w-full max-w-md">
              {children}
            </div>
          </Transition.Child>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

Dialog.Title = HeadlessDialog.Title;
Dialog.Description = HeadlessDialog.Description;
Dialog.Panel = HeadlessDialog.Panel;