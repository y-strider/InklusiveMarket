<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPaid extends Notification
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
            'type' => 'order.paid',
            'orderulid' => $this->order->ulid,
            'title' => $this->order->title,
            'message' => "Payment confirmed for \"{$this->order->title}\"",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Payment Confirmed — '.$this->order->title)
            ->greeting('Your payment was received!')
            ->line('Your order for "'.$this->order->title.'" has been confirmed.')
            ->action('Track Order', route('orders.show', $this->order->ulid));
    }
}
