import { Wait, type Actor } from '@serenity-js/core';
import { Click, Enter, isVisible, Navigate } from '@serenity-js/web';

import { testUser } from '../fixtures/load.js';
import { byTestId } from './steps/login.steps.js';

/**
 * Opens an address as a new visit. The token is in memory only, so a new visit has no session: the app sends the visitor to
 * the sign-in page, and after sign-in brings them back to the address they asked for. `ready` is the hook of an element that
 * shows the page has loaded.
 */
export async function openAddress(actor: Actor, address: string, ready: string): Promise<void> {
    const user = testUser(actor.name.toLowerCase());
    await actor.attemptsTo(Navigate.to(address), Wait.until(byTestId('login-submit'), isVisible()));
    await actor.attemptsTo(
        Enter.theValue(user.username).into(byTestId('login-username')),
        Enter.theValue(user.password).into(byTestId('login-password')),
        Click.on(byTestId('login-submit')),
        Wait.until(byTestId(ready), isVisible()),
    );
}

/** The pound figure as a customer reads it on a detail: with pence, and a negative amount as 'in credit' (UI specification 4.2, DR-018). */
export function poundsAndPence(amountMinor: number): string {
    const text = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amountMinor) / 100);
    return amountMinor < 0 ? `${text} in credit` : text;
}

/** The pound figure as a customer reads it on a summary: no pence (UI specification 4.2). */
export function poundsNoPence(amountMinor: number): string {
    const text = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(amountMinor) / 100);
    return amountMinor < 0 ? `${text} in credit` : text;
}
