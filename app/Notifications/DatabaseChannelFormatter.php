<?php

namespace App\Notifications;

class DatabaseChannelFormatter
{
    public static function moneyCentsToDollars(int $cents): string
    {
        return numberformat($cents / 100, 2);
    }
}
