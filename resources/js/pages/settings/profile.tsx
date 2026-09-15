import { Form, Head, Link, usePage } from '@inertiajs/react';

import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Perfil" />

            <section className="space-y-6">
                <Heading
                    title="Seu perfil"
                    description="Nome e e-mail usados para acessar o sistema."
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{ preserveScroll: true }}
                    className="border-border bg-card space-y-5 rounded-2xl border p-4 sm:p-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field id="name" label="Nome" error={errors.name}>
                                {(field) => (
                                    <Input
                                        {...field}
                                        name="name"
                                        defaultValue={auth.user.name}
                                        required
                                        autoComplete="name"
                                        placeholder="Seu nome"
                                    />
                                )}
                            </Field>

                            <Field
                                id="email"
                                label="E-mail"
                                error={errors.email}
                            >
                                {(field) => (
                                    <Input
                                        {...field}
                                        type="email"
                                        name="email"
                                        defaultValue={auth.user.email}
                                        required
                                        autoComplete="username"
                                        placeholder="voce@exemplo.com"
                                    />
                                )}
                            </Field>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div className="border-border bg-warning-soft/60 rounded-xl border p-3 text-sm">
                                        <p className="text-foreground">
                                            Seu e-mail ainda não foi verificado.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-primary font-semibold underline-offset-4 hover:underline"
                                            >
                                                Reenviar verificação
                                            </Link>
                                        </p>
                                        {status ===
                                            'verification-link-sent' && (
                                            <p className="text-success mt-2 font-medium">
                                                Enviamos um novo link de
                                                verificação para seu e-mail.
                                            </p>
                                        )}
                                    </div>
                                )}

                            <Button
                                type="submit"
                                size="lg"
                                loading={processing}
                                className="w-full sm:w-auto"
                                data-test="update-profile-button"
                            >
                                {processing ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </>
                    )}
                </Form>
            </section>

            <DeleteUser />
        </>
    );
}
