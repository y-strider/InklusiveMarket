<?php

return [
    'google' => [
        'clientid' => env('GOOGLECLIENTID'),
        'clientsecret' => env('GOOGLECLIENTSECRET'),
        'redirect' => env('GOOGLEREDIRECTURL'),
    ],
    'paymongo' => [
        'public' => env('PAYMONGOPUBLICKEY'),
        'secret' => env('PAYMONGOSECRETKEY'),
    ],
];