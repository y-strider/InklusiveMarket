<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard()
    {
        $pending = \App\Models\Product::where('approval_status','pending')->count();
        $users = \App\Models\User::count();
        $orders = \App\Models\Order::count();
        return view('admin.dashboard', compact('pending','users','orders'));
    }
}
