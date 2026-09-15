import { Form, Head } from '@inertiajs/react';

import TextLink from '@/components/text-link';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Entrar" />

            {status && (
                <p className="bg-success-soft text-success mb-5 rounded-xl px-4 py-3 text-center text-sm font-medium">
                    {status}
                </p>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
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
                                    required
                                    autoFocus
                                    autoComplete="email"
                                    enterKeyHint="next"
                                    placeholder="voce@exemplo.com"
                                />
                            )}
                        </Field>

                        <Field
                            id="password"
                            label="Senha"
                            error={errors.password}
                        >
                            {(field) => (
                                <PasswordInput
                                    {...field}
                                    name="password"
                                    required
                                    autoComplete="current-password"
                                    enterKeyHint="go"
                                    placeholder="Sua senha"
                                />
                            )}
                        </Field>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    defaultChecked
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-muted-foreground text-sm font-normal"
                                >
                                    Lembrar de mim
                                </Label>
                            </div>
                            {canResetPassword && (
                                <TextLink
                                    href={request()}
                                    className="text-muted-foreground text-sm"
                                >
                                    Esqueceu a senha?
                                </TextLink>
                            )}
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            loading={processing}
                            data-test="login-button"
                        >
                            {processing ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Acesse sua conta',
    description: 'Entre para criar e enviar seus orçamentos.',
};
