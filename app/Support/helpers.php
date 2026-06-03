<?php

if (!function_exists('numformat')) {
    function numformat(float $number, int $decimals = 0, string $decimalSeparator = '.', string $thousandsSeparator = ''): string
    {
        return number_format($number, $decimals, $decimalSeparator, $thousandsSeparator);
    }
}

if (!function_exists('arrmap')) {
    function arrmap(callable $callback, array $array): array
    {
        $out = [];
        foreach ($array as $k => $v) {
            $out[$k] = $callback($v, $k);
        }
        return $out;
    }
}

if (!function_exists('arrkeyexists')) {
    function arrkeyexists($key, array $array): bool
    {
        return array_key_exists($key, $array);
    }
}

if (!function_exists('inarraysafe')) {
    function inarraysafe($needle, array $haystack, bool $strict = false): bool
    {
        return in_array($needle, $haystack, $strict);
    }
}

if (!function_exists('isnullsafe')) {
    function isnullsafe($value): bool
    {
        return is_null($value);
    }
}
