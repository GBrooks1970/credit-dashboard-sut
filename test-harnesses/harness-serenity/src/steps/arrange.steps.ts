import { Given } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';

import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';
import { STAGE_MANAGER } from '../support/hooks.js';

const control = () => actorCalled(STAGE_MANAGER).abilityTo(ControlTheTestEnvironment);

Given('{actor} holds the {persona} persona', (actor: string, persona: string) => control().bind(actor.toLowerCase(), persona));

// The clock is frozen at 09:00:00 UTC on the date; any clock change drops every cached token (design section 7).
Given('today is {date}', (date: string) => control().setClock(`${date}T09:00:00Z`));
