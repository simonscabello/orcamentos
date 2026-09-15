import { Form, Head } from '@inertiajs/react';

import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Redefinir senha" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <Field id="email" label="E-mail" error={errors.email}>
                            {(field) => (
                                <Input
                                    {...field}
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    readOnly
                                    className="bg-muted text-muted-foreground"
                                />
                            )}
                        </Field>

                        <Field
                            id="password"
                            label="Nova senha"
                            error={errors.password}
                        >
                            {(field) => (
                                <PasswordInput
                                    {...field}
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="Nova senha"
                                    passwordrules={passwordRules}
                                />
                            )}
                        </Field>

                        <Field
                            id="password_confirmation"
                            label="Confirmar senha"
                            error={errors.password_confirmation}
                        >
                            {(field) => (
                                <PasswordInput
                                    {...field}
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="Repita a nova senha"
                                    passwordrules={passwordRules}
                                />
                            )}
                        </Field>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            loading={processing}
                            data-test="reset-password-button"
                        >
                            {processing ? 'Salvando...' : 'Redefinir senha'}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Redefinir senha',
    description: 'Escolha uma nova senha para sua conta.',
};
