<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { cn } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { superForm, defaults } from "sveltekit-superforms";
  import { arktype } from "sveltekit-superforms/adapters";
  import { type } from "arktype";
  import { authClient } from "$lib/auth-client.js";
  import { page } from "$app/stores";

  let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> =
    $props();

  // Check if we have a token in the URL (for reset flow) or if this is forgot password flow
  const token = $page.url.searchParams.get("token");
  const isResetFlow = !!token;

  // Schema for forgot password (email only)
  const forgotPasswordSchema = type({
    email: "string.email",
  });

  // Schema for reset password (new password + confirm password)
  const resetPasswordSchema = type({
    password: "string >= 8",
    confirmPassword: "string >= 8",
  });

  // Create separate forms for each flow
  const forgotPasswordForm = superForm(
    defaults(arktype(forgotPasswordSchema)),
    {
      validators: arktype(forgotPasswordSchema),
      multipleSubmits: "prevent",
      dataType: "json",
      SPA: true,
      onUpdate({ form, cancel }) {
        cancel();
        if (form.valid) {
          handleForgotPassword(form.data);
        }
      },
    },
  );

  const resetPasswordForm = superForm(defaults(arktype(resetPasswordSchema)), {
    validators: arktype(resetPasswordSchema),
    multipleSubmits: "prevent",
    dataType: "json",
    SPA: true,
    onUpdate({ form, cancel }) {
      cancel();
      if (form.valid) {
        handleResetPassword(form.data);
      }
    },
  });

  // Get form data stores for each form
  const forgotPasswordData = forgotPasswordForm.form;
  const resetPasswordData = resetPasswordForm.form;

  // Use the appropriate form based on the flow
  const currentForm = isResetFlow ? resetPasswordForm : forgotPasswordForm;
  const { enhance } = currentForm;

  let error = $state<string>("");
  let success = $state<string>("");
  let isLoading = $state(false);

  async function handleForgotPassword(data: { email: string }) {
    error = "";
    success = "";
    isLoading = true;

    try {
      const result = await authClient.forgetPassword({
        email: data.email,
      });

      if (result.error) {
        error =
          result.error.message ||
          "Failed to send reset email. Please try again.";
      } else {
        success =
          "Password reset email sent! Check your inbox for instructions.";
      }
    } catch (err) {
      error = "An unexpected error occurred. Please try again.";
    } finally {
      isLoading = false;
    }
  }

  async function handleResetPassword(data: {
    password: string;
    confirmPassword: string;
  }) {
    error = "";
    success = "";

    // Check if passwords match
    if (data.password !== data.confirmPassword) {
      error = "Passwords do not match.";
      return;
    }

    isLoading = true;

    try {
      const result = await authClient.resetPassword({
        newPassword: data.password,
        token: token!,
      });

      if (result.error) {
        error =
          result.error.message || "Failed to reset password. Please try again.";
      } else {
        success =
          "Password reset successfully! You can now sign in with your new password.";
        // Optionally redirect to login page after a delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (err) {
      error = "An unexpected error occurred. Please try again.";
    } finally {
      isLoading = false;
    }
  }
</script>

<div class={cn("flex flex-col gap-6", className)} {...restProps}>
  <Card.Root>
    <Card.Header class="text-center">
      <Card.Title class="text-xl">
        {isResetFlow ? "Reset your password" : "Forgot your password?"}
      </Card.Title>
      <Card.Description>
        {isResetFlow
          ? "Enter your new password below"
          : "Enter your email address and we'll send you a link to reset your password"}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance>
        <div class="grid gap-6">
          {#if success}
            <div class="rounded-md bg-green-50 p-4">
              <div class="text-sm text-green-700">{success}</div>
            </div>
          {:else}
            <div class="grid gap-6">
              {#if isResetFlow}
                <!-- Reset Password Form -->
                <Form.Field form={resetPasswordForm} name="password">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label>New Password</Form.Label>
                      <Input
                        {...props}
                        type="password"
                        placeholder="Enter your new password"
                        bind:value={$resetPasswordData.password}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
                <Form.Field form={resetPasswordForm} name="confirmPassword">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label>Confirm New Password</Form.Label>
                      <Input
                        {...props}
                        type="password"
                        placeholder="Confirm your new password"
                        bind:value={$resetPasswordData.confirmPassword}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              {:else}
                <!-- Forgot Password Form -->
                <Form.Field form={forgotPasswordForm} name="email">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label>Email</Form.Label>
                      <Input
                        {...props}
                        type="email"
                        placeholder="m@example.com"
                        bind:value={$forgotPasswordData.email}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              {/if}

              {#if error}
                <div class="rounded-md bg-red-50 p-4">
                  <div class="text-sm text-red-700">{error}</div>
                </div>
              {/if}

              <Button type="submit" class="w-full" disabled={isLoading}>
                {#if isLoading}
                  {isResetFlow
                    ? "Resetting password..."
                    : "Sending reset email..."}
                {:else}
                  {isResetFlow ? "Reset password" : "Send reset email"}
                {/if}
              </Button>
            </div>
          {/if}

          <div class="text-center text-sm">
            Remember your password?
            <a href="/login" class="underline underline-offset-4">
              Back to sign in
            </a>
          </div>
        </div>
      </form>
    </Card.Content>
  </Card.Root>
</div>
