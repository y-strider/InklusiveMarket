<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderDelivered extends Notification
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
            'type' => 'order.delivered',
            'orderulid' => $this->order->ulid,
            'title' => $this->order->title,
            'message' => "Your order \"{$this->order->title}\" has been delivered.",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Order Delivered — '.$this->order->title)
            ->greeting('Your order has arrived!')
            ->line('Your order "'.$this->order->title.'" has been marked as delivered.')
            ->line('Please leave a review for the seller.')
            ->action('Leave a Review', route('orders.show', $this->order->ulid));
    }
}
