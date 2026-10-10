import { When } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';

import { CallAnApi } from '../abilities/CallAnApi.js';

const api = (actor: string) => actorCalled(actor).abilityTo(CallAnApi);

When('{actor} asks for the score from {bureau}', async (actor: string, bureauId: string) => {
    await api(actor).request('getScore', { path: { bureauId } });
});

When('{actor} asks for the score history from {bureau} over {range}', async (actor: string, bureauId: string, range: string) => {
    await api(actor).request('getScoreHistory', { path: { bureauId }, query: { range } });
});
