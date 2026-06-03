<?php

namespace App\Services;

use App\Models\User;
use Stripe\Account;
use Stripe\AccountLink;
use Stripe\Stripe;

class SellerOnboardingService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function becomeSeller(User $user): void
    {
        $user->update(['is_seller' => true]);
        $user->assignRole('seller', auth()->id());
    }

    public function createStripeAccount(User $user): string
    {
        $account = Account::create([
            'type' => 'express',
            'email' => $user->email,
            'metadata' => ['user_ulid' => $user->ulid],
        ]);

        $user->update(['stripe_account_id' => $account->id]);

        return $account->id;
    }

    public function createOnboardingLink(User $user): string
    {
        if (!$user->stripe_account_id) {
            $this->createStripeAccount($user);
        }

        $link = AccountLink::create([
            'account' => $user->stripe_account_id,
            'refresh_url' => route('seller.settings'),
            'return_url' => route('seller.onboarding.return'),
            'type' => 'account_onboarding',
        ]);

        return $link->url;
    }

    public function completeOnboarding(User $user): void
    {
        $account = Account::retrieve($user->stripe_account_id);

        if ($account->details_submitted) {
            $user->update(['seller_onboarded_at' => now()]);
        }
    }
}
