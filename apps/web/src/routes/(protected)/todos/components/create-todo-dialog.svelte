<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { labels, statuses, priorities } from "./data.js";
  import { superForm } from "sveltekit-superforms";
  import { arktype } from "sveltekit-superforms/adapters";
  import { createTodoSchema } from "../schemas";
  import { invalidateAll } from "$app/navigation";

  let {
    open = $bindable(),
    form: initialForm,
  }: {
    open: boolean;
    form: any;
  } = $props();

  const form = superForm(initialForm, {
    validators: arktype(createTodoSchema),
    dataType: "json",
    resetForm: true,
    onResult({ result }) {
      if (result.type === "success") {
        open = false;
        invalidateAll();
      }
    },
  });

  const { enhance, form: formData, delayed } = form;

  // Reset form when dialog closes
  $effect(() => {
    if (!open) {
      form.reset();
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[525px]">
    <Dialog.Header>
      <Dialog.Title>Create New Task</Dialog.Title>
      <Dialog.Description>
        Add a new task to your todo list. Fill in the details below.
      </Dialog.Description>
    </Dialog.Header>

    <form method="POST" action="?/create" use:enhance class="mt-6 space-y-6">
      <Form.Field {form} name="text">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>
              Task Title <span class="text-destructive">*</span>
            </Form.Label>
            <Textarea
              {...props}
              bind:value={$formData.text}
              placeholder="What needs to be done?"
              rows={2}
              class="resize-none"
            />
            <p class="text-sm text-muted-foreground">
              Give your task a clear, descriptive title.
            </p>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <div class="grid gap-4 sm:grid-cols-3">
        <Form.Field {form} name="label">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Label</Form.Label>
              <Select.Root
                type="single"
                allowDeselect={false}
                value={$formData.label || "feature"}
                onValueChange={(value: string | undefined) => {
                  if (value) {
                    $formData.label = value as typeof $formData.label;
                  }
                }}
              >
                <Select.Trigger class="w-full">
                  <Badge variant="outline" class="font-normal">
                    {labels.find(
                      (l) => l.value === ($formData.label || "feature"),
                    )?.label}
                  </Badge>
                </Select.Trigger>
                <Select.Content>
                  {#each labels as label (label.value)}
                    <Select.Item value={label.value}>
                      <Badge variant="outline" class="font-normal">
                        {label.label}
                      </Badge>
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="status">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Status</Form.Label>
              <Select.Root
                type="single"
                allowDeselect={false}
                value={$formData.status || "todo"}
                onValueChange={(value: string | undefined) => {
                  if (value) {
                    $formData.status = value as typeof $formData.status;
                  }
                }}
              >
                <Select.Trigger class="w-full">
                  {@const currentStatus = statuses.find(
                    (s) => s.value === ($formData.status || "todo"),
                  )}
                  {#if currentStatus}
                    <div class="flex items-center">
                      <currentStatus.icon
                        class="mr-2 h-4 w-4 text-muted-foreground"
                      />
                      <span>{currentStatus.label}</span>
                    </div>
                  {/if}
                </Select.Trigger>
                <Select.Content>
                  {#each statuses as status (status.value)}
                    <Select.Item value={status.value}>
                      <div class="flex items-center">
                        <status.icon
                          class="mr-2 h-4 w-4 text-muted-foreground"
                        />
                        <span>{status.label}</span>
                      </div>
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="priority">
          <Form.Control>
            {#snippet children()}
              <Form.Label>Priority</Form.Label>
              <Select.Root
                type="single"
                allowDeselect={false}
                value={$formData.priority || "medium"}
                onValueChange={(value: string | undefined) => {
                  if (value) {
                    $formData.priority = value as typeof $formData.priority;
                  }
                }}
              >
                <Select.Trigger class="w-full">
                  {@const currentPriority = priorities.find(
                    (p) => p.value === ($formData.priority || "medium"),
                  )}
                  {#if currentPriority}
                    <div class="flex items-center">
                      <currentPriority.icon
                        class="mr-2 h-4 w-4 text-muted-foreground"
                      />
                      <span>{currentPriority.label}</span>
                    </div>
                  {/if}
                </Select.Trigger>
                <Select.Content>
                  {#each priorities as priority (priority.value)}
                    <Select.Item value={priority.value}>
                      <div class="flex items-center">
                        <priority.icon
                          class="mr-2 h-4 w-4 text-muted-foreground"
                        />
                        <span>{priority.label}</span>
                      </div>
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      </div>

      <Dialog.Footer class="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onclick={() => (open = false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={$delayed}>
          {#if $delayed}
            <div
              class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
            ></div>
            Creating...
          {:else}
            Create task
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

