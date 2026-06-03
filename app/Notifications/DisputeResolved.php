<?php

namespace App\Notifications;

use App\Models\Dispute;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DisputeResolved extends Notification
{
    use Queueable;

    public function __construct(public Dispute $dispute) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'dispute.resolved',
            'dispute_ulid' => $this->dispute->ulid,
            'order_ulid' => $this->dispute->order->ulid,
            'resolution' => $this->dispute->resolution,
            'message' => 'Your dispute has been resolved.',
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Dispute Resolved — Order #' . $this->dispute->order->ulid)
            ->greeting('Your dispute has been resolved.')
            ->when($this->dispute->resolution, fn($m) => $m->line("Resolution: {$this->dispute->resolution}"))
            ->action('View Order', route('orders.show', $this->dispute->order->ulid));
    }
}
