<script lang="ts">
	import { page } from '$app/state';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { CornerDownLeft, ArrowRight } from '@lucide/svelte';
	import { useIsMac } from '$lib/hooks/use-is-mac.svelte.js';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import {
		type CommandContext,
		type CommandItem,
		getVisibleCommands,
		getOrganizationSwitchCommands
	} from '$lib/commands/index.js';

	type Organization = {
		id: string;
		name: string;
		slug?: string | null;
		logo?: string | null;
		metadata?: Record<string, unknown> | null;
	};

	type ActiveOrganization = { id: string; slug?: string | null } | null | undefined;

	let {
		open = $bindable(false),
		organizations = [] as Organization[],
		activeOrganization = null as ActiveOrganization,
		isAuthenticated = true
	} = $props<{
		open?: boolean;
		organizations?: Organization[];
		activeOrganization?: ActiveOrganization;
		isAuthenticated?: boolean;
	}>();

	let highlightedCommand = $state<CommandItem | null>(null);
	let paletteMode = $state<'default' | 'change-org'>('default');
	let commandValue = $state('');

	let inputPlaceholder = $derived(
		paletteMode === 'change-org'
			? 'Select an organization to switch'
			: 'Type a command or search...'
	);

	let inputValue = $state('');

	// Detect if Mac for keyboard shortcuts
	const isMac = useIsMac();

	// Create command context based on current state
	const commandContext = $derived<CommandContext>({
		pathname: page.url.pathname,
		params: page.params as Record<string, string>,
		searchParams: page.url.searchParams,
		isAuthenticated,
		activeOrganization,
		organizations,
		isMac
	});

	// Get visible commands based on context
	const visibleCommands = $derived(
		paletteMode === 'change-org'
			? getOrganizationSwitchCommands(commandContext)
			: getVisibleCommands(commandContext)
	);

	// Group commands by category for display
	const navigationCommands = $derived(
		visibleCommands.filter((cmd) => cmd.category === 'navigation')
	);

	const pageSpecificCommands = $derived(
		visibleCommands.filter((cmd) => cmd.category === 'page-specific')
	);

	const quickActions = $derived(
		visibleCommands.filter((cmd) => cmd.category === 'action' && cmd.id !== 'back-to-commands')
	);

	const organizationCommands = $derived(
		visibleCommands.filter((cmd) => cmd.category === 'organization')
	);

	const backCommand = $derived(visibleCommands.find((cmd) => cmd.id === 'back-to-commands'));

	function handleKeydown(e: KeyboardEvent) {
		if (open) {
			// Navigation shortcuts for command palette
			if (e.key === 'n' && e.ctrlKey) {
				e.preventDefault();
				// Navigate down in command palette (handled by Command component)
				return;
			}
			if (e.key === 'p' && e.ctrlKey) {
				e.preventDefault();
				// Navigate up in command palette (handled by Command component)
				return;
			}

			// Command shortcuts
			if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				void executeCommand('nav-dashboard');
			}
			if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				void executeCommand('nav-customers');
			}
			if (e.key === 'u' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				void executeCommand('nav-account');
			}
			if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				void executeCommand('action-refresh');
			}
		}
	}

	async function executeCommand(commandId: string) {
		const command = visibleCommands.find((cmd) => cmd.id === commandId);
		if (command && !command.disabled) {
			// Handle special commands
			if (command.id === 'action-change-organization') {
				paletteMode = 'change-org';
				commandValue = '';
				highlightedCommand = null;
				inputValue = '';
				return;
			}

			if (command.id === 'back-to-commands') {
				paletteMode = 'default';
				commandValue = '';
				highlightedCommand = null;
				inputValue = '';
				return;
			}

			if (command.id === 'action-shortcuts') {
				showKeyboardShortcuts();
				// Reset state before closing
				commandValue = '';
				inputValue = '';
				paletteMode = 'default';
				highlightedCommand = null;
				open = false;
				return;
			}

			await command.action();
			const shouldClose = command.closeOnExecute ?? true;
			if (shouldClose) {
				// Reset all state when closing
				commandValue = '';
				inputValue = '';
				paletteMode = 'default';
				highlightedCommand = null;
				open = false;
			} else {
				// Also reset search when staying open but executing a command
				highlightedCommand = null;
				commandValue = '';
				inputValue = '';
			}
		}
	}

	function showKeyboardShortcuts() {
		const modKey = isMac ? '⌘' : 'Ctrl+';
		const shortcuts = visibleCommands
			.filter((cmd) => cmd.shortcut)
			.map((cmd) => `${cmd.shortcut} - ${cmd.label}`)
			.join('\n');

		const pageSpecificShortcuts =
			pageSpecificCommands.length > 0
				? `\n\nOn this page:\n${pageSpecificCommands
						.filter((cmd) => cmd.shortcut)
						.map((cmd) => `${cmd.shortcut} - ${cmd.label}`)
						.join('\n')}`
				: '';

		alert(
			`Keyboard Shortcuts:\n\n${modKey}K - Open Command Palette\n\nGeneral:\n${shortcuts}${pageSpecificShortcuts}\n\nWhen Command Palette is open:\nCtrl+N - Navigate down\nCtrl+P - Navigate up\n? - Show this help`
		);
	}

	// Filtering is handled internally by the Command component.

	// Get the action text for the highlighted command
	const footerActionText = $derived.by(() => {
		if (!highlightedCommand) {
			return paletteMode === 'change-org' ? 'Select Organization' : '';
		}

		if (highlightedCommand.category === 'navigation') {
			return 'Go to Page';
		} else if (highlightedCommand.category === 'page-specific') {
			return 'Execute Action';
		} else if (highlightedCommand.category === 'organization') {
			return highlightedCommand.disabled ? 'Current Organization' : 'Switch Organization';
		} else {
			return 'Run Command';
		}
	});

	// Reset all state when dialog opens or closes
	$effect(() => {
		if (open) {
			// Reset when opening
			highlightedCommand = null;
			paletteMode = 'default';
			commandValue = '';
			inputValue = '';
		} else {
			// Also reset when closing to ensure clean state for next open
			// Small delay to allow closing animation
			setTimeout(() => {
				highlightedCommand = null;
				paletteMode = 'default';
				commandValue = '';
				inputValue = '';
			}, 100);
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		showCloseButton={false}
		class="rounded-xl border-none bg-clip-padding p-2 pb-11 shadow-2xl ring-4 ring-neutral-200/80 dark:bg-neutral-900 dark:ring-neutral-800"
		onkeydown={handleKeydown}
	>
		<Dialog.Header class="sr-only">
			<Dialog.Title>Command Palette</Dialog.Title>
			<Dialog.Description>Search for commands and actions</Dialog.Description>
		</Dialog.Header>
		<Command.Root
			bind:value={commandValue}
			class="rounded-none bg-transparent **:data-[slot=command-input]:!h-9 **:data-[slot=command-input]:py-0 **:data-[slot=command-input-wrapper]:mb-0 **:data-[slot=command-input-wrapper]:!h-9 **:data-[slot=command-input-wrapper]:rounded-md **:data-[slot=command-input-wrapper]:border **:data-[slot=command-input-wrapper]:border-input **:data-[slot=command-input-wrapper]:bg-input/50"
		>
			<Command.Input placeholder={inputPlaceholder} autofocus bind:value={inputValue} />
			<Command.List class="no-scrollbar min-h-80 scroll-pt-2 scroll-pb-1.5">
				<Command.Empty class="py-12 text-center text-sm text-muted-foreground">
					No results found.
				</Command.Empty>

				{#if paletteMode === 'change-org'}
					{#if organizationCommands.length > 0}
						<Command.Group
							heading="Organizations"
							class="!p-0 [&_[data-command-group-heading]]:scroll-mt-16 [&_[data-command-group-heading]]:!p-3 [&_[data-command-group-heading]]:!pb-1"
						>
							{#each organizationCommands as command (command.id)}
								<Command.Item
									disabled={command.disabled}
									value={`${command.label} ${(command.keywords ?? []).join(' ')}`}
									onSelect={() => void executeCommand(command.id)}
									class="relative flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
								>
									{@const Icon = command.icon}
									<Icon class="size-4 shrink-0" />
									<span class="flex-1 truncate">{command.label}</span>
									{#if command.badge}
										<span class="ml-auto text-xs font-medium text-muted-foreground"
											>{command.badge}</span
										>
									{/if}
								</Command.Item>
							{/each}
						</Command.Group>
					{/if}

					{#if backCommand}
						<Command.Separator />
						<Command.Group
							heading="Actions"
							class="!p-0 [&_[data-command-group-heading]]:!p-3 [&_[data-command-group-heading]]:!pb-1"
						>
							<Command.Item
								value={`${backCommand.label} ${(backCommand.keywords ?? []).join(' ')}`}
								onSelect={() => void executeCommand(backCommand.id)}
								class="relative flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none select-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
							>
								{@const Icon = backCommand.icon}
								<Icon class="size-4 shrink-0" />
								<span class="flex-1 truncate">{backCommand.label}</span>
							</Command.Item>
						</Command.Group>
					{/if}
				{:else}
					{#if navigationCommands.length > 0}
						<Command.Group
							heading="Navigation"
							class="!p-0 [&_[data-command-group-heading]]:scroll-mt-16 [&_[data-command-group-heading]]:!p-3 [&_[data-command-group-heading]]:!pb-1"
						>
							{#each navigationCommands as command (command.id)}
								<Command.Item
									disabled={command.disabled}
									value={`${command.label} ${(command.keywords ?? []).join(' ')}`}
									onSelect={() => void executeCommand(command.id)}
									class="relative flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
								>
									<ArrowRight class="size-4 shrink-0" />
									<span class="flex-1 truncate">{command.label}</span>
									{#if command.badge}
										<span class="ml-auto text-xs font-medium text-muted-foreground"
											>{command.badge}</span
										>
									{:else if command.shortcut}
										<Command.Shortcut>{command.shortcut}</Command.Shortcut>
									{/if}
								</Command.Item>
							{/each}
						</Command.Group>
					{/if}

					{#if pageSpecificCommands.length > 0}
						<Command.Separator />
						<Command.Group
							heading="Page Actions"
							class="!p-0 [&_[data-command-group-heading]]:!p-3 [&_[data-command-group-heading]]:!pb-1"
						>
							{#each pageSpecificCommands as command (command.id)}
								<Command.Item
									disabled={command.disabled}
									value={`${command.label} ${(command.keywords ?? []).join(' ')}`}
									onSelect={() => void executeCommand(command.id)}
									class="relative flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
								>
									{@const Icon = command.icon}
									<Icon class="size-4 shrink-0" />
									<span class="flex-1 truncate">{command.label}</span>
									{#if command.badge}
										<span class="ml-auto text-xs font-medium text-muted-foreground"
											>{command.badge}</span
										>
									{:else if command.shortcut}
										<Command.Shortcut>{command.shortcut}</Command.Shortcut>
									{/if}
								</Command.Item>
							{/each}
						</Command.Group>
					{/if}

					{#if quickActions.length > 0}
						<Command.Separator />
						<Command.Group
							heading="Quick Actions"
							class="!p-0 [&_[data-command-group-heading]]:!p-3 [&_[data-command-group-heading]]:!pb-1"
						>
							{#each quickActions as command (command.id)}
								<Command.Item
									disabled={command.disabled}
									value={`${command.label} ${(command.keywords ?? []).join(' ')}`}
									onSelect={() => void executeCommand(command.id)}
									class="relative flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
								>
									{@const Icon = command.icon}
									<Icon class="size-4 shrink-0" />
									<span class="flex-1 truncate">{command.label}</span>
									{#if command.badge}
										<span class="ml-auto text-xs font-medium text-muted-foreground"
											>{command.badge}</span
										>
									{:else if command.shortcut}
										<Command.Shortcut>{command.shortcut}</Command.Shortcut>
									{/if}
								</Command.Item>
							{/each}
						</Command.Group>
					{/if}
				{/if}
			</Command.List>
		</Command.Root>
		<div
			class="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center gap-2 rounded-b-xl border-t border-t-neutral-100 bg-neutral-50 px-4 text-xs font-medium text-muted-foreground dark:border-t-neutral-700 dark:bg-neutral-800"
		>
			<div class="flex items-center gap-2">
				<Kbd.Root><CornerDownLeft class="size-3" /></Kbd.Root>
				{#if footerActionText}
					{footerActionText}
				{:else}
					Select Command
				{/if}
			</div>
			<Separator orientation="vertical" class="!h-4" />
			<div class="flex items-center gap-1">
				<Kbd.Root>{isMac ? '⌘' : 'Ctrl'}</Kbd.Root>
				<Kbd.Root class="aspect-square">K</Kbd.Root>
				Command Palette
			</div>
			{#if highlightedCommand?.shortcut}
				<Separator orientation="vertical" class="!h-4" />
				<div class="flex items-center gap-1">
					Shortcut: {highlightedCommand.shortcut}
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
