<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\User;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class CheckoutService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function createPaymentIntent(User $buyer, Listing $listing, ?Coupon $coupon = null, ?Offer $offer = null): PaymentIntent
    {
        $price = $offer ? $offer->amount : $listing->price;
        if ($coupon && $coupon->isValid()) {
            $price = max(0, $price - $coupon->discountFor($price));
        }
        $platformFee = (int) round($price * 0.08);
        $sellerAccountId = $listing->seller->stripeaccountid;
        $params = [
            'amount' => $price,
            'currency' => strtolower($listing->currency),
            'customer' => $buyer->stripecustomerid ?: null,
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => [
                'listingulid' => $listing->ulid,
                'buyerulid' => $buyer->ulid,
                'sellerulid' => $listing->seller->ulid,
                'offerulid' => $offer?->ulid,
            ],
        ];
        if ($sellerAccountId) {
            $params['application_fee_amount'] = $platformFee;
            $params['transfer_data'] = ['destination' => $sellerAccountId];
        }
        return PaymentIntent::create($params);
    }

    public function handleWebhook(array $payload): void
    {
        $event = $payload['type'] ?? null;
        $data = $payload['data']['object'] ?? null;
        if ($event === 'payment_intent.succeeded' && $data) {
            $listingUlid = $data['metadata']['listingulid'] ?? null;
            if (!$listingUlid) return;
            $listing = \App\Models\Listing::where('ulid', $listingUlid)->first();
            if (!$listing) return;
            $order = \App\Models\Order::where('stripepaymentintentid', $data['id'])->first();
            if ($order) {
                app(OrderService::class)->markPaid($order, $data['id']);
            }
        }
    }
}
