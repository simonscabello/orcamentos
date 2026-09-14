<?php

namespace App\Console\Commands;

use App\Models\Business;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CreateBusinessCommand extends Command
{
    protected $signature = 'business:create
                            {--name= : Nome da oficina}
                            {--owner= : Nome do responsável}
                            {--email= : E-mail do usuário}
                            {--password= : Senha do usuário}';

    protected $description = 'Cria uma oficina e seu primeiro usuário';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Nome da oficina');
        $owner = $this->option('owner') ?: $this->ask('Nome do responsável');
        $email = $this->option('email') ?: $this->ask('E-mail do usuário');
        $password = $this->option('password') ?: $this->secret('Senha do usuário');

        $validator = Validator::make([
            'name' => $name,
            'owner' => $owner,
            'email' => $email,
            'password' => $password,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'owner' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        DB::transaction(function () use ($name, $owner, $email, $password): void {
            $business = Business::create(['name' => $name, 'owner_name' => $owner]);

            User::create([
                'business_id' => $business->id,
                'name' => $owner,
                'email' => $email,
                'password' => $password,
            ]);
        });

        $this->info("Oficina \"{$name}\" criada com sucesso.");

        return self::SUCCESS;
    }
}
