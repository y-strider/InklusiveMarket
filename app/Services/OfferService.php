<?php

namespace App\Services;

use App\Models\Listing;
use App\Models\Offer;
use App\Models\User;
use App\Notifications\OfferAccepted;
use App\Notifications\OfferCountered;
use App\Notifications\OfferDeclined;
use App\Notifications\OfferReceived;
use Illuminate\Support\Facades\DB;

class OfferService
{
    public function create(User $buyer, Listing $listing, int $amountCents, ?string $message = null): Offer
    {
        // Enforce one pending offer per buyer per listing
        Offer::where('listing_id', $listing->id)
            ->where('buyer_id', $buyer->id)
            ->where('status', Offer::STATUS_PENDING)
            ->update(['status' => Offer::STATUS_WITHDRAWN]);

        $offer = Offer::create([
            'listing_id' => $listing->id,
            'buyer_id' => $buyer->id,
            'seller_id' => $listing->seller_id,
            'amount' => $amountCents,
            'message' => $message,
            'status' => Offer::STATUS_PENDING,
        ]);

        $listing->seller->notify(new OfferReceived($offer));

        return $offer;
    }

    public function accept(Offer $offer, User $seller): Offer
    {
        return DB::transaction(function () use ($offer, $seller) {
            $offer->update(['status' => Offer::STATUS_ACCEPTED, 'responded_at' => now()]);

            // Lock listing quantity
            $offer->listing->decrement('quantity');
            if ($offer->listing->quantity <= 0) {
                $offer->listing->update(['status' => 'sold']);
            }

            $offer->buyer->notify(new OfferAccepted($offer));

            return $offer;
        });
    }

    public function decline(Offer $offer, User $seller): Offer
    {
        $offer->update(['status' => Offer::STATUS_DECLINED, 'responded_at' => now()]);
        $offer->buyer->notify(new OfferDeclined($offer));
        return $offer;
    }

    public function counter(Offer $parentOffer, User $seller, int $counterAmountCents, ?string $message = null): Offer
    {
        $parentOffer->update(['status' => Offer::STATUS_COUNTERED, 'responded_at' => now()]);

        $counter = Offer::create([
            'listing_id' => $parentOffer->listing_id,
            'buyer_id' => $parentOffer->buyer_id,
            'seller_id' => $seller->id,
            'amount' => $counterAmountCents,
            'message' => $message,
            'status' => Offer::STATUS_PENDING,
            'parent_offer_id' => $parentOffer->id,
        ]);

        $parentOffer->buyer->notify(new OfferCountered($counter));

        return $counter;
    }

    public function expireStale(): int
    {
        return Offer::where('status', Offer::STATUS_PENDING)
            ->where('expires_at', '<', now())
            ->update(['status' => Offer::STATUS_EXPIRED]);
    }
}
