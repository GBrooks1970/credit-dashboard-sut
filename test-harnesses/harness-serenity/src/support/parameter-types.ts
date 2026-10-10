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

/** Singular or plural account type phrases (glossary section 4.2), as the contract's AccountType value. */
const accountTypes: Record<string, string> = {
    'credit card': 'creditcard', 'credit cards': 'creditcard',
    loan: 'loan', loans: 'loan',
    mortgage: 'mortgage', mortgages: 'mortgage',
    'utilities and telecoms account': 'telecomsandutilities', 'utilities and telecoms': 'telecomsandutilities',
    'credit account': 'lineofcredit', 'credit accounts': 'lineofcredit',
};
defineParameterType({
    name: 'accountType',
    regexp: /credit cards?|loans?|mortgages?|utilities and telecoms account|utilities and telecoms|credit accounts?/,
    transformer: (value: string) => accountTypes[value]!,
});

/** A provider's display name from the bound persona, unquoted: capitalised words (Lender X, Harbour Bank). */
defineParameterType({ name: 'provider', regexp: /[A-Z][A-Za-z]*(?: [A-Z][A-Za-z]*)*/, transformer: (value: string) => value });

/** BR-12: each pattern is arranged by one checked override sample (glossary section 3). Camel case: the glossary calls it {payment pattern}. */
const paymentSamples: Record<string, string> = {
    'all on time': 'br12-all-on-time-2025.json',
    'on time, apart from one missed month': 'br12-payments-2025.json',
    'not reported in any month': 'br12-no-data-2025.json',
    'on time in the months reported': 'br12-part-year-2025.json',
};
defineParameterType({
    name: 'paymentPattern',
    regexp: /all on time|on time, apart from one missed month|not reported in any month|on time in the months reported/,
    transformer: (value: string) => paymentSamples[value]!,
});
