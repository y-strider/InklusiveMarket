<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payout;
use App\Notifications\PayoutSent;

class PayoutService
{
    public function createForOrder(Order $order): Payout
    {
        $payout = Payout::create([
            'sellerid' => $order->sellerid,
            'orderid' => $order->id,
            'stripepayoutid' => $order->stripetransferid,
            'amount' => $order->sellerAmount(),
            'currency' => $order->currency,
            'status' => $order->stripetransferid ? 'paid' : 'pending',
            'paidat' => $order->stripetransferid ? now() : null,
        ]);
        if ($payout->status === 'paid') {
            $order->seller->notify(new PayoutSent($payout));
        }
        return $payout;
    }
}
