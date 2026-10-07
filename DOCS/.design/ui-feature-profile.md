---
version: 5
created: 2026-10-07T12:50Z
supersedes: v4 (2026-10-04T23:19Z); earlier versions are in git history (DR-040)
project: credit-dashboard-sut
type: ui-feature-spec
language: en-GB
---

# Credit Dashboard SUT: UI Feature Spec, My Profile

**Status:** Phase 0 draft, for review
**Parent:** [UI specification](ui-specification.md) (conventions in its section 4 apply here unchanged)
**Changes in v5:** the mobile tile gains a status badge, `profile-mobile-badge`, as the email tile has (CDS-18 confirmation pass).
**Changes in v4:** decision brief 3 applied: PR-04 amended (the address already held is not a change, DR-027); new rules PR-09 resend limit (DR-024), PR-10 one-time code (DR-025), PR-11 wrong-code lock-out (DR-026); the email and mobile operations are in the contract (v6, CDS-11).
**Changes in v3:** decision brief 2 applied: no survey of the source sub-pages; the designs in section 4 stand (DR-021); Release 3 builds email and mobile, the rest are stretch (DR-022); explicit Save and Cancel confirmed (DR-023). No rule changed.
**Changes in v2:** *Release* replaces *Phase* for page scheduling (DR-015); section 6 records that the page-level endpoints are now in the contract (CDS-11). No rule changed.
**Source:** structure of the source app's account 'Personal details' page, surveyed 4 October 2026. Structure only; no personal data copied. Sub-pages were **not** opened (see section 7).

---

## 1. Purpose and scope

The profile page is the customer's own account record: who they are to the app, how to contact them, and the extra details they choose to share. It is a different thing from the report's 'Personal details' page in the main UI spec (section 6.7), which shows what the bureau holds and is read-only.

| | Account profile (this spec) | Report personal details (UI spec 6.7) |
| --- | --- | --- |
| Owner of the data | The customer, via the app | The bureau |
| Editable | Partly (preferred name, contact details, optional details) | No |
| Route | `/my-account/profile` | `/credit-health/report/:bureauId/personal-details` |
| Reached from | Header 'My account' menu | Searches and details tiles |

For testing, the page adds what the dashboard lacks: inline editing, read-only versus editable fields side by side, verification states, empty values, and sensitive data that must be handled carefully in fixtures and logs.

Release: 3 (after the drilldown pages; DR-015), unless the owner promotes it.

## 2. Page layout

Route `/my-account/profile`. Two stacked regions under the global header:

1. **Identity header:** legal name (heading), an information button explaining why the name cannot be changed here, date of birth, member-since date.
2. **Details list:** preferred name (inline edit), then five navigation tiles: Email, Mobile, Address, Employment, Finances. Each tile opens its own sub-page.

## 3. Element inventory

### 3.1 Identity header

| Element | Role / type | data-testid | Behaviour / assertion |
| --- | --- | --- | --- |
| Header image | img, decorative | `profile-header-image` | `alt=""` (decorative); see bug flag `decorative-alt` |
| Legal name | heading level 1 | `profile-legal-name` | From the account record; not editable here |
| Name information | button, `aria-expanded` | `profile-name-info` | Opens a popover: the legal name matches the credit report, so changes go through the report's corrections route |
| Name information popover | dialog (non-modal) | `profile-name-info-panel` | Escape and outside click close it; focus returns to the button |
| Date of birth | term / definition | `profile-dob` | en-GB long date, e.g. `12 March 1985`; read-only |
| Member since | term / definition | `profile-member-since` | en-GB long date; read-only |

### 3.2 Preferred name

| Element | Role / type | data-testid | Behaviour / assertion |
| --- | --- | --- | --- |
| Section heading | heading | `profile-preferred-heading` | 'Preferred name' |
| Explanation | text | `profile-preferred-hint` | States the preferred name is used in the app only and never appears on the credit report |
| Input | textbox, labelled | `profile-preferred-input` | Placeholder 'Enter your preferred name'; current value pre-filled when set |
| Save | button | `profile-preferred-save` | Shown once the value changes; disabled while saving |
| Cancel | button | `profile-preferred-cancel` | Restores the stored value |
| Status | status, `aria-live="polite"` | `profile-preferred-status` | 'Saved' on success; error text on failure |
| Field error | text, `aria-describedby` | `profile-preferred-error` | Rule PR-02 |

The source shows the textbox with no visible Save control; how it commits is unknown. This spec chooses an explicit Save and Cancel, because implicit save-on-blur is harder to test reliably and easy to lose data with. Confirmed by the owner (DR-023).

### 3.3 Detail tiles

Each tile is a link to its sub-page, showing a label and a one-line summary.

| Tile | data-testid | Summary shown | States to cover |
| --- | --- | --- | --- |
| Email | `profile-tile-email` | Address plus badge `profile-email-badge` | Verified / Unverified |
| Mobile | `profile-tile-mobile` | Masked number (`•••• ••• 123`) plus badge `profile-mobile-badge` | 'Not added' / Unverified / Verified (the badge shows Unverified or Verified) |
| Address | `profile-tile-address` | First line and postcode of the current address | Not added / one address / history |
| Employment | `profile-tile-employment` | Status (e.g. 'Employed full time') | Not added / set |
| Finances | `profile-tile-finances` | 'Added' or 'Not added', never figures | Not added / added |

In the source, the Address, Employment and Finances tiles show no summary at all. This spec adds summaries so the overview carries state that tests can assert; Finances deliberately shows no amounts on the overview.

## 4. Sub-pages (designed, not surveyed)

The source sub-pages were not opened, because they hold the owner's real contact, address and financial details. These designs come from common patterns, and the owner decided to keep them rather than survey the source (DR-021). Release 3 builds **email** and **mobile**; **address**, **employment** and **finances** are stretch: specified here, not built until promoted (DR-022). The finances tile still shows 'Added' or 'Not added' from `GET /me/profile`.

| Sub-page | Route | Content | Test interest |
| --- | --- | --- | --- |
| Email | `/my-account/profile/email` | Current address, change form, 'Resend verification' | Format validation, verification state, resend rate limit |
| Mobile | `/my-account/profile/mobile` | Add or change number, mock one-time code (always `123456`, stated beside the code field; the demo sends no message, DR-025) | UK number validation, code entry, expiry via clock control |
| Address | `/my-account/profile/address` | Current address, previous addresses with dates, add address (postcode lookup against a fixed fake dataset) | Multi-step form, date ranges, no overlap (PR-05) |
| Employment | `/my-account/profile/employment` | Status select, optional employer and start date | Conditional fields by status |
| Finances | `/my-account/profile/finances` | Annual income, monthly housing cost (synthetic), with an explanation of why it is asked | Currency input, ranges, sensitive-data display |

Each sub-page has Save and Cancel, returns to the profile on save, and shows the change on the tile.

## 5. Rules

| ID | Rule |
| --- | --- |
| PR-01 | Legal name and date of birth are read-only in the app. |
| PR-02 | Preferred name: optional; trimmed; 1 to 30 characters when present; letters, spaces, hyphens and apostrophes only. Empty clears it. |
| PR-03 | When set, the preferred name replaces the legal first name in greetings across the app (e.g. header menu); it never appears on report pages. |
| PR-04 | Changing the email sets it to Unverified until the mock verification link is followed, and sends that link. Submitting the address already held is not a change: address and status are kept (DR-027). |
| PR-05 | Address history has no overlapping date ranges; exactly one address is current. |
| PR-06 | Mobile numbers are UK format (`07` plus 9 digits, or `+447` plus 9 digits) and stored normalised to `+44`. |
| PR-07 | Finance figures are integer minor units (DR-004) and are never shown on the profile overview. |
| PR-08 | Profile data never appears in URLs, page titles or client-side logs. |
| PR-09 | A verification link may be resent once at least 60 seconds have passed since the last link was sent, on the controlled clock; sooner is refused (429, `Retry-After`). An email already verified is not resent (DR-024). |
| PR-10 | Adding or changing a mobile number stores it as Unverified and issues a six-digit code, valid while less than 10 minutes have passed since issue. The correct code marks the number Verified; an expired code is refused. The code is always `123456` (DR-025). |
| PR-11 | Each wrong code is refused; the third wrong code voids the code, and a new one must be requested by adding the number again. A code submitted with nothing pending is refused (DR-026). |

## 6. API needs

The page-level operations, the four email and mobile operations and `POST /__test/verify-email` are in the contract (v6; API spec section 6.6, CDS-11). The address, employment and finances operations are stretch (DR-022):

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/me/profile` | Identity header, preferred name, tile summaries |
| PATCH | `/me/profile/preferred-name` | Set or clear (PR-02) |
| PUT | `/me/profile/email` | Change email (PR-04) |
| POST | `/me/profile/email/verification` | Resend verification (rate-limited) |
| PUT | `/me/profile/mobile` | Add or change number; returns a challenge |
| POST | `/me/profile/mobile/verification` | Submit the one-time code |
| GET, POST | `/me/profile/addresses` | List, add (PR-05) |
| PUT | `/me/profile/employment` | Set status and optional fields |
| PUT | `/me/profile/finances` | Set income and housing cost (PR-07) |
| POST | `/__test/verify-email` | Test control: mark email verified without a link |

Persona fixtures gain a `profile` block. All values are synthetic (DR-010): invented names, `example.com` emails, Ofcom drama-range mobile numbers (`07700 900000` to `07700 900999`), and fictional addresses.

## 7. Bug flags

| Flag | Effect | Expected catch |
| --- | --- | --- |
| `nested-button` | Information button rendered inside another button (seen in the source) | HTML validity / axe-core |
| `decorative-alt` | Header image given descriptive alt text (seen in the source) | axe-core / accessibility tree |
| `preferred-on-report` | Preferred name leaks onto report pages (breaks PR-03) | UI scenario |
| `preferred-no-trim` | Leading and trailing spaces kept | Validation scenario |
| `email-stays-verified` | Changing email keeps the Verified badge (breaks PR-04) | State scenario |
| `pii-in-title` | Legal name placed in the page title (breaks PR-08) | Security / privacy scenario |
| `lost-edit` | Navigating away discards an unsaved preferred name without warning | Interaction scenario |

## 8. Feature file

Seed scenarios: [`features-shared/ui/profile.feature`](../../features-shared/ui/profile.feature).

## 9. Open questions

None open. Resolved by decision brief 2 on 4 October 2026: explicit save (DR-023); Release 3 scope (DR-022); no survey of the source sub-pages (DR-021).
