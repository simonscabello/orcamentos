import type { LucideIcon } from 'lucide-react';
import { House, Settings, Users, Wrench } from 'lucide-react';

export type MainNavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    /** Prefixos de URL que também ativam este item. */
    match: string[];
    exact?: boolean;
};

export const mainNavItems: MainNavItem[] = [
    {
        label: 'Início',
        href: '/dashboard',
        icon: House,
        match: ['/dashboard'],
        exact: true,
    },
    {
        label: 'Orçamentos',
        href: '/estimates',
        icon: Wrench,
        match: ['/estimates'],
    },
    {
        label: 'Clientes',
        href: '/customers',
        icon: Users,
        match: ['/customers', '/vehicles'],
    },
    {
        label: 'Ajustes',
        href: '/settings/business',
        icon: Settings,
        match: ['/settings'],
    },
];

export function isNavItemActive(item: MainNavItem, pathname: string): boolean {
    if (item.exact) {
        return item.match.includes(pathname);
    }

    return item.match.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}
