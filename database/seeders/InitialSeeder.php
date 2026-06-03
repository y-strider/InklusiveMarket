<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class InitialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::factory()->create([
    'name' => 'AVRC Admin',
    'email' => 'admin@inclusive-market.test',
    'role' => 'admin',
    'email_verified_at' => now(),
    'password' => bcrypt('Admin123!'),
]);
$cats = ['Handwoven','Handicrafts','Decor','Recycled','Souvenirs','Gifts'];
foreach ($cats as $c) {
    \App\Models\Category::create([
        'name' => $c,
        'slug' => \Str::slug($c),
    ]);
}
    }
}
