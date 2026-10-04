import { router } from '@inertiajs/react';
import { useEffect } from 'react';

const MESSAGE =
    'Você tem alterações não salvas. Se sair agora, elas serão perdidas. Deseja sair mesmo assim?';

/**
 * Pede confirmação antes de sair de um formulário com alterações não salvas,
 * tanto em links do Inertia quanto ao fechar/recarregar a aba.
 * Envios do próprio formulário (POST/PUT) não são interceptados.
 */
export function useUnsavedChanges(isDirty: boolean): void {
    useEffect(() => {
        if (!isDirty) return;

        const removeBeforeListener = router.on('before', (event) => {
            if (event.detail.visit.method !== 'get') return;

            if (!window.confirm(MESSAGE)) {
                event.preventDefault();
            }
        });

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            // Necessário em navegadores mais antigos para exibir o aviso nativo.
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', onBeforeUnload);

        return () => {
            removeBeforeListener();
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [isDirty]);
}
