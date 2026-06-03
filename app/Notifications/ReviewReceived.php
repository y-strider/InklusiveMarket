<?php

namespace App\Notifications;

use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReviewReceived extends Notification
{
    use Queueable;

    public function __construct(public Review $review) {}

    public function via($notifiable): array
    {
        return ['database','mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'review.received',
            'reviewulid' => $this->review->ulid,
            'rating' => $this->review->rating,
            'reviewerusername' => $this->review->reviewer->username,
            'listingtitle' => $this->review->listing->title,
            'message' => $this->review->reviewer->displayname.' left a '.$this->review->rating.'-star review.',
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('New Review — '.$this->review->listing->title)
            ->greeting('You received a new review!')
            ->line($this->review->reviewer->displayname.' gave you '.$this->review->rating.' stars for "'.$this->review->listing->title.'".');
        if ($this->review->body) {
            $mail->line('"'.$this->review->body.'"');
        }
        $mail->action('View Reviews', route('seller.reviews'));
        return $mail;
    }
}
