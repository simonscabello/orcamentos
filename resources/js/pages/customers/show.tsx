import { Head, Link } from '@inertiajs/react';
import { CarFront, Pencil, Plus } from 'lucide-react';
type Vehicle = { id: number; model: string; plate?: string; color?: string };
type Customer = {
    id: number;
    name: string;
    phone?: string;
    vehicles: Vehicle[];
};
export default function CustomerShow({ customer }: { customer: Customer }) {
    return (
        <>
            <Head title={customer.name} />
            <div className="mb-5 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{customer.name}</h1>
                    <p className="text-stone-500">
                        {customer.phone || 'Sem telefone cadastrado'}
                    </p>
                </div>
                <Link
                    href={`/customers/${customer.id}/edit`}
                    aria-label="Editar cliente"
                    className="flex size-11 items-center justify-center rounded-lg text-orange-700"
                >
                    <Pencil />
                </Link>
            </div>
            <Link
                href={`/vehicles/create?customer_id=${customer.id}`}
                className="mb-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 font-bold text-white"
            >
                <Plus className="size-5" />
                Adicionar veículo
            </Link>
            <h2 className="mb-3 text-lg font-bold">Veículos</h2>
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                {customer.vehicles.length ? (
                    customer.vehicles.map((vehicle) => (
                        <div
                            className="flex items-center gap-3 border-b border-stone-100 p-4 last:border-0"
                            key={vehicle.id}
                        >
                            <CarFront className="text-orange-600" />
                            <div className="flex-1">
                                <p className="font-semibold">{vehicle.model}</p>
                                <p className="text-sm text-stone-500">
                                    {vehicle.plate || 'Sem placa'}
                                    {vehicle.color ? ` · ${vehicle.color}` : ''}
                                </p>
                            </div>
                            <Link
                                className="text-sm font-medium text-orange-700"
                                href={`/vehicles/${vehicle.id}/edit`}
                            >
                                Editar
                            </Link>
                        </div>
                    ))
                ) : (
                    <p className="p-6 text-center text-stone-500">
                        Cadastre o primeiro veículo.
                    </p>
                )}
            </div>
        </>
    );
}
