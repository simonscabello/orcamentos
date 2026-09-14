import { Link, router, usePage } from '@inertiajs/react';
import {
    CarFront,
    ClipboardList,
    LoaderCircle,
    LogOut,
    Settings,
    Users,
} from 'lucide-react';
import { useState, type PropsWithChildren } from 'react';

const items = [
    { label: 'Orçamentos', href: '/dashboard', icon: ClipboardList },
    { label: 'Clientes', href: '/customers', icon: Users },
    { label: 'Configurações', href: '/settings/business', icon: Settings },
];

export default function MobileShell({ children }: PropsWithChildren) {
    const { url } = usePage();
    const [loggingOut, setLoggingOut] = useState(false);

    const logout = () => {
        setLoggingOut(true);
        router.post('/logout', {}, { onFinish: () => setLoggingOut(false) });
    };

    return (
        <div className="min-h-dvh bg-stone-50 pb-24 text-stone-900">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 font-bold"
                >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-orange-600 text-white">
                        <CarFront className="size-5" />
                    </span>
                    Orçamentos
                </Link>
                <button
                    onClick={logout}
                    disabled={loggingOut}
                    aria-label="Sair"
                    className="flex size-11 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-60"
                >
                    {loggingOut ? (
                        <LoaderCircle className="size-5 animate-spin" />
                    ) : (
                        <LogOut className="size-5" />
                    )}
                </button>
            </header>
            <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
                {children}
            </main>
            <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]">
                {items.map(({ label, href, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${url.startsWith(href) || (href === '/dashboard' && url === '/dashboard') ? 'text-orange-600' : 'text-stone-500'}`}
                    >
                        <Icon className="size-5" />
                        {label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
