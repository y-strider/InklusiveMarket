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
            ->with(['participants:id,username,displayname,avatarurl', 'latestMessage.sender:id,username', 'listing:id,ulid,title,slug'])
            ->orderByDesc('lastmessageat')
            ->paginate(20);
        $conversations->getCollection()->transform(function ($conv) use ($user) {
            $conv->unreadcount = $conv->unreadCountFor($user);
            return $conv;
        });
        return response()->json($conversations);
    }

    public function show(Request $request, string $ulid): JsonResponse
    {
        $conversation = Conversation::where('ulid', $ulid)
            ->with(['participants:id,username,displayname,avatarurl', 'listing:id,ulid,title,slug'])
            ->firstOrFail();
        Gate::authorize('view', $conversation);
        $messages = $conversation->messages()
            ->with('sender:id,username,displayname,avatarurl')
            ->paginate(50);
        $conversation->participants()->updateExistingPivot(
            $request->user()->id,
            ['lastreadat' => now()]
        );
        return response()->json(['conversation' => $conversation, 'messages' => $messages]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipientusername' => 'required|string|exists:users,username',
            'listingulid' => 'nullable|string|exists:listings,ulid',
            'subject' => 'nullable|string|max:200',
            'message' => 'required|string|max:5000',
        ]);
        $recipient = User::where('username', $validated['recipientusername'])->firstOrFail();
        $sender = $request->user();
        $listingId = null;
        if (!empty($validated['listingulid'])) {
            $listingId = Listing::where('ulid', $validated['listingulid'])->value('id');
        }
        $conversation = DB::transaction(function () use ($sender, $recipient, $validated, $listingId) {
            $conv = Conversation::create([
                'listingid' => $listingId,
                'subject' => $validated['subject'] ?? null,
            ]);
            $conv->participants()->attach([$sender->id => ['lastreadat' => now()], $recipient->id => ['lastreadat' => null]]);
            $message = $conv->messages()->create([
                'senderid' => $sender->id,
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
                'senderid' => $request->user()->id,
                'body' => $validated['body'],
            ]);
            $recipients = $conversation->participants()->where('userid', '!=', $request->user()->id)->get();
            foreach ($recipients as $recipient) {
                $recipient->notify(new MessageReceived($msg));
            }
            $conversation->participants()->updateExistingPivot($request->user()->id, ['lastreadat' => now()]);
            return $msg;
        });
        return response()->json($message->load('sender:id,username,displayname,avatarurl'), 201);
    }
}
