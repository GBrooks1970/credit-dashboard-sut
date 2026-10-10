import { defineParameterType } from '@cucumber/cucumber';

// Glossary section 2. Each type is defined once, here; a type is added when the first step needs it.

const months = 'January|February|March|April|May|June|July|August|September|October|November|December';
const monthNumber = (name: string) => String(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(name) + 1).padStart(2, '0');

/** A test user (the first name), not a persona. */
defineParameterType({ name: 'actor', regexp: /Alex|Sam/, transformer: (name: string) => name });

/** The contract's Persona enum, quoted in the step. */
defineParameterType({
    name: 'persona',
    regexp: /"(?:excellent|struggling|thin-file|boundary|drilldown|error|slow)"/,
    transformer: (quoted: string) => quoted.slice(1, -1),
});

/** A bureau display name, resolved to the bureau ID. */
defineParameterType({
    name: 'bureau',
    regexp: /"Bureau [AB]"/,
    transformer: (quoted: string) => (quoted === '"Bureau A"' ? 'bureau-a' : 'bureau-b'),
});

/** Money in minor units, an integer: -44.00 becomes -4400 (DR-004). Never a float. */
defineParameterType({
    name: 'money',
    regexp: /-?\d+\.\d{2}/,
    transformer: (value: string) => Number(value.replace('.', '')),
});

/** A percentage as a number: 29.9% becomes 29.9. */
defineParameterType({ name: 'percent', regexp: /-?\d+(?:\.\d+)?%/, transformer: (value: string) => Number(value.slice(0, -1)) });

/** A long-form date as YYYY-MM-DD. */
defineParameterType({
    name: 'date',
    regexp: new RegExp(`\\d{1,2} (?:${months}) \\d{4}`),
    transformer: (value: string) => {
        const [day, month, year] = value.split(' ');
        return `${year}-${monthNumber(month!)}-${day!.padStart(2, '0')}`;
    },
});

/** A calendar month as YYYY-MM. */
defineParameterType({
    name: 'month',
    regexp: new RegExp(`(?:${months}) \\d{4}`),
    transformer: (value: string) => {
        const [month, year] = value.split(' ');
        return `${year}-${monthNumber(month!)}`;
    },
});

defineParameterType({ name: 'year', regexp: /\d{4}/, transformer: (value: string) => Number(value) });
defineParameterType({ name: 'count', regexp: /\d+/, transformer: (value: string) => Number(value) });
defineParameterType({ name: 'time', regexp: /\d{2}:\d{2}:\d{2}/, transformer: (value: string) => value });
defineParameterType({ name: 'code', regexp: /\d{6}/, transformer: (value: string) => value });

/** The score-history range: the contract's 3m, 6m, 1y. */
defineParameterType({
    name: 'range',
    regexp: /3 months|6 months|1 year/,
    transformer: (value: string) => ({ '3 months': '3m', '6 months': '6m', '1 year': '1y' })[value]!,
});
