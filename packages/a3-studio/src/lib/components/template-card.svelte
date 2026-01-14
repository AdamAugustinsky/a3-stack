<script lang="ts">
  import { cn } from "$lib/utils/cn";

  interface Template {
    name: string;
    displayName: string;
    description: string;
    features: string[];
  }

  interface Props {
    template: Template;
    selected: boolean;
    onselect: () => void;
  }

  let { template, selected, onselect }: Props = $props();
</script>

<button
  type="button"
  onclick={onselect}
  class={cn(
    "relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:bg-accent",
    selected && "border-primary bg-accent"
  )}
>
  {#if selected}
    <div class="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary"></div>
  {/if}
  
  <div class="flex items-center gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
      <path d="M3 12A9 3 0 0 0 21 12"></path>
    </svg>
    <span class="font-semibold">{template.displayName}</span>
  </div>
  
  <p class="text-sm text-muted-foreground">
    {template.description}
  </p>
  
  <div class="mt-2 flex flex-wrap gap-1">
    {#each template.features.slice(0, 3) as feature}
      <span class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
        {feature}
      </span>
    {/each}
    {#if template.features.length > 3}
      <span class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
        +{template.features.length - 3} more
      </span>
    {/if}
  </div>
</button>
