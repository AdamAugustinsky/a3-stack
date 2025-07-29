<script lang="ts">
  import SignupForm from "$lib/components/signup-form.svelte";
</script>

<svelte:head>
  <title>Sign Up</title>
  <meta name="description" content="Create your account" />
</svelte:head>

<div
  class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
>
  <div class="w-full max-w-md">
    <SignupForm />
  </div>
</div>

