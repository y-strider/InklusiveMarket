<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderShipped extends Notification
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
            'type' => 'order.shipped',
            'orderulid' => $this->order->ulid,
            'title' => $this->order->title,
            'trackingnumber' => $this->order->trackingnumber,
            'message' => "Your order \"{$this->order->title}\" has shipped!",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your Order Has Shipped — '.$this->order->title)
            ->greeting('Your order is on its way!')
            ->line('Tracking number: '.$this->order->trackingnumber)
            ->action('View Order', route('orders.show', $this->order->ulid));
    }
}
