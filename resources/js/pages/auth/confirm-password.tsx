import { Form, Head } from '@inertiajs/react';

import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirmar senha" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <Field
                            id="password"
                            label="Senha"
                            error={errors.password}
                        >
                            {(field) => (
                                <PasswordInput
                                    {...field}
                                    name="password"
                                    placeholder="Sua senha"
                                    autoComplete="current-password"
                                    autoFocus
                                />
                            )}
                        </Field>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            loading={processing}
                            data-test="confirm-password-button"
                        >
                            {processing ? 'Confirmando...' : 'Confirmar senha'}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirmar senha',
    description: 'Confirme sua senha para continuar.',
};
