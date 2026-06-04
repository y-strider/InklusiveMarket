<script lang="ts">
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import { api } from "../../../lib/api";
  let status = "checking";
  let intent: any = null;
  let error: string | null = null;
  async function load() {
    const params = new URLSearchParams(get(page).url.search);
    const id = params.get("intent");
    if (!id) {
      error = "Missing intent id";
      status = "error";
      return;
    }
    try {
      const res: any = await api(`/api/payments/intent/${id}`);
      intent = res.intent;
      status = intent.status;
    } catch (e: any) {
      error = e.message;
      status = "error";
    }
  }
  load();
</script>

<section aria-labelledby="return-title" class="max-w-3xl mx-auto p-4">
  <h1 id="return-title" class="text-2xl font-semibold">Payment Return</h1>
  {#if error}
    <div role="alert" aria-live="assertive" class="mt-3 p-3 rounded bg-red-100 text-red-900">
      {error}
    </div>
  {/if}
  {#if intent}
    <p class="mt-3" aria-live="polite">Status: <strong>{status}</strong></p>
    <a href="/payments" class="underline text-blue-700 mt-2 inline-block" role="button">Back to payments</a>
  {:else}
    <p class="mt-3" aria-live="polite">Verifying...</p>
  {/if}
</section>
