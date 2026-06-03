<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $inventory = \App\Models\Inventory::with('product')->paginate(20);
        return view('admin.inventory.index', compact('inventory'));
    }
}