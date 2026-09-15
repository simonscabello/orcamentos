import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { useAppearance } from '@/hooks/use-appearance';
import { useFlashToast } from '@/hooks/use-flash-toast';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-center"
            closeButton
            richColors
            duration={4000}
            offset={{ top: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
            mobileOffset={{
                top: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
                left: '0.75rem',
                right: '0.75rem',
            }}
            toastOptions={{
                classNames: {
                    toast: 'rounded-xl border shadow-lg',
                    title: 'text-sm font-semibold',
                    description: 'text-sm',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
