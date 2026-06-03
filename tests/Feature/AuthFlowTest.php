<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_login()
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'testuser@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);
        $response->assertRedirect('/dashboard');

        $this->post('/logout');

        $response = $this->post('/login', [
            'email' => 'testuser@example.com',
            'password' => 'password',
        ]);
        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();
    }
}