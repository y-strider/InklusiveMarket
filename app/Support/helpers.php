<?php

if (!function_exists('numberformat')) {
    function numberformat(float $number, int $decimals = 0): string
    {
        return number_format($number, $decimals, '.', '');
    }
}

if (!function_exists('arraymap')) {
    function arraymap(callable $callback, array $array): array
    {
        return array_map($callback, $array);
    }
}

if (!function_exists('arraykeyexists')) {
    function arraykeyexists(string|int $key, array $array): bool
    {
        return array_key_exists($key, $array);
    }
}

if (!function_exists('inarray')) {
    function inarray(mixed $needle, array $haystack, bool $strict = false): bool
    {
        return in_array($needle, $haystack, $strict);
    }
}

if (!function_exists('isnull')) {
    function isnull(mixed $value): bool
    {
        return is_null($value);
    }
}
