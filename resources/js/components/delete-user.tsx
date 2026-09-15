import { Form } from '@inertiajs/react';
import { useRef } from 'react';

import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <section className="space-y-6">
            <Heading
                title="Excluir conta"
                description="Exclua sua conta e todos os dados vinculados a ela."
            />

            <div className="border-destructive/25 bg-destructive-soft space-y-4 rounded-2xl border p-4 sm:p-5">
                <p className="text-foreground text-sm">
                    Orçamentos, clientes e veículos serão apagados
                    permanentemente. Esta ação não pode ser desfeita.
                </p>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            className="w-full sm:w-auto"
                            data-test="delete-user-button"
                        >
                            Excluir conta
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Excluir conta?</DialogTitle>
                            <DialogDescription>
                                Todos os dados da sua conta serão excluídos
                                permanentemente. Informe sua senha para
                                confirmar.
                            </DialogDescription>
                        </DialogHeader>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{ preserveScroll: true }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-5"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
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
                                                ref={passwordInput}
                                                placeholder="Sua senha"
                                                autoComplete="current-password"
                                            />
                                        )}
                                    </Field>

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    resetAndClearErrors()
                                                }
                                            >
                                                Cancelar
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            loading={processing}
                                            data-test="confirm-delete-user-button"
                                        >
                                            {processing
                                                ? 'Excluindo...'
                                                : 'Excluir conta'}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}
