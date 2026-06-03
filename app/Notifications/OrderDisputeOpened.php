<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderDisputeOpened extends Notification
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via($notifiable): array
    {
        return ['database','mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'order.disputed',
            'orderulid' => $this->order->ulid,
            'title' => $this->order->title,
            'message' => "A dispute has been opened for order \"{$this->order->title}\".",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Dispute Opened — '.$this->order->title)
            ->greeting('A dispute has been filed.')
            ->line('Order "'.$this->order->title.'" is now under dispute.')
            ->line('Please respond to the dispute as soon as possible.')
            ->action('View Dispute', route('orders.show', $this->order->ulid));
    }
}
