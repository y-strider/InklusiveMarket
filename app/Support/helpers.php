<?php

use Illuminate\Support\Arr;

if (!function_exists('num_format')) {
    function num_format(float $number, int $decimals = 0, string $decimalSeparator = '.', string $thousandsSeparator = ''): string
    {
        return number_format($number, $decimals, $decimalSeparator, $thousandsSeparator);
    }
}

if (!function_exists('arr_map')) {
    function arr_map(callable $callback, array $array): array
    {
        $out = [];
        foreach ($array as $k => $v) {
            $out[$k] = $callback($v, $k);
        }
        return $out;
    }
}

if (!function_exists('arr_key_exists_safe')) {
    function arr_key_exists_safe($key, array $array): bool
    {
        return array_key_exists($key, $array);
    }
}

if (!function_exists('in_array_safe')) {
    function in_array_safe($needle, array $haystack, bool $strict = false): bool
    {
        return in_array($needle, $haystack, $strict);
    }
}

if (!function_exists('is_null_safe')) {
    function is_null_safe($value): bool
    {
        return is_null($value);
    }
}
