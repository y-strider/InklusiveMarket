<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderCancelled extends Notification
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
            'type' => 'order.cancelled',
            'order_ulid' => $this->order->ulid,
            'title' => $this->order->title,
            'reason' => $this->order->cancellation_reason,
            'message' => "Order \"{$this->order->title}\" was cancelled.",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Order Cancelled — ' . $this->order->title)
            ->greeting('Order Cancelled')
            ->line("Order \"{$this->order->title}\" has been cancelled.")
            ->when($this->order->cancellation_reason, fn($m) => $m->line("Reason: {$this->order->cancellation_reason}"))
            ->action('View Order', route('orders.show', $this->order->ulid));
    }
}
