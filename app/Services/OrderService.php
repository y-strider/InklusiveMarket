<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Order;
use App\Models\PlatformFee;
use App\Models\User;
use App\Notifications\OrderCancelled;
use App\Notifications\OrderCompleted;
use App\Notifications\OrderDelivered;
use App\Notifications\OrderDisputeOpened;
use App\Notifications\OrderPaid;
use App\Notifications\OrderPlaced;
use App\Notifications\OrderShipped;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(
        private PayoutService $payoutService,
    ) {}

    public function createFromListing(User $buyer, Listing $listing, array $shippingAddress, ?Coupon $coupon = null, ?Offer $offer = null): Order
    {
        $price = $offer ? $offer->amount : $listing->price;

        if ($coupon && $coupon->isValid()) {
            $discount = $coupon->discountFor($price);
            $price = max(0, $price - $discount);
        }

        return DB::transaction(function () use ($buyer, $listing, $shippingAddress, $coupon, $offer, $price) {
            $order = Order::create([
                'buyer_id' => $buyer->id,
                'seller_id' => $listing->seller_id,
                'listing_id' => $listing->id,
                'offer_id' => $offer?->id,
                'title' => $listing->title,
                'price' => $price,
                'currency' => $listing->currency,
                'quantity' => 1,
                'status' => Order::STATUS_PENDING,
                'shipping_address' => $shippingAddress,
            ]);

            PlatformFee::create([
                'order_id' => $order->id,
                'amount' => $order->platformFeeAmount(),
                'percentage' => 8.00,
            ]);

            if ($coupon && $coupon->isValid()) {
                $coupon->uses()->create(['user_id' => $buyer->id, 'order_id' => $order->id]);
                $coupon->increment('used_count');
            }

            $listing->seller->notify(new OrderPlaced($order));

            return $order;
        });
    }

    public function markPaid(Order $order, string $paymentIntentId): void
    {
        DB::transaction(function () use ($order, $paymentIntentId) {
            $order->update(['stripe_payment_intent_id' => $paymentIntentId]);
            $order->transitionTo(Order::STATUS_PAID, null, 'Payment confirmed via Stripe');
            $order->buyer->notify(new OrderPaid($order));
        });
    }

    public function markShipped(Order $order, string $trackingNumber, int $changedBy): void
    {
        DB::transaction(function () use ($order, $trackingNumber, $changedBy) {
            $order->update(['tracking_number' => $trackingNumber, 'shipped_at' => now()]);
            $order->transitionTo(Order::STATUS_SHIPPED, $changedBy, 'Order shipped');
            $order->buyer->notify(new OrderShipped($order));
        });
    }

    public function markDelivered(Order $order, int $changedBy): void
    {
        DB::transaction(function () use ($order, $changedBy) {
            $order->update(['delivered_at' => now()]);
            $order->transitionTo(Order::STATUS_DELIVERED, $changedBy, 'Order delivered');
            $order->buyer->notify(new OrderDelivered($order));
        });
    }

    public function markCompleted(Order $order, int $changedBy): void
    {
        DB::transaction(function () use ($order, $changedBy) {
            $order->update(['completed_at' => now()]);
            $order->transitionTo(Order::STATUS_COMPLETED, $changedBy, 'Order completed');
            $order->listing->update(['status' => 'sold']);
            $order->seller->notify(new OrderCompleted($order));
            $this->payoutService->createForOrder($order);
        });
    }

    public function cancel(Order $order, int $changedBy, string $reason): void
    {
        DB::transaction(function () use ($order, $changedBy, $reason) {
            $order->update(['cancelled_at' => now(), 'cancellation_reason' => $reason]);
            $order->transitionTo(Order::STATUS_CANCELLED, $changedBy, $reason);
            $order->buyer->notify(new OrderCancelled($order));
            $order->seller->notify(new OrderCancelled($order));
        });
    }

    public function openDispute(Order $order): void
    {
        $order->transitionTo(Order::STATUS_DISPUTED);
        $order->seller->notify(new OrderDisputeOpened($order));
    }
}
