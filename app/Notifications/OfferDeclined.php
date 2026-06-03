<?php

namespace App\Notifications;

use App\Models\Offer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OfferDeclined extends Notification
{
    use Queueable;

    public function __construct(public Offer $offer) {}

    public function via($notifiable): array
    {
        return ['database','mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'offer.declined',
            'offerulid' => $this->offer->ulid,
            'listingtitle' => $this->offer->listing->title,
            'message' => 'Your offer for "'.$this->offer->listing->title.'" was declined.',
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Offer Declined — '.$this->offer->listing->title)
            ->greeting('Your offer was declined.')
            ->line('The seller declined your offer for "'.$this->offer->listing->title.'".')
            ->action('Browse Listings', route('browse'));
    }
}
