<?php

namespace Database\Seeders;

use App\Actions\CreateEstimate;
use App\Models\Business;
use App\Models\Customer;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Dados de demonstração para rodar a aplicação localmente.
 *
 * Como o cadastro público é desabilitado, este seeder cria a oficina, o usuário
 * de acesso e alguns orçamentos para navegar pelas telas. Os orçamentos passam
 * pela mesma ação usada pela aplicação, então numeração e total continuam
 * sendo calculados no servidor.
 */
class DemoSeeder extends Seeder
{
    public const EMAIL = 'demo@tratto.test';

    public const PASSWORD = 'demo123456';

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->warn('DemoSeeder ignorado: ambiente de produção.');

            return;
        }

        $business = Business::firstOrCreate(
            ['name' => 'Funilaria Boa Vista'],
            [
                'owner_name' => 'André Martins',
                'phone' => '27997168860',
                'document' => '23682756000128',
                'address' => 'Rua Campina Grande, 39 - Barcelona, Serra - ES',
            ],
        );

        User::firstOrCreate(
            ['email' => self::EMAIL],
            [
                'business_id' => $business->id,
                'name' => $business->owner_name,
                'password' => Hash::make(self::PASSWORD),
                'email_verified_at' => now(),
            ],
        );

        if ($business->estimates()->exists()) {
            $this->command?->info('Dados de demonstração já existem.');

            return;
        }

        $customers = [
            ['João da Silva', '27999998888', [['Toyota Corolla', 'QAF5G33', 'Prata']]],
            ['Maria Aparecida Souza', '27991234567', [['Fiat Strada', 'RDX4E88', 'Branco']]],
            ['Carlos Eduardo Nascimento', '2733334444', [
                ['Honda Civic', 'ABC1D23', 'Preto'],
                ['Volkswagen Gol', null, 'Vermelho'],
            ]],
        ];

        $vehicles = [];

        foreach ($customers as [$name, $phone, $customerVehicles]) {
            $customer = Customer::create([
                'business_id' => $business->id,
                'name' => $name,
                'phone' => $phone,
            ]);

            foreach ($customerVehicles as [$model, $plate, $color]) {
                $vehicles[] = Vehicle::create([
                    'business_id' => $business->id,
                    'customer_id' => $customer->id,
                    'model' => $model,
                    'plate' => $plate,
                    'color' => $color,
                ]);
            }
        }

        $estimates = [
            [0, 'sent', 'Orçamento válido por 7 dias.', [
                ['Funilaria da porta dianteira direita', 98000],
                ['Pintura e polimento do capô', 147000],
            ]],
            [1, 'draft', null, [
                ['Reparo do para-lama traseiro', 62000],
                ['Mão de obra', 45000],
            ]],
            [2, 'sent', 'Peças não inclusas neste valor.', [
                ['Troca do para-choque dianteiro', 120000],
                ['Alinhamento e balanceamento', 18000],
                ['Mão de obra', 60000],
            ]],
            [3, 'draft', null, [
                ['Polimento técnico completo', 35000],
            ]],
        ];

        foreach ($estimates as $index => [$vehicleIndex, $status, $notes, $items]) {
            $vehicle = $vehicles[$vehicleIndex];

            app(CreateEstimate::class)->handle($business, [
                'customer_id' => $vehicle->customer_id,
                'vehicle_id' => $vehicle->id,
                'date' => now()->subDays(count($estimates) - $index - 1)->toDateString(),
                'status' => $status,
                'notes' => $notes,
                'items' => array_map(
                    fn (array $item) => ['description' => $item[0], 'amount' => $item[1]],
                    $items,
                ),
            ]);
        }

        $this->command?->info(sprintf('Acesso de demonstração: %s / %s', self::EMAIL, self::PASSWORD));
    }
}
