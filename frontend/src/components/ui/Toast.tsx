'use client';

import { Fragment, useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useIsMounted } from '../../lib/hooks/useIsMounted'

const icons = {
  success: <CheckCircleIcon className="h-6 w-6 text-success-500" />,
  error: <ExclamationCircleIcon className="h-6 w-6 text-error-500" />,
  info: <InformationCircleIcon className="h-6 w-6 text-primary-400" />,
}

export type ToastType = keyof typeof icons

interface ToastProps {
  show: boolean
  type?: ToastType
  title: string
  message?: string
  onClose: () => void
}

export function Toast({ show, type = 'info', title, message, onClose }: ToastProps) {
  const isMounted = useIsMounted()
  const [isVisible, setIsVisible] = useState(false) // Start as hidden to prevent hydration mismatch

  useEffect(() => {
    if (isMounted) {
      setIsVisible(show)
      if (show) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          onClose()
        }, 5000)
        return () => clearTimeout(timer)
      }
    }
  }, [show, onClose, isMounted])

  // Don't render anything during SSR or before hydration
  if (!isMounted) {
    return null
  }

  return (
    <Transition
      show={isVisible}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-[-1rem] opacity-0"
      enterTo="translate-y-0 opacity-100"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="max-w-sm w-full rounded-lg pointer-events-auto shadow-strong border border-border bg-background">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">{icons[type]}</div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                {message && (
                  <p className="mt-1 text-sm text-muted-foreground">{message}</p>
                )}
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  className="inline-flex rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                  onClick={() => {
                    setIsVisible(false)
                    onClose()
                  }}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-4 py-6"
    >
      <div className="flex w-full flex-col items-center space-y-4">
        {children}
      </div>
    </div>
  )
}