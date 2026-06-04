<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../../../lib/api";
  let rows: any[] = [];
  let error: string | null = null;
  let pageIndex = 0;
  let pageSize = 20;
  let total = 0;
  let search = "";
  let busy = false;

  async function load() {
    busy = true;
    error = null;
    try {
      const res: any = await api(`/api/payments/sync`, { method: "POST" });
      res;
      const list: any = await api(`/api/admin/payments?offset=${pageIndex * pageSize}&limit=${pageSize}&q=${encodeURIComponent(search)}`);
      rows = list.items;
      total = list.total;
    } catch (e: any) {
      error = e.message;
    } finally {
      busy = false;
    }
  }

  function prev() {
    if (pageIndex > 0) {
      pageIndex -= 1;
      load();
    }
  }
  function next() {
    if ((pageIndex + 1) * pageSize < total) {
      pageIndex += 1;
      load();
    }
  }

  onMount(load);
</script>

<section aria-labelledby="admin-payments-title" class="max-w-5xl mx-auto p-4">
  <h1 id="admin-payments-title" class="text-2xl font-semibold">Payments</h1>

  <form class="mt-4 flex items-center gap-2" on:submit|preventDefault={load} role="search">
    <label for="q" class="sr-only">Search</label>
    <input id="q" class="border p-2 rounded w-full" placeholder="Search by metadata..." bind:value={search} />
    <button class="px-4 py-2 rounded bg-blue-600 text-white">Search</button>
  </form>

  {#if error}
    <div class="mt-3 p-3 bg-red-100 text-red-900 rounded" role="alert" aria-live="assertive">{error}</div>
  {/if}

  <div class="mt-4 overflow-x-auto">
    <table role="table" aria-label="Payments table" class="min-w-full border">
      <thead>
        <tr>
          <th scope="col" class="p-2 border">ID</th>
          <th scope="col" class="p-2 border">Amount</th>
          <th scope="col" class="p-2 border">Currency</th>
          <th scope="col" class="p-2 border">Status</th>
          <th scope="col" class="p-2 border">Created</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr tabindex="0">
            <td class="p-2 border">{r.id}</td>
            <td class="p-2 border">{r.amount}</td>
            <td class="p-2 border">{r.currency}</td>
            <td class="p-2 border">{r.status}</td>
            <td class="p-2 border">{new Date(r.createdAt).toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <nav class="mt-3 flex items-center justify-between" aria-label="Pagination">
    <button class="px-3 py-1 border rounded" on:click={prev} aria-disabled={pageIndex===0} disabled={pageIndex===0}>Previous</button>
    <span aria-live="polite">Page {pageIndex + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span>
    <button class="px-3 py-1 border rounded" on:click={next} aria-disabled={(pageIndex + 1) * pageSize >= total} disabled={(pageIndex + 1) * pageSize >= total}>Next</button>
  </nav>
</section>
