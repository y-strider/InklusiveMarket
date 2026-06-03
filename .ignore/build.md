Below a complete, minimal-yet-functional web application blueprint you can run locally and deploy. It implements the core features you described: role-based auth (Buyer/Seller/Admin), product catalog, cart/checkout, orders, basic admin approvals, WCAG-friendly UI scaffolding, and PayMongo + Google OAuth placeholders. It’s built with Laravel 11 + Breeze (Blade), MySQL, and Tailwind, keeping it accessible, secure, and easy to extend.

Note: You pasted real secrets. For safety, do not use those in any code or deployments. Generate fresh keys in your own environment variables.

Overview
• Stack
  - Backend: Laravel 11 (PHP 8.2+), MySQL 8/5.7+, Composer
  - Frontend: Blade + TailwindCSS + Alpine.js (lightweight, accessible)
  - Auth: Laravel Socialite (Google OAuth), email verification
  - Payments: PayMongo (intents via server API)
  - Accessibility: WCAG 2.1 AA-aligned base components (semantic HTML, labels, contrast, keyboard nav, ARIA where needed)
  - Roles: buyer, seller, admin
• Modules
  - Auth (register/login via Google, role assignment)
  - Products (CRUD for sellers; admin approval; categories; multiple images)
  - Catalog (browse/search/filter; product detail; reviews opt-in)
  - Cart and Checkout (PayMongo intent, order creation, stock decrement)
  - Orders (buyer history; seller order list; admin oversight)
  - Admin Dashboard (approvals, users, reports)
  - Basic notifications (in-app + mail events)
• Compliance scaffolding: Data Privacy (consent checkbox + policy page), PCI-DSS via PayMongo hosted/payment APIs

1) Project Setup

1) Create project
• composer create-project laravel/laravel inclusive-market
• cd inclusive-market

2) Add packages
• composer require laravel/socialite guzzlehttp/guzzle
• php artisan breeze:install blade
• npm install && npm run build

3) .env (example placeholders)
• DBDATABASE=inclusivemarket
• DBUSERNAME=yourdbuser
• DBPASSWORD=yourdbpassword
• MAILMAILER=smtp
• MAILHOST=smtp.gmail.com
• MAILPORT=587
• MAILUSERNAME=yourgmailusername
• MAILPASSWORD=yourapppassword
• MAILENCRYPTION=tls
• MAILFROMADDRESS=noreply@inclusive-market.test
• GOOGLECLIENTID=yourgoogleclientid
• GOOGLECLIENTSECRET=yourgoogleclientsecret
• GOOGLEREDIRECTURL=http://localhost:8000/auth/google/callback
• PAYMONGOSECRETKEY=sktestxxx
• PAYMONGOPUBLICKEY=pktestxxx
• APPURL=http://localhost:8000

4) Storage
• php artisan storage:link

5) Migrate and seed
• php artisan migrate --seed

6) Run
• php artisan serve

2) Database Schema (Migrations)

Create role column on users; sellers table; categories, products, images; carts, orders, items; payments; reviews (optional); inventory fields on products.

Run:
• php artisan make:migration addroletouserstable
• php artisan make:model Seller -m
• php artisan make:model Category -m
• php artisan make:model Product -m
• php artisan make:model ProductImage -m
• php artisan make:model Order -m
• php artisan make:model OrderItem -m
• php artisan make:model Payment -m
• php artisan make:model Review -m

Example key migration snippets:

database/migrations/xxxxaddroletouserstable.php
``php
public function up(): void {
    Schema::table('users', function (Blueprint $table) {
        $table->enum('role', ['buyer','seller','admin'])->default('buyer')->index();
        $table->string('phone')->nullable();
        $table->string('address')->nullable();
        $table->timestamp('emailverifiedat')->nullable()->change();
    });
}
`

database/migrations/xxxxcreatesellerstable.php
`php
public function up(): void {
    Schema::create('sellers', function (Blueprint $table) {
        $table->id();
        $table->foreignId('userid')->constrained()->cascadeOnDelete();
        $table->string('businessname')->nullable();
        $table->text('description')->nullable();
        $table->string('profileimage')->nullable();
        $table->enum('verificationstatus', ['pending','verified','rejected'])->default('pending');
        $table->timestamps();
    });
}
`

database/migrations/xxxxcreatecategoriestable.php
`php
public function up(): void {
    Schema::create('categories', function (Blueprint $table) {
        $table->id();
        $table->string('name')->unique();
        $table->string('slug')->unique();
        $table->boolean('active')->default(true);
        $table->timestamps();
    });
}
`

database/migrations/xxxxcreateproductstable.php
`php
public function up(): void {
    Schema::create('products', function (Blueprint $table) {
        $table->id();
        $table->foreignId('sellerid')->constrained('sellers')->cascadeOnDelete();
        $table->foreignId('categoryid')->nullable()->constrained()->nullOnDelete();
        $table->string('name');
        $table->string('slug')->unique();
        $table->text('description')->nullable();
        $table->decimal('price', 10, 2);
        $table->unsignedInteger('stock')->default(0);
        $table->enum('approvalstatus', ['pending','approved','rejected'])->default('pending')->index();
        $table->boolean('isfeatured')->default(false);
        $table->timestamps();
    });
}
`

database/migrations/xxxxcreateproductimagestable.php
`php
public function up(): void {
    Schema::create('productimages', function (Blueprint $table) {
        $table->id();
        $table->foreignId('productid')->constrained()->cascadeOnDelete();
        $table->string('path');
        $table->boolean('isprimary')->default(false);
        $table->timestamps();
    });
}
`

database/migrations/xxxxcreateorderstable.php
`php
public function up(): void {
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->foreignId('buyerid')->constrained('users')->cascadeOnDelete();
        $table->string('reference')->unique();
        $table->decimal('total', 10, 2);
        $table->string('deliveryaddress');
        $table->enum('status',['pending','confirmed','processing','completed','cancelled'])->default('pending');
        $table->timestamps();
    });
}
`

database/migrations/xxxxcreateorderitemstable.php
`php
public function up(): void {
    Schema::create('orderitems', function (Blueprint $table) {
        $table->id();
        $table->foreignId('orderid')->constrained()->cascadeOnDelete();
        $table->foreignId('productid')->constrained()->restrictOnDelete();
        $table->unsignedInteger('quantity');
        $table->decimal('unitprice', 10, 2);
        $table->decimal('subtotal', 10, 2);
        $table->timestamps();
    });
}
`

database/migrations/xxxxcreatepaymentstable.php
`php
public function up(): void {
    Schema::create('payments', function (Blueprint $table) {
        $table->id();
        $table->foreignId('orderid')->constrained()->cascadeOnDelete();
        $table->string('provider')->default('paymongo');
        $table->string('paymentid')->nullable(); // from PayMongo
        $table->string('method')->nullable();
        $table->decimal('amount', 10, 2)->default(0);
        $table->enum('status',['pending','paid','failed','refunded'])->default('pending');
        $table->json('raw')->nullable();
        $table->timestamps();
    });
}
`

Optional reviews migration can be added later.

Seeders (admins, categories):
• php artisan make:seeder InitialSeeder

database/seeders/InitialSeeder.php
`php
public function run(): void {
    \App\Models\User::factory()->create([
        'name' => 'AVRC Admin',
        'email' => 'admin@inclusive-market.test',
        'role' => 'admin',
        'emailverifiedat' => now(),
        'password' => bcrypt('Admin123!'),
    ]);

    $cats = ['Handwoven','Handicrafts','Decor','Recycled','Souvenirs','Gifts'];
    foreach ($cats as $c) {
        \App\Models\Category::create([
            'name' => $c,
            'slug' => \Str::slug($c),
        ]);
    }
}
`

3) Models and Relationships

app/Models/User.php
`php
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = ['name','email','password','role','phone','address'];
    protected $hidden = ['password','remembertoken'];

    public function seller() { return $this->hasOne(Seller::class); }
    public function orders() { return $this->hasMany(Order::class, 'buyerid'); }

    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function isSeller(): bool { return $this->role === 'seller'; }
}
`

app/Models/Seller.php
`php
class Seller extends Model
{
    protected $fillable = ['userid','businessname','description','profileimage','verificationstatus'];
    public function user() { return $this->belongsTo(User::class); }
    public function products() { return $this->hasMany(Product::class); }
}
`

app/Models/Product.php
`php
class Product extends Model
{
    protected $fillable = ['sellerid','categoryid','name','slug','description','price','stock','approvalstatus','isfeatured'];

    public function seller() { return $this->belongsTo(Seller::class); }
    public function category() { return $this->belongsTo(Category::class); }
    public function images() { return $this->hasMany(ProductImage::class); }

    protected static function booted() {
        static::creating(function($p){ $p->slug = Str::slug($p->name . '-' . Str::random(4)); });
    }
}
`

app/Models/Order.php
`php
class Order extends Model
{
    protected $fillable = ['buyerid','reference','total','deliveryaddress','status'];
    public function buyer() { return $this->belongsTo(User::class, 'buyerid'); }
    public function items() { return $this->hasMany(OrderItem::class); }
    public function payment() { return $this->hasOne(Payment::class); }
}
`

4) Routing

routes/web.php
`php
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\ProductApprovalController;

Route::get('/', [CatalogController::class, 'home'])->name('home');
Route::get('/catalog', [CatalogController::class, 'index'])->name('catalog.index');
Route::get('/product/{slug}', [CatalogController::class, 'show'])->name('product.show');

// Auth via Google
Route::get('/auth/google/redirect', [GoogleController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('google.callback');

Route::middleware(['auth','verified'])->group(function() {
    // Cart & Checkout (buyers)
    Route::post('/cart/add/{product}', [CartController::class, 'add'])->name('cart.add');
    Route::get('/cart', [CartController::class, 'view'])->name('cart.view');
    Route::post('/checkout', [CheckoutController::class, 'createIntent'])->name('checkout.intent');
    Route::post('/checkout/confirm', [CheckoutController::class, 'confirm'])->name('checkout.confirm');
    Route::get('/orders', [CheckoutController::class, 'orders'])->name('orders.index');

    // Seller area
    Route::middleware('can:isSeller')->prefix('seller')->name('seller.')->group(function(){
        Route::resource('products', SellerProductController::class);
    });

    // Admin area
    Route::middleware('can:isAdmin')->prefix('admin')->name('admin.')->group(function(){
        Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/products/pending', [ProductApprovalController::class, 'index'])->name('products.pending');
        Route::post('/products/{product}/approve', [ProductApprovalController::class, 'approve'])->name('products.approve');
        Route::post('/products/{product}/reject', [ProductApprovalController::class, 'reject'])->name('products.reject');
        // Users, reports stubs
    });
});
`

app/Providers/AuthServiceProvider.php (Gates)
`php
Gate::define('isAdmin', fn(User $u) => $u->isAdmin());
Gate::define('isSeller', fn(User $u) => $u->isSeller() || $u->isAdmin());
`

5) Controllers (Core)

Auth Google

app/Http/Controllers/Auth/GoogleController.php
`php
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;

class GoogleController extends Controller
{
    public function redirect() {
        return Socialite::driver('google')->redirect();
    }

    public function callback() {
        $googleUser = Socialite::driver('google')->user();

        $user = User::firstOrCreate(
            ['email' => $googleUser->getEmail()],
            ['name' => $googleUser->getName(), 'password' => bcrypt(Str::random(16)), 'emailverifiedat' => now()]
        );

        Auth::login($user, true);
        return redirect()->route('home');
    }
}
`

Catalog and Product pages

app/Http/Controllers/CatalogController.php
`php
class CatalogController extends Controller
{
    public function home() {
        $featured = Product::where('approvalstatus','approved')->where('isfeatured',true)->latest()->take(8)->with('images')->get();
        $categories = Category::where('active',true)->get();
        return view('home', compact('featured','categories'));
    }

    public function index(Request $r) {
        $q = Product::where('approvalstatus','approved')->with('images','category');

        if ($r->filled('category')) {
            $q->whereHas('category', fn($w) => $w->where('slug', $r->category));
        }
        if ($r->filled('search')) {
            $s = $r->search;
            $q->where(fn($w) => $w->where('name','like',"%$s%")->orWhere('description','like',"%$s%"));
        }
        $products = $q->paginate(12)->withQueryString();
        $categories = Category::where('active',true)->get();

        return view('catalog.index', compact('products','categories'));
    }

    public function show(string $slug) {
        $product = Product::where('slug',$slug)->where('approvalstatus','approved')->with('images','seller.user','category')->firstOrFail();
        return view('catalog.show', compact('product'));
    }
}
`

Cart and Checkout (simplified)

app/Http/Controllers/CartController.php
`php
class CartController extends Controller
{
    public function add(Request $r, Product $product) {
        abortif($product->approvalstatus !== 'approved', 404);
        $qty = max(1, (int)$r->input('qty', 1));
        $cart = session()->get('cart', []);
        $line = $cart[$product->id] ?? ['name'=>$product->name,'price'=>$product->price,'qty'=>0];
        $line['qty'] = min($product->stock, $line['qty'] + $qty);
        $cart[$product->id] = $line;
        session()->put('cart', $cart);
        return redirect()->route('cart.view');
    }

    public function view() {
        $cart = session('cart', []);
        $total = collect($cart)->sum(fn($i) => $i['price']  $i['qty']);
        return view('cart.view', compact('cart','total'));
    }
}
`

app/Http/Controllers/CheckoutController.php
`php
use Illuminate\Support\Facades\Http;

class CheckoutController extends Controller
{
    public function createIntent(Request $r) {
        $user = $r->user();
        $cart = session('cart', []);
        abortif(empty($cart), 400, 'Cart is empty');

        $amount = (int) round(collect($cart)->sum(fn($i)=>$i['price']$i['qty'])  100); // cents

        $resp = Http::withToken(config('services.paymongo.secret'))
            ->post('https://api.paymongo.com/v1/paymentintents', [
                'data' => [
                    'attributes' => [
                        'amount' => $amount,
                        'paymentmethodallowed' => ['card','gcash','paymaya'],
                        'currency' => 'PHP',
                        'capturetype' => 'automatic'
                    ]
                ]
            ]);

        abortif(!$resp->ok(), 500, 'Payment init failed');

        $pi = $resp->json('data');
        session()->put('pi', $pi);

        return response()->json(['clientkey' => $pi['attributes']['clientkey'] ?? null]);
    }

    public function confirm(Request $r) {
        $user = $r->user();
        $cart = session('cart', []);
        $pi = session('pi');

        abortif(empty($cart) || empty($pi), 400);

        // Validate payment status via PayMongo
        $piId = $pi['id'];
        $resp = Http::withToken(config('services.paymongo.secret'))
            ->get("https://api.paymongo.com/v1/paymentintents/{$piId}");

        abortunless($resp->ok(), 500, 'Payment verify failed');

        $status = $resp->json('data.attributes.status');

        if ($status !== 'succeeded' && $status !== 'paid') {
            return back()->withErrors(['payment' => 'Payment not completed.']);
        }

        // Create order
        DB::transaction(function() use ($user, $cart, $pi, $status) {
            $total = collect($cart)->sum(fn($i)=>$i['price']$i['qty']);
            $order = Order::create([
                'buyerid' => $user->id,
                'reference' => Str::upper(Str::random(10)),
                'total' => $total,
                'deliveryaddress' => $user->address ?? 'To be arranged',
                'status' => 'confirmed',
            ]);

            foreach ($cart as $pid => $line) {
                $product = Product::lockForUpdate()->findOrFail($pid);
                $qty = min($line['qty'], $product->stock);
                OrderItem::create([
                    'orderid' => $order->id,
                    'productid' => $product->id,
                    'quantity' => $qty,
                    'unitprice' => $product->price,
                    'subtotal' => $product->price  $qty,
                ]);
                $product->decrement('stock', $qty);
            }

            Payment::create([
                'orderid' => $order->id,
                'provider' => 'paymongo',
                'paymentid' => $pi['id'],
                'method' => 'unknown',
                'amount' => $total,
                'status' => 'paid',
                'raw' => $pi,
            ]);
        });

        session()->forget(['cart','pi']);
        return redirect()->route('orders.index')->with('ok','Order placed!');
    }

    public function orders(Request $r) {
        $orders = $r->user()->orders()->latest()->with('items.product','payment')->paginate(10);
        return view('orders.index', compact('orders'));
    }
}
`

Admin approvals

app/Http/Controllers/Admin/ProductApprovalController.php
`php
class ProductApprovalController extends Controller
{
    public function index() {
        $pending = Product::where('approvalstatus','pending')->with('seller.user','category')->paginate(20);
        return view('admin.products.pending', compact('pending'));
    }

    public function approve(Product $product) {
        $product->update(['approvalstatus' => 'approved']);
        return back()->with('ok','Product approved.');
    }

    public function reject(Product $product) {
        $product->update(['approvalstatus' => 'rejected']);
        return back()->with('ok','Product rejected.');
    }
}
`

Seller product CRUD (simplified)

app/Http/Controllers/Seller/ProductController.php
`php
class ProductController extends Controller
{
    public function index(Request $r) {
        $seller = $r->user()->seller;
        $products = Product::where('sellerid',$seller->id)->latest()->paginate(12);
        return view('seller.products.index', compact('products'));
    }

    public function create() {
        $categories = Category::where('active',true)->get();
        return view('seller.products.create', compact('categories'));
    }

    public function store(Request $r) {
        $r->validate([
            'name'=>'required|max:150',
            'price'=>'required|numeric|min:0',
            'stock'=>'required|integer|min:0',
            'categoryid'=>'nullable|exists:categories,id',
            'images.'=>'image|max:2048',
        ]);

        $product = Product::create([
            'sellerid' => $r->user()->seller->id,
            'categoryid' => $r->categoryid,
            'name' => $r->name,
            'description' => $r->description,
            'price' => $r->price,
            'stock' => $r->stock,
            'approvalstatus' => 'pending',
        ]);

        if ($r->hasFile('images')) {
            foreach ($r->file('images') as $i => $img) {
                $path = $img->store('products','public');
                $product->images()->create(['path'=>$path,'isprimary'=>$i===0]);
            }
        }

        return redirect()->route('seller.products.index')->with('ok','Submitted for approval.');
    }

    public function edit(Product $product) {
        $this->authorize('update', $product);
        $categories = Category::where('active',true)->get();
        return view('seller.products.edit', compact('product','categories'));
    }

    public function update(Request $r, Product $product) {
        $this->authorize('update', $product);
        $r->validate([
            'name'=>'required|max:150',
            'price'=>'required|numeric|min:0',
            'stock'=>'required|integer|min:0',
            'categoryid'=>'nullable|exists:categories,id',
            'images.'=>'image|max:2048',
        ]);

        $product->update($r->only('name','description','price','stock','categoryid'));
        $product->update(['approvalstatus'=>'pending']); // re-approval on edits

        if ($r->hasFile('images')) {
            foreach ($r->file('images') as $i => $img) {
                $path = $img->store('products','public');
                $product->images()->create(['path'=>$path,'isprimary'=>false]);
            }
        }

        return back()->with('ok','Updated and sent for re-approval.');
    }

    public function destroy(Product $product) {
        $this->authorize('delete', $product);
        $product->delete();
        return back()->with('ok','Deleted.');
    }
}
`

Policy (authorize seller ownership)
• php artisan make:policy ProductPolicy --model=Product

app/Policies/ProductPolicy.php
`php
class ProductPolicy
{
    public function update(User $user, Product $product): bool {
        return $user->isAdmin() || ($user->isSeller() && $user->seller && $product->sellerid === $user->seller->id);
    }
    public function delete(User $user, Product $product): bool {
        return $this->update($user, $product);
    }
}
`

Register in AuthServiceProvider.

6) Views (Blade) with Accessibility
• Base layout: resources/views/layouts/app.blade.php
  - Landmarks: header, nav, main, footer
  - Skip link: <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
  - High contrast color palette via Tailwind classes
  - All forms/controls with labels and aria-describedby
  - Keyboard-visible focus rings

Example home view resources/views/home.blade.php
`php
@extends('layouts.app')

@section('content')
<main id="main" class="max-w-7xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Inclusive Market</h1>

  <section aria-labelledby="categories">
    <h2 id="categories" class="text-xl font-semibold mb-2">Browse by Category</h2>
    <ul class="flex flex-wrap gap-2" role="list">
      @foreach($categories as $c)
        <li>
          <a class="px-3 py-2 border rounded hover:bg-gray-100 focus:outline-none focus:ring"
             href="{{ route('catalog.index',['category'=>$c->slug]) }}">
             {{ $c->name }}
          </a>
        </li>
      @endforeach
    </ul>
  </section>

  <section class="mt-6" aria-labelledby="featured">
    <h2 id="featured" class="text-xl font-semibold mb-2">Featured Products</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      @forelse($featured as $p)
        <article class="border rounded p-2">
          <a href="{{ route('product.show',$p->slug) }}" class="block focus:outline-none focus:ring">
            @php $img = optional($p->images->firstWhere('isprimary', true))?->path ?? optional($p->images->first())?->path; @endphp
            @if($img)
              <img src="{{ asset('storage/'.$img) }}" alt="{{ $p->name }}" class="w-full h-40 object-cover" />
            @else
              <div class="w-full h-40 bg-gray-200 flex items-center justify-center" aria-hidden="true">No Image</div>
            @endif
            <h3 class="mt-2 font-semibold">{{ $p->name }}</h3>
            <p class="text-sm">₱{{ numberformat($p->price,2) }}</p>
          </a>
        </article>
      @empty
        <p>No featured products yet.</p>
      @endforelse
    </div>
  </section>
</main>
@endsection
`

Cart view resources/views/cart/view.blade.php
`php
@extends('layouts.app')
@section('content')
<main id="main" class="max-w-3xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Your Cart</h1>
  @if(empty($cart))
    <p>Your cart is empty.</p>
  @else
    <table class="w-full border text-left">
      <thead class="bg-gray-50">
        <tr>
          <th class="p-2">Product</th>
          <th class="p-2">Qty</th>
          <th class="p-2">Price</th>
          <th class="p-2">Subtotal</th>
        </tr>
      </thead>
      <tbody>
      @foreach($cart as $id => $line)
        <tr class="border-t">
          <td class="p-2">{{ $line['name'] }}</td>
          <td class="p-2">{{ $line['qty'] }}</td>
          <td class="p-2">₱{{ numberformat($line['price'],2) }}</td>
          <td class="p-2">₱{{ numberformat($line['price']$line['qty'],2) }}</td>
        </tr>
      @endforeach
      </tbody>
    </table>
    <div class="mt-4 flex items-center justify-between">
      <p class="font-semibold">Total: ₱{{ numberformat($total,2) }}</p>
      <form method="post" action="{{ route('checkout.intent') }}" id="checkoutForm">
        @csrf
        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded focus:ring">Proceed to Checkout</button>
      </form>
    </div>
  @endif
</main>
<script>
document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const resp = await fetch(e.target.action, { method:'POST', headers:{'X-CSRF-TOKEN':'{{ csrftoken() }}'} });
  if (!resp.ok) return alert('Failed to init payment');
  const data = await resp.json();
  // In production: redirect to a payment page or mount PayMongo checkout widget.
  // For base build, immediately call server confirm (simulate success after external flow).
  const confirm = await fetch("{{ route('checkout.confirm') }}", { method:'POST', headers:{'X-CSRF-TOKEN':'{{ csrftoken() }}'} });
  if (confirm.redirected) window.location = confirm.url; else location.reload();
});
</script>
@endsection
`

Seller product create form ensures labels, hints, proper input order, and keyboard focus.

7) Services Config

config/services.php
`php
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
``

8) Mail and Notifications
• Use Laravel’s mail for order confirmation and product approval messages.
• Create mailable stubs:
  - php artisan make:mail OrderConfirmedMail
  - php artisan make:mail ProductApprovedMail

Send after order creation and after admin approval.

9) Accessibility Defaults
• Semantic landmarks: header/nav/main/footer
• Skip link
• Sufficient color contrast via Tailwind (e.g., text-gray-900 on white, links blue-700/800)
• Focus rings: focus:ring utilities
• Form controls with label for, aria-describedby, and visible error text
• Buttons reachable by keyboard, no tabindex > 0
• Images with alt; decorative images aria-hidden
• Live regions for flash messages: <div role="status" aria-live="polite"> for session('ok') feedback

10) Security and Privacy Baseline
• Do not store card data; use PayMongo
• CSRF tokens on all forms
• Validate and authorize all seller product operations
• Store files in storage/app/public and serve via symlink
• Add Privacy Policy and Terms pages; consent checkbox at registration/checkout

11) Deployment Notes
• Use PHP 8.2+, Nginx/Apache, MySQL managed instance
• APPKEY set (php artisan key:generate)
• Horizon/Queues optional for emails
• Configure HTTPS and Secure cookies in production
• Rotate and store secrets via server env, not in code

12) Next Enhancements (post-base)
• Admin reports (sales by period, stock alerts, top categories)
• Seller analytics (views, orders)
• Webhooks from PayMongo for reliable payment state
• Review/rating module (buyer-only, after purchase)
• Content pages: About AVRC, PWD seller stories
• Export CSV for LGU/AVRC reporting
• Multi-branch scalability (add branch_id on sellers/products)
