<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderCompleted extends Notification
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
            'type' => 'order.completed',
            'order_ulid' => $this->order->ulid,
            'title' => $this->order->title,
            'amount' => $this->order->sellerAmount(),
            'message' => "Order \"{$this->order->title}\" completed. Payout of \${$this->order->sellerAmount() / 100} initiated.",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Order Completed — Payout Initiated')
            ->greeting('Great news — your order is complete!')
            ->line("Order \"{$this->order->title}\" is complete.")
            ->line("Your payout of **\$" . number_format($this->order->sellerAmount() / 100, 2) . "** has been initiated.")
            ->action('View Payouts', route('seller.payouts'));
    }
}
