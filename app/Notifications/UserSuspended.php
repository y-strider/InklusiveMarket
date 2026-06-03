<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserSuspended extends Notification
{
    use Queueable;

    public function __construct(public string $reason) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'user.suspended',
            'reason' => $this->reason,
            'message' => 'Your account has been suspended.',
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Account Suspended')
            ->greeting('Your account has been suspended.')
            ->line("Reason: {$this->reason}")
            ->line('If you believe this is an error, please contact support.');
    }
}
