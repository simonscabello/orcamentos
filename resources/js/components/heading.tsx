/** Título de seção usado dentro das páginas (abaixo do título da página). */
export default function Heading({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <header>
            <h2 className="text-foreground text-base font-semibold">{title}</h2>
            {description && (
                <p className="text-muted-foreground mt-0.5 text-sm">
                    {description}
                </p>
            )}
        </header>
    );
}
