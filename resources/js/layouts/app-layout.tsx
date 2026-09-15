import { Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { AppBrand } from '@/components/app-brand';
import { isNavItemActive, mainNavItems } from '@/components/app-nav';
import { cn } from '@/lib/utils';

function usePathname(): string {
    const { url } = usePage();

    return url.split('?')[0].split('#')[0] || '/';
}

export default function AppLayout({ children }: PropsWithChildren) {
    const pathname = usePathname();
    // O atalho do cabeçalho só aparece onde a página não tem CTA de criação.
    const showQuickAction =
        pathname !== '/dashboard' && !pathname.startsWith('/estimates');

    return (
        <div className="bg-background text-foreground min-h-dvh">
            <a
                href="#conteudo"
                className="focus:bg-card sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-md"
            >
                Ir para o conteúdo
            </a>

            {/* Navegação lateral — desktop */}
            <aside className="border-border bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r px-3 py-5 lg:flex">
                <AppBrand className="mb-6 px-2" />
                <nav
                    aria-label="Navegação principal"
                    className="flex flex-col gap-1"
                >
                    {mainNavItems.map((item) => {
                        const active = isNavItemActive(item, pathname);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-primary-soft text-primary-strong'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                )}
                            >
                                <item.icon
                                    className="size-5"
                                    aria-hidden="true"
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <Link
                    href="/estimates/create"
                    className="bg-primary text-primary-foreground hover:bg-primary-hover mt-6 flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-xs transition-colors"
                >
                    <Plus className="size-5" aria-hidden="true" />
                    Novo orçamento
                </Link>
            </aside>

            {/* Cabeçalho — mobile */}
            <header className="border-border bg-background/90 pt-safe sticky top-0 z-20 border-b backdrop-blur lg:hidden">
                <div className="flex h-14 items-center justify-between gap-3 px-4">
                    <AppBrand />
                    {showQuickAction && (
                        <Link
                            href="/estimates/create"
                            className="bg-primary text-primary-foreground active:bg-primary-hover flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors"
                        >
                            <Plus className="size-4" aria-hidden="true" />
                            Novo
                        </Link>
                    )}
                </div>
            </header>

            <div className="lg:pl-60">
                <main
                    id="conteudo"
                    className="mx-auto w-full max-w-3xl px-4 pt-5 pb-36 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
                >
                    {children}
                </main>
            </div>

            {/* Navegação inferior — mobile */}
            <nav
                aria-label="Navegação principal"
                className="border-border bg-card/95 pb-safe fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur lg:hidden"
            >
                <ul className="flex">
                    {mainNavItems.map((item) => {
                        const active = isNavItemActive(item, pathname);

                        return (
                            <li key={item.href} className="flex-1">
                                <Link
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                                        active
                                            ? 'text-primary'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            'size-5 transition-transform',
                                            active && 'scale-110',
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
