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
        Offer::where('listingid', $listing->id)
            ->where('buyerid', $buyer->id)
            ->where('status', Offer::STATUSPENDING)
            ->update(['status' => Offer::STATUSWITHDRAWN]);
        $offer = Offer::create([
            'listingid' => $listing->id,
            'buyerid' => $buyer->id,
            'sellerid' => $listing->sellerid,
            'amount' => $amountCents,
            'message' => $message,
            'status' => Offer::STATUSPENDING,
        ]);
        $listing->seller->notify(new OfferReceived($offer));
        return $offer;
    }

    public function accept(Offer $offer, User $seller): Offer
    {
        return DB::transaction(function () use ($offer, $seller) {
            $offer->update(['status' => Offer::STATUSACCEPTED, 'respondedat' => now()]);
            $offer->listing()->lockForUpdate()->first();
            if ($offer->listing->quantity > 0) {
                $offer->listing->decrement('quantity');
                if ($offer->listing->fresh()->quantity <= 0) {
                    $offer->listing->update(['status' => 'sold']);
                }
            }
            $offer->buyer->notify(new OfferAccepted($offer));
            return $offer;
        });
    }

    public function decline(Offer $offer, User $seller): Offer
    {
        $offer->update(['status' => Offer::STATUSDECLINED, 'respondedat' => now()]);
        $offer->buyer->notify(new OfferDeclined($offer));
        return $offer;
    }

    public function counter(Offer $parentOffer, User $seller, int $counterAmountCents, ?string $message = null): Offer
    {
        $parentOffer->update(['status' => Offer::STATUSCOUNTERED, 'respondedat' => now()]);
        $counter = Offer::create([
            'listingid' => $parentOffer->listingid,
            'buyerid' => $parentOffer->buyerid,
            'sellerid' => $seller->id,
            'amount' => $counterAmountCents,
            'message' => $message,
            'status' => Offer::STATUSPENDING,
            'parentofferid' => $parentOffer->id,
        ]);
        $parentOffer->buyer->notify(new OfferCountered($counter));
        return $counter;
    }

    public function expireStale(): int
    {
        return Offer::where('status', Offer::STATUSPENDING)
            ->where('expiresat', '<', now())
            ->update(['status' => Offer::STATUSEXPIRED]);
    }
}
