<script lang="ts">
  import { env } from "$env/dynamic/public";
  import { orpc } from "$lib/orpc";
  import { createQuery } from "@tanstack/svelte-query";
  const healthCheck = createQuery(orpc.healthCheck.queryOptions());
  import * as Card from "$lib/components/ui/card/index.js";

  console.log("process.env.PUBLIC_SERVER_URL", env.PUBLIC_SERVER_URL);

  const TITLE_TEXT = `
    █████╗ ██████╗     ███████╗████████╗ █████╗  ██████╗██╗  ██╗
   ██╔══██╗╚════██╗    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
   ███████║ █████╔╝    ███████╗   ██║   ███████║██║     █████╔╝ 
   ██╔══██║  ╚═══██╗   ╚════██║   ██║   ██╔══██║██║     ██╔═██╗ 
   ██║  ██║██████╔╝    ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
   ╚═╝  ╚═╝╚═════╝     ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
   `;
</script>

<div class="container mx-auto max-w-3xl px-4 py-2">
  <pre class="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
  <div class="grid gap-6">
    <Card.Root>
      <Card.Header>
        <Card.Title>API Status</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="flex items-center gap-2">
          <div
            class={`h-2 w-2 rounded-full ${$healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span class="text-muted-foreground text-sm">
            {$healthCheck.isLoading
              ? "Checking..."
              : $healthCheck.data
                ? "Connected"
                : "Disconnected"}
          </span>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>
