<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class GoogleController extends Controller
{
    public function redirect()
    {
        return \Laravel\Socialite\Facades\Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        $googleUser = \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->user();
        $user = \App\Models\User::firstOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'name' => $googleUser->getName(),
                'password' => bcrypt(\Str::random(16)),
                'role' => 'buyer'
            ]
        );
        auth()->login($user, true);
        return redirect()->route('home');
    }
}
