import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { AppBrand } from '@/components/app-brand';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: ReactNode;
}) {
    const { tagline } = usePage().props;

    return (
        <div className="bg-background pt-safe text-foreground flex min-h-dvh flex-col px-4">
            <Head>
                <meta name="robots" content="noindex" />
            </Head>

            <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
                <div className="mb-8 flex flex-col items-center gap-4 text-center">
                    <AppBrand
                        size="lg"
                        asLink={false}
                        className="flex-col gap-3"
                    />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-muted-foreground mt-1 text-sm">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="border-border bg-card rounded-2xl border p-5 shadow-xs sm:p-6">
                    {children}
                </div>

                <p className="text-muted-foreground mt-8 text-center text-xs">
                    {tagline} · feito para usar no celular
                </p>
            </div>
        </div>
    );
}
