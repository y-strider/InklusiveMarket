<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reportable_type' => 'required|in:listing,review,user',
            'reportable_id' => 'required|integer',
            'reason' => 'required|in:spam,fraud,inappropriate,counterfeit,harassment,other',
            'body' => 'nullable|string|max:1000',
        ]);

        $typeMap = [
            'listing' => \App\Models\Listing::class,
            'review' => \App\Models\Review::class,
            'user' => \App\Models\User::class,
        ];

        $report = Report::create([
            'reporter_id' => $request->user()->id,
            'reportable_type' => $typeMap[$validated['reportable_type']],
            'reportable_id' => $validated['reportable_id'],
            'reason' => $validated['reason'],
            'body' => $validated['body'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Report submitted.', 'ulid' => $report->ulid], 201);
    }
}
