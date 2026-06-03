<?php

namespace App\Notifications;

use App\Models\Offer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OfferAccepted extends Notification
{
    use Queueable;

    public function __construct(public Offer $offer)
    {
    }

    public function via($notifiable): array
    {
        return ['database','mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'offer.accepted',
            'offerulid' => $this->offer->ulid,
            'listingtitle' => $this->offer->listing->title,
            'amount' => $this->offer->amount,
            'message' => 'Your offer of $'.$this->offer->amountInDollars().' was accepted!',
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Offer Accepted — '.$this->offer->listing->title)
            ->greeting('Your offer was accepted!')
            ->line('The seller accepted your offer of $'.$this->offer->amountInDollars().' for "'.$this->offer->listing->title.'".')
            ->action('Complete Purchase', route('checkout', $this->offer->listing->slug));
    }
}
