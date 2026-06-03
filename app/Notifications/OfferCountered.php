<?php

namespace App\Notifications;

use App\Models\Offer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OfferCountered extends Notification
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
            'type' => 'offer.countered',
            'offer_ulid' => $this->offer->ulid,
            'listing_title' => $this->offer->listing->title,
            'amount' => $this->offer->amount,
            'message' => "The seller countered with \${$this->offer->amountInDollars()} for \"{$this->offer->listing->title}\".",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Counter-Offer Received — ' . $this->offer->listing->title)
            ->greeting('The seller sent a counter-offer!')
            ->line("Counter-offer of **\${$this->offer->amountInDollars()}** for \"{$this->offer->listing->title}\".")
            ->action('View Offer', route('dashboard'));
    }
}
