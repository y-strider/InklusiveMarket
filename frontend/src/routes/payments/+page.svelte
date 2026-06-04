<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../../lib/api";
  let amount = 0;
  let currency = "PHP";
  let creating = false;
  let attaching = false;
  let notice: string | null = null;
  let intent: any = null;
  let error: string | null = null;
  let methodType = "gcash";
  let paymentMethodId = "";
  let returnUrl = "";
  let focused = "amount";
  function setFocus(id: string) {
    focused = id;
    const el = document.getElementById(id);
    if (el) el.focus();
  }
  async function createIntent() {
    error = null;
    creating = true;
    try {
      const res: any = await api("/api/payments/intent", { method: "POST", body: JSON.stringify({ amount: Number(amount), currency, metadata: {} }) });
      intent = res.intent;
      notice = res.notice;
      returnUrl = window.location.origin + "/payments/return?intent=" + intent.id;
      setTimeout(() => setFocus("paymentMethodId"), 0);
    } catch (e: any) {
      error = e.message;
      setTimeout(() => setFocus("amount"), 0);
    } finally {
      creating = false;
    }
  }
  async function attachMethod() {
    if (!intent) return;
    attaching = true;
    error = null;
    try {
      const res: any = await api(`/api/payments/intent/${intent.id}/attach`, { method: "POST", body: JSON.stringify({ paymentMethodId, type: methodType, returnUrl }) });
      intent = res.intent;
      setTimeout(() => setFocus("status"), 0);
    } catch (e: any) {
      error = e.message;
      setTimeout(() => setFocus("paymentMethodId"), 0);
    } finally {
      attaching = false;
    }
  }
  async function refresh() {
    if (!intent) return;
    const res: any = await api(`/api/payments/intent/${intent.id}`);
    intent = res.intent;
  }
  onMount(() => {
    setFocus("amount");
  });
</script>

<svelte:window on:keydown={(e)=>{ if(e.key==="Enter"){ const a=document.activeElement as HTMLElement; if(a?.id==="amount"){ createIntent(); } else if(a?.id==="paymentMethodId"){ attachMethod(); } } }} />

<section aria-labelledby="payment-title" class="max-w-3xl mx-auto p-4">
  <h1 id="payment-title" class="text-2xl font-semibold">Checkout</h1>

  {#if notice}
    <div role="alert" aria-live="polite" class="mt-3 p-3 rounded bg-yellow-100 text-yellow-900">
      {notice}
    </div>
  {/if}

  {#if error}
    <div role="alert" aria-live="assertive" class="mt-3 p-3 rounded bg-red-100 text-red-900">
      {error}
    </div>
  {/if}

  <form class="mt-4 grid gap-3" on:submit|preventDefault={createIntent} aria-describedby="instructions">
    <p id="instructions" class="sr-only">Enter amount and currency to create a payment intent.</p>
    <label for="amount" class="block">Amount</label>
    <input id="amount" name="amount" inputmode="decimal" class="border p-2 rounded w-full" aria-required="true" aria-invalid={!!error && focused==="amount"} bind:value={amount} />

    <label for="currency" class="block">Currency</label>
    <select id="currency" name="currency" class="border p-2 rounded w-full" bind:value={currency} aria-required="true">
      <option value="PHP">PHP</option>
      <option value="USD">USD</option>
    </select>

    <button id="create" class="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" aria-disabled={creating} on:click|preventDefault={createIntent}>
      {creating ? "Creating..." : "Create Payment Intent"}
    </button>
  </form>

  {#if intent}
    <div class="mt-6" aria-live="polite">
      <h2 class="text-xl font-semibold" id="details-title">Payment Details</h2>
      <table role="table" aria-labelledby="details-title" class="w-full border mt-2">
        <thead>
          <tr>
            <th scope="col" class="text-left p-2 border">Field</th>
            <th scope="col" class="text-left p-2 border">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" class="p-2 border">ID</th>
            <td class="p-2 border" id="status">{intent.id}</td>
          </tr>
          <tr>
            <th scope="row" class="p-2 border">Amount</th>
            <td class="p-2 border">{intent.amount} {intent.currency}</td>
          </tr>
          <tr>
            <th scope="row" class="p-2 border">Status</th>
            <td class="p-2 border">{intent.status}</td>
          </tr>
        </tbody>
      </table>

      <form class="mt-4 grid gap-3" on:submit|preventDefault={attachMethod} aria-labelledby="attach-title">
        <h3 id="attach-title" class="text-lg font-medium">Attach Payment Method</h3>
        <label for="methodType" class="block">Method</label>
        <select id="methodType" class="border p-2 rounded w-full" bind:value={methodType} aria-required="true">
          <option value="gcash">GCash</option>
          <option value="card">Card</option>
          <option value="grab_pay">GrabPay</option>
          <option value="paymaya">Maya</option>
        </select>

        <label for="paymentMethodId" class="block">Payment Method ID</label>
        <input id="paymentMethodId" name="paymentMethodId" class="border p-2 rounded w-full" aria-required="true" bind:value={paymentMethodId} />

        <label for="returnUrl" class="block">Return URL</label>
        <input id="returnUrl" name="returnUrl" class="border p-2 rounded w-full" aria-required="true" bind:value={returnUrl} />

        <div class="flex gap-2">
          <button class="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50" aria-disabled={attaching}>
            {attaching ? "Attaching..." : "Attach Method"}
          </button>
          <button type="button" class="px-4 py-2 rounded bg-gray-700 text-white" on:click={refresh}>Refresh Status</button>
        </div>
      </form>
    </div>
  {/if}
</section>
