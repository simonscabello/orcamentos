import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';

import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

// oxfmt-ignore
type Props = {
    passwordRules: string;
} & ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Segurança" />

            <section className="space-y-6">
                <Heading
                    title="Alterar senha"
                    description="Use uma senha longa e difícil de adivinhar."
                />

                <Form
                    {...SecurityController.update.form()}
                    options={{ preserveScroll: true }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="border-border bg-card space-y-5 rounded-2xl border p-4 sm:p-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <Field
                                id="current_password"
                                label="Senha atual"
                                error={errors.current_password}
                            >
                                {(field) => (
                                    <PasswordInput
                                        {...field}
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        autoComplete="current-password"
                                        placeholder="Sua senha atual"
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
                                        ref={passwordInput}
                                        name="password"
                                        autoComplete="new-password"
                                        placeholder="Sua nova senha"
                                        passwordrules={props.passwordRules}
                                    />
                                )}
                            </Field>

                            <Field
                                id="password_confirmation"
                                label="Confirmar nova senha"
                                error={errors.password_confirmation}
                            >
                                {(field) => (
                                    <PasswordInput
                                        {...field}
                                        name="password_confirmation"
                                        autoComplete="new-password"
                                        placeholder="Repita a nova senha"
                                        passwordrules={props.passwordRules}
                                    />
                                )}
                            </Field>

                            <Button
                                type="submit"
                                size="lg"
                                loading={processing}
                                className="w-full sm:w-auto"
                                data-test="update-password-button"
                            >
                                {processing ? 'Salvando...' : 'Salvar senha'}
                            </Button>
                        </>
                    )}
                </Form>
            </section>

            <ManageTwoFactor
                canManageTwoFactor={props.canManageTwoFactor}
                requiresConfirmation={props.requiresConfirmation}
                twoFactorEnabled={props.twoFactorEnabled}
            />
        </>
    );
}
