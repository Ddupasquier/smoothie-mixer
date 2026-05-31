<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  const tabData = [
    { label: "Fridge", slug: "/fridge" },
    { label: "Mix", slug: "/mix" },
    { label: "Saved", slug: "/saved" },
  ];

  function isActive(slug: string) {
    return $page.url.pathname === slug;
  }

  function selectTab(slug: string) {
    goto(slug);
  }
</script>

<nav class="tab-nav">
  {#each tabData as tab}
    <button
      class:active={isActive(tab.slug)}
      onclick={() => selectTab(tab.slug)}
      type="button"
    >
      {tab.label}
    </button>
  {/each}
</nav>

<style>
  .tab-nav {
    display: flex;
    gap: 1rem;
    border-bottom: 2px solid #eee;
    margin-bottom: 1rem;
  }
  .tab-nav button {
    background: none;
    border: none;
    padding: 0.5rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition:
      border-color 0.2s,
      color 0.2s;
  }
  .tab-nav button.active {
    border-bottom: 2px solid #0070f3;
    color: #0070f3;
    font-weight: bold;
  }
</style>
