<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReportResolved extends Notification
{
    use Queueable;

    public function __construct(public Report $report) {}

    public function via($notifiable): array
    {
        return ['database','mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'report.resolved',
            'reportulid' => $this->report->ulid,
            'status' => $this->report->status,
            'message' => 'Your report has been '.$this->report->status.'.',
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Your Report Has Been Reviewed')
            ->greeting('Your report has been reviewed.')
            ->line('Status: '.$this->report->status)
            ->action('View Dashboard', route('dashboard'));
        if ($this->report->resolutionnote) {
            $mail->line('Note: '.$this->report->resolutionnote);
        }
        return $mail;
    }
}
