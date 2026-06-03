
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
        return ['database', 'mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'review.received',
            'review_ulid' => $this->review->ulid,
            'rating' => $this->review->rating,
            'reviewer_username' => $this->review->reviewer->username,
            'listing_title' => $this->review->listing->title,
            'message' => "{$this->review->reviewer->display_name} left a {$this->review->rating}-star review.",
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Review — ' . $this->review->listing->title)
            ->greeting('You received a new review!')
            ->line("{$this->review->reviewer->display_name} gave you **{$this->review->rating} stars** for \"{$this->review->listing->title}\".")
            ->when($this->review->body, fn($m) => $m->line("\"{$this->review->body}\""))
            ->action('View Reviews', route('seller.reviews'));
    }
}
