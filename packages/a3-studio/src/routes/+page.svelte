<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { open } from "@tauri-apps/plugin-dialog";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Checkbox from "$lib/components/ui/checkbox.svelte";
  import TemplateCard from "$lib/components/template-card.svelte";

  interface Template {
    name: string;
    displayName: string;
    description: string;
    features: string[];
  }

  let projectName = $state("my-a3-app");
  let selectedTemplate = $state("kysely");
  let directory = $state("");
  let initGit = $state(true);
  let installDeps = $state(true);
  let creating = $state(false);
  let error = $state("");
  let success = $state("");

  const templates: Template[] = [
    {
      name: "kysely",
      displayName: "A3 Stack + Kysely",
      description: "SvelteKit 5 + Better Auth + Kysely with PostgreSQL",
      features: [
        "Type-safe SQL",
        "PostgreSQL",
        "Docker",
        "Better Auth",
        "shadcn-svelte",
        "TailwindCSS v4",
      ],
    },
  ];

  async function selectDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select project directory",
      });
      if (selected) {
        directory = selected as string;
      }
    } catch (e) {
      console.error("Failed to open directory picker:", e);
    }
  }

  async function createProject() {
    if (!projectName || !directory) {
      error = "Please provide a project name and select a directory";
      return;
    }

    creating = true;
    error = "";
    success = "";

    try {
      const result = await invoke<string>("create_project", {
        name: projectName,
        template: selectedTemplate,
        directory,
        initGit,
        installDeps,
      });
      success = `Project created at ${result}`;
    } catch (e) {
      error = `Failed to create project: ${e}`;
    } finally {
      creating = false;
    }
  }

  function validateProjectName(name: string): boolean {
    return /^[a-z0-9-_]+$/i.test(name);
  }

  let isValidName = $derived(validateProjectName(projectName));
  let canCreate = $derived(isValidName && directory && !creating);
</script>

<main class="container mx-auto max-w-2xl px-4 py-8">
  <div class="mb-8 text-center">
    <h1 class="text-3xl font-bold tracking-tight">A3 Studio</h1>
    <p class="mt-2 text-muted-foreground">Create a new A3 Stack project</p>
  </div>

  <div class="space-y-6">
    <!-- Project Name -->
    <div class="space-y-2">
      <label for="project-name" class="text-sm font-medium">Project Name</label>
      <Input
        id="project-name"
        bind:value={projectName}
        placeholder="my-a3-app"
        class={!isValidName && projectName ? "border-destructive" : ""}
      />
      {#if !isValidName && projectName}
        <p class="text-sm text-destructive">
          Project name can only contain letters, numbers, dashes, and underscores
        </p>
      {/if}
    </div>

    <!-- Directory -->
    <div class="space-y-2">
      <label for="directory" class="text-sm font-medium">Location</label>
      <div class="flex gap-2">
        <Input
          id="directory"
          value={directory}
          placeholder="Select a directory..."
          readonly
          class="flex-1"
        />
        <Button variant="outline" onclick={selectDirectory}>Browse</Button>
      </div>
      {#if directory}
        <p class="text-sm text-muted-foreground">
          Project will be created at: {directory}/{projectName}
        </p>
      {/if}
    </div>

    <!-- Template Selection -->
    <div class="space-y-2">
      <label class="text-sm font-medium">Template</label>
      <div class="grid gap-4 sm:grid-cols-2">
        {#each templates as template}
          <TemplateCard
            {template}
            selected={selectedTemplate === template.name}
            onselect={() => (selectedTemplate = template.name)}
          />
        {/each}
      </div>
    </div>

    <!-- Options -->
    <div class="space-y-3 rounded-lg border p-4">
      <label class="flex items-center gap-3 cursor-pointer">
        <Checkbox bind:checked={initGit} id="init-git" />
        <span class="text-sm">Initialize git repository</span>
      </label>
      <label class="flex items-center gap-3 cursor-pointer">
        <Checkbox bind:checked={installDeps} id="install-deps" />
        <span class="text-sm">Install dependencies</span>
      </label>
    </div>

    <!-- Error/Success Messages -->
    {#if error}
      <div class="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="rounded-lg border border-green-500 bg-green-500/10 p-4 text-sm text-green-600">
        {success}
      </div>
    {/if}

    <!-- Create Button -->
    <Button onclick={createProject} disabled={!canCreate} class="w-full" size="lg">
      {#if creating}
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Creating...
      {:else}
        Create Project
      {/if}
    </Button>
  </div>
</main>
