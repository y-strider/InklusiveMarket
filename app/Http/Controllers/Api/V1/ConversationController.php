<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Listing;
use App\Models\User;
use App\Notifications\MessageReceived;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = $user->conversations()
            ->with(['participants:id,username,display_name,avatar_url', 'latestMessage.sender:id,username', 'listing:id,ulid,title,slug'])
            ->orderByDesc('last_message_at')
            ->paginate(20);

        // Attach unread count per conversation
        $conversations->getCollection()->transform(function ($conv) use ($user) {
            $conv->unread_count = $conv->unreadCountFor($user);
            return $conv;
        });

        return response()->json($conversations);
    }

    public function show(Request $request, string $ulid): JsonResponse
    {
        $conversation = Conversation::where('ulid', $ulid)
            ->with(['participants:id,username,display_name,avatar_url', 'listing:id,ulid,title,slug'])
            ->firstOrFail();

        Gate::authorize('view', $conversation);

        $messages = $conversation->messages()
            ->with('sender:id,username,display_name,avatar_url')
            ->paginate(50);

        // Mark as read
        $conversation->participants()->updateExistingPivot(
            $request->user()->id,
            ['last_read_at' => now()]
        );

        return response()->json(['conversation' => $conversation, 'messages' => $messages]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_username' => 'required|string|exists:users,username',
            'listing_ulid' => 'nullable|string|exists:listings,ulid',
            'subject' => 'nullable|string|max:200',
            'message' => 'required|string|max:5000',
        ]);

        $recipient = User::where('username', $validated['recipient_username'])->firstOrFail();
        $sender = $request->user();
        $listingId = null;

        if ($validated['listing_ulid'] ?? null) {
            $listingId = Listing::where('ulid', $validated['listing_ulid'])->value('id');
        }

        $conversation = DB::transaction(function () use ($sender, $recipient, $validated, $listingId) {
            $conv = Conversation::create([
                'listing_id' => $listingId,
                'subject' => $validated['subject'] ?? null,
            ]);
            $conv->participants()->attach([$sender->id, $recipient->id], ['last_read_at' => null]);
            $conv->participants()->updateExistingPivot($sender->id, ['last_read_at' => now()]);

            $message = $conv->messages()->create([
                'sender_id' => $sender->id,
                'body' => $validated['message'],
            ]);

            $recipient->notify(new MessageReceived($message));

            return $conv;
        });

        return response()->json($conversation->load(['participants', 'latestMessage']), 201);
    }

    public function sendMessage(Request $request, string $ulid): JsonResponse
    {
        $conversation = Conversation::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('sendMessage', $conversation);

        $validated = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $message = DB::transaction(function () use ($request, $conversation, $validated) {
            $msg = $conversation->messages()->create([
                'sender_id' => $request->user()->id,
                'body' => $validated['body'],
            ]);

            $conversation->participants()
                ->where('user_id', '!=', $request->user()->id)
                ->each(function ($recipient) use ($msg) {
                    $recipient->notify(new MessageReceived($msg));
                });

            $conversation->participants()->updateExistingPivot($request->user()->id, ['last_read_at' => now()]);

            return $msg;
        });

        return response()->json($message->load('sender:id,username,display_name,avatar_url'), 201);
    }
}
