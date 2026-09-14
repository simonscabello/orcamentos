import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        const removeFlashListener = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (
                !data ||
                !['success', 'error', 'warning', 'info'].includes(data.type)
            ) {
                return;
            }

            toast[data.type](data.message);
        });

        const removeHttpExceptionListener = router.on(
            'httpException',
            (event) => {
                const status = event.detail.response.status;

                if (status >= 500) {
                    event.preventDefault();
                    toast.error(
                        'Não foi possível concluir a operação. Tente novamente.',
                    );
                }
            },
        );

        const removeNetworkErrorListener = router.on(
            'networkError',
            (event) => {
                event.preventDefault();
                toast.error(
                    'Não foi possível conectar ao sistema. Verifique sua internet e tente novamente.',
                );
            },
        );

        return () => {
            removeFlashListener();
            removeHttpExceptionListener();
            removeNetworkErrorListener();
        };
    }, []);
}
