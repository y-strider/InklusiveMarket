<?php

namespace App\Notifications;

use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReviewReplied extends Notification
{
    use Queueable;

    public function __construct(public Review $review) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'review.replied',
            'review_ulid' => $this->review->ulid,
            'seller_username' => $this->review->reviewee->username,
            'message' => "The seller replied to your review of \"{$this->review->listing->title}\".",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Seller Replied to Your Review')
            ->greeting('The seller responded to your review.')
            ->line("\"{$this->review->seller_reply}\"")
            ->action('View Review', route('listings.show', $this->review->listing->slug));
    }
}
