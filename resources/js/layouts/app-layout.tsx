import MobileShell from '@/components/mobile-shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <MobileShell>{children}</MobileShell>;
}
