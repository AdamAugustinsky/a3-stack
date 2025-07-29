<script lang="ts">
  import PasswordResetForm from "$lib/components/password-reset-form.svelte";
</script>

<svelte:head>
  <title>Forgot Password</title>
  <meta name="description" content="Reset your forgotten password" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-md">
    <PasswordResetForm />
  </div>
</div>