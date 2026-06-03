<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class MessageReceived extends Notification
{
    use Queueable;

    public function __construct(public Message $message)
    {
    }

    public function via($notifiable): array
    {
        return ['database','mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'message.received',
            'conversationulid' => $this->message->conversation->ulid,
            'senderusername' => $this->message->sender->username,
            'preview' => Str::limit($this->message->body, 80),
            'message' => 'New message from '.$this->message->sender->displayname,
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Message from '.$this->message->sender->displayname)
            ->greeting('You have a new message!')
            ->line($this->message->sender->displayname.' says: "'.Str::limit($this->message->body, 100).'"')
            ->action('Reply', route('messages.show', $this->message->conversation->ulid));
    }
}
