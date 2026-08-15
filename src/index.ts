/**
 * Completion-sound notification plugin, node half. Pure UI plugin: the empty
 * apply exists so the plugin appears in the host cordis.yml / Loader; the
 * browser half ships via exports["./client"], discovered through the
 * package.json dsh.client declaration. Settings persist in browser
 * localStorage, so there is no Host-side namespace to register.
 */

/** Host plugin body — no host-side behavior for this surface plugin. */
export function apply(): void {}
