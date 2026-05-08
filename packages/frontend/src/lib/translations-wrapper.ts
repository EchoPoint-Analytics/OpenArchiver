// Wrapper to avoid $ prefix issues in Svelte 5
import { _, isLoading as i18nLoading, locale, locales, loadTranslations, init, getLocaleFromNavigator, addMessages } from 'sveltekit-i18n';
export const t = _;
export { i18nLoading, locale, locales, loadTranslations, init, getLocaleFromNavigator, addMessages };
