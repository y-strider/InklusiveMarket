@extends('layouts.app')
@section('content')
<h1 id="review-title">Submit Product Review</h1>
<form method="post" action="{{ route('orders.review.submit', $order) }}" aria-label="Submit Product Review Form">
    @csrf
    <div>
        <label for="product">Product</label>
        <select id="product" name="product_id" required>
            @foreach($order->items as $item)
                <option value="{{ $item->product->id }}">{{ $item->product->name }}</option>
            @endforeach
        </select>
    </div>
    <div>
        <label for="rating">Rating</label>
        <select id="rating" name="rating" required>
            <option value="">Select rating</option>
            @for($i=5; $i>=1; $i--)
                <option value="{{ $i }}">{{ $i }} Star{{ $i > 1 ? 's' : '' }}</option>
            @endfor
        </select>
    </div>
    <div>
        <label for="comment">Comment</label>
        <textarea id="comment" name="comment" rows="3"></textarea>
    </div>
    <button type="submit">Submit Review</button>
</form>
@endsection