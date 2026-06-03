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
        return ['database','mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'order.cancelled',
            'orderulid' => $this->order->ulid,
            'title' => $this->order->title,
            'reason' => $this->order->cancellationreason,
            'message' => "Order \"{$this->order->title}\" was cancelled.",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Order Cancelled — '.$this->order->title)
            ->greeting('Order Cancelled')
            ->line('Order "'.$this->order->title.'" has been cancelled.')
            ->action('View Order', route('orders.show', $this->order->ulid));
        if ($this->order->cancellationreason) {
            $mail->line('Reason: '.$this->order->cancellationreason);
        }
        return $mail;
    }
}
