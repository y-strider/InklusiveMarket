<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RequireSeller
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user || !$user->isSeller()) {
            return redirect()->route('dashboard')
                ->withErrors(['role' => 'Seller access required.']);
        }

        return $next($request);
    }
}
