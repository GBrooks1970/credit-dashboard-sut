// version: 1 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// Display names for the contract's AccountType values (glossary section 4.2: the plural display names).
import type { components } from '@credit-dashboard-sut/api-client';

export type AccountType = components['schemas']['AccountType'];

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  creditcard: 'Credit cards',
  loan: 'Loans',
  mortgage: 'Mortgages',
  currentaccount: 'Current accounts',
  telecomsandutilities: 'Utilities and telecoms',
  lineofcredit: 'Credit accounts',
};
