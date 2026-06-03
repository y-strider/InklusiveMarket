<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('roles'));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:80',
            'bio' => 'nullable|string|max:500',
            'location' => 'nullable|string|max:100',
            'website_url' => 'nullable|url|max:255',
            'pronouns' => 'nullable|string|max:50',
            'username' => ['sometimes', 'string', 'max:32', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($validated);

        return response()->json($user->fresh('roles'));
    }
}
