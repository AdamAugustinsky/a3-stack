<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<header
  class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <nav class="container mx-auto flex h-16 items-center justify-between px-4">
    <div class="flex items-center space-x-2">
      <div class="font-bold text-xl">
        <a href="/"> A3 Stack </a>
      </div>
    </div>

    <div class="flex items-center space-x-4">
      <Button variant="ghost" href="/sign-in" class="text-sm font-medium">
        Sign In
      </Button>
      <Button href="/sign-up" class="text-sm font-medium">Get Started</Button>
    </div>
  </nav>
</header>

