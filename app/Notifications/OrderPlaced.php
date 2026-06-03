<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPlaced extends Notification
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'order.placed',
            'order_ulid' => $this->order->ulid,
            'title' => $this->order->title,
            'price' => $this->order->price,
            'buyer_username' => $this->order->buyer->username,
            'message' => "New order received for \"{$this->order->title}\"",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Order Received — ' . $this->order->title)
            ->greeting('You have a new order!')
            ->line("**{$this->order->buyer->display_name}** purchased \"{$this->order->title}\" for \${$this->order->priceInDollars()}.")
            ->action('View Order', route('seller.orders.show', $this->order->ulid))
            ->line('Please process this order promptly.');
    }
}
