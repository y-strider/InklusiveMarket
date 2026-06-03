<?php

namespace App\Notifications;

use App\Models\Offer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OfferReceived extends Notification
{
    use Queueable;

    public function __construct(public Offer $offer) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'offer.received',
            'offer_ulid' => $this->offer->ulid,
            'listing_title' => $this->offer->listing->title,
            'amount' => $this->offer->amount,
            'buyer_username' => $this->offer->buyer->username,
            'message' => "New offer of \${$this->offer->amountInDollars()} for \"{$this->offer->listing->title}\"",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Offer — ' . $this->offer->listing->title)
            ->greeting('You received an offer!')
            ->line("{$this->offer->buyer->display_name} offered **\${$this->offer->amountInDollars()}** for \"{$this->offer->listing->title}\".")
            ->action('Respond to Offer', route('seller.offers'));
    }
}
