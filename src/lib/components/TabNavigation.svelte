<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  const tabData = [
    { label: "Ingredients", slug: "/fridge" },
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

<nav class="tab-nav" aria-label="Main navigation">
  {#each tabData as tab}
    <button
      class="tab-btn {isActive(tab.slug) ? 'active' : ''}"
      aria-current={isActive(tab.slug) ? "page" : undefined}
      onclick={() => selectTab(tab.slug)}
      type="button"
    >
      {tab.label}
    </button>
  {/each}
</nav>

<style lang="scss">
  @use "../../styles/variables" as *;
  .tab-nav {
    display: flex;
    gap: $app-gap-sm;
    background: $app-bg;
    border-radius: 999px;
    padding: 0.3em 0.4em;
    margin-bottom: $app-gap-lg;
    justify-content: center;

    .tab-btn {
      background: none;
      border: none;
      color: $app-primary;
      font-size: 1.08em;
      font-weight: 500;
      padding: 0.5em 1.3em;
      border-radius: 999px;
      cursor: pointer;
      transition:
        background 0.13s,
        color 0.13s;

      &.active {
        background: $app-primary;
        color: $app-btn-text;
      }

      &:focus {
        outline: 2px solid $app-primary;
      }
    }
  }
</style>
