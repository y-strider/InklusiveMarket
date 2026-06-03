<?php

namespace App\Http\Controllers;

use App\Services\CheckoutService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    protected CheckoutService $checkoutService;

    public function __construct(CheckoutService $checkoutService)
    {
        $this->checkoutService = $checkoutService;
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function handle(Request $request): Response
    {
        $payload = $request->getContent();
        $sig = $request->header('Stripe-Signature');
        $secret = config('services.stripe.webhook_secret', config('services.stripe.webhooksecret'));

        try {
            $event = Webhook::constructEvent($payload, $sig, (string) $secret);
        } catch (SignatureVerificationException $e) {
            return response('Invalid signature.', 400);
        }

        $this->checkoutService->handleWebhook($event->toArray());

        return response('OK', 200);
    }
}
