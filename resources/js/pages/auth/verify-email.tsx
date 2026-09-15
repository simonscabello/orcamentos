import { Form, Head } from '@inertiajs/react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Verificar e-mail" />

            {status === 'verification-link-sent' && (
                <p className="bg-success-soft text-success mb-5 rounded-xl px-4 py-3 text-center text-sm font-medium">
                    Enviamos um novo link de verificação para seu e-mail.
                </p>
            )}

            <Form {...send.form()} className="space-y-5 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            type="submit"
                            size="lg"
                            variant="outline"
                            className="w-full"
                            loading={processing}
                        >
                            {processing
                                ? 'Enviando...'
                                : 'Reenviar e-mail de verificação'}
                        </Button>

                        <TextLink
                            href={logout()}
                            className="text-muted-foreground mx-auto block text-sm"
                        >
                            Sair
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verificar e-mail',
    description: 'Acesse o link que enviamos para seu e-mail.',
};
