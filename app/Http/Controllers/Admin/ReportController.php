<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function transactions(Request $request)
    {
        $transactions = \App\Models\Transaction::with('buyer')->orderByDesc('created_at')->paginate(20);
        return view('admin.reports.transactions', compact('transactions'));
    }

    public function sales(Request $request)
    {
        $sales = \App\Models\Transaction::selectRaw('DATE(created_at) as date, COUNT(*) as orders, SUM(amount) as total')
            ->groupByRaw('DATE(created_at)')
            ->orderByDesc('date')
            ->paginate(20);
        return view('admin.reports.sales', compact('sales'));
    }
}