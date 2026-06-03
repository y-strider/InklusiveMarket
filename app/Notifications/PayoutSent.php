<?php

namespace App\Notifications;

use App\Models\Payout;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PayoutSent extends Notification
{
    use Queueable;

    public function __construct(public Payout $payout) {}

    public function via($notifiable): array
    {
        return ['database','mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'payout.sent',
            'payoutulid' => $this->payout->ulid,
            'amount' => $this->payout->amount,
            'message' => 'Payout of $'.$this->payout->amountInDollars().' has been processed.',
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Payout Processed — $'.$this->payout->amountInDollars())
            ->greeting('Your payout is on its way!')
            ->line('A payout of $'.$this->payout->amountInDollars().' has been sent to your Stripe account.')
            ->action('View Payouts', route('seller.payouts'));
    }
}
