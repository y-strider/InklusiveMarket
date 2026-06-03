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
        $user->update(['isseller' => true]);
        $user->assignRole('seller', auth()->id());
    }

    public function createStripeAccount(User $user): string
    {
        $account = Account::create([
            'type' => 'express',
            'email' => $user->email,
            'metadata' => ['userulid' => $user->ulid],
        ]);
        $user->update(['stripeaccountid' => $account->id]);
        return $account->id;
    }

    public function createOnboardingLink(User $user): string
    {
        if (!$user->stripeaccountid) {
            $this->createStripeAccount($user);
        }
        $link = AccountLink::create([
            'account' => $user->stripeaccountid,
            'refresh_url' => route('seller.settings'),
            'return_url' => route('seller.onboarding.return'),
            'type' => 'account_onboarding',
        ]);
        return $link->url;
    }

    public function completeOnboarding(User $user): void
    {
        $account = Account::retrieve($user->stripeaccountid);
        if ($account->details_submitted) {
            $user->update(['selleronboardedat' => now()]);
        }
    }
}
