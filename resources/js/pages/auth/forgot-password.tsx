import { Form, Head } from '@inertiajs/react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Redefinir senha" />

            {status && (
                <p className="bg-success-soft text-success mb-5 rounded-xl px-4 py-3 text-center text-sm font-medium">
                    {status}
                </p>
            )}

            <Form {...email.form()} className="space-y-5">
                {({ processing, errors }) => (
                    <>
                        <Field id="email" label="E-mail" error={errors.email}>
                            {(field) => (
                                <Input
                                    {...field}
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    autoComplete="email"
                                    placeholder="voce@exemplo.com"
                                />
                            )}
                        </Field>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            loading={processing}
                            data-test="email-password-reset-link-button"
                        >
                            {processing ? 'Enviando...' : 'Enviar link'}
                        </Button>
                    </>
                )}
            </Form>

            <p className="text-muted-foreground mt-6 text-center text-sm">
                Lembrou a senha? <TextLink href={login()}>Entrar</TextLink>
            </p>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Esqueceu a senha?',
    description: 'Informe seu e-mail para receber o link de redefinição.',
};
