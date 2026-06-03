<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MessageReceived extends Notification
{
    use Queueable;

    public function __construct(public Message $message) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'message.received',
            'conversation_ulid' => $this->message->conversation->ulid,
            'sender_username' => $this->message->sender->username,
            'preview' => \Str::limit($this->message->body, 80),
            'message' => "New message from {$this->message->sender->display_name}",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Message from ' . $this->message->sender->display_name)
            ->greeting('You have a new message!')
            ->line("{$this->message->sender->display_name} says: \"" . \Str::limit($this->message->body, 100) . "\"")
            ->action('Reply', route('messages.show', $this->message->conversation->ulid));
    }
}
