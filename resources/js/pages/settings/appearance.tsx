import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';

export default function Appearance() {
    return (
        <>
            <Head title="Aparência" />

            <section className="space-y-6">
                <Heading
                    title="Aparência"
                    description="Escolha como o sistema aparece no seu aparelho."
                />
                <div className="border-border bg-card rounded-2xl border p-4 sm:p-5">
                    <AppearanceTabs />
                </div>
            </section>
        </>
    );
}
