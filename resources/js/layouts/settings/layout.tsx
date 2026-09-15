import { Link, router, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { useState, type PropsWithChildren } from 'react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

const tabs = [
    { label: 'Oficina', href: '/settings/business' },
    { label: 'Perfil', href: '/settings/profile' },
    { label: 'Segurança', href: '/settings/security' },
    { label: 'Aparência', href: '/settings/appearance' },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { url } = usePage();
    const pathname = url.split('?')[0];
    const [loggingOut, setLoggingOut] = useState(false);

    const logout = () => {
        setLoggingOut(true);
        router.post('/logout', {}, { onFinish: () => setLoggingOut(false) });
    };

    return (
        <>
            <PageHeader
                title="Ajustes"
                description="Dados da oficina, conta e preferências."
            />

            <nav
                aria-label="Seções dos ajustes"
                className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            >
                <ul className="bg-muted flex w-max gap-1 rounded-xl p-1 sm:w-full">
                    {tabs.map((tab) => {
                        const active = pathname.startsWith(tab.href);

                        return (
                            <li key={tab.href} className="sm:flex-1">
                                <Link
                                    href={tab.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-card text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {tab.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="space-y-8">{children}</div>

            <div className="border-border mt-10 border-t pt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={logout}
                    loading={loggingOut}
                    className="w-full sm:w-auto"
                >
                    {!loggingOut && <LogOut aria-hidden="true" />}
                    Sair da conta
                </Button>
            </div>
        </>
    );
}
