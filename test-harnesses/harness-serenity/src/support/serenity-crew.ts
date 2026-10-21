// version: 2 | created: 2026-10-20T08:30Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The Serenity/JS crew of both profiles (CDS-44, P6a): the console reporter, and the two members that write the Serenity BDD JSON the published
// report is built from (ArtifactArchiver stores each scenario's outcome as JSON, SerenityBDDReporter shapes it for the Serenity BDD CLI). The
// JSON goes to reports/serenity/<profile>/, emptied at the start of the run so a report never mixes two runs. It is written by every whole `api` or
// `ui` run (see report/switch.ts), with or without Java; the HTML needs Java and is made by scripts/report.mjs.
import fs from 'node:fs';
import path from 'node:path';

import { ConsoleReporter } from '@serenity-js/console-reporter';
import { ArtifactArchiver, type configure } from '@serenity-js/core';
import { SerenityBDDReporter } from '@serenity-js/serenity-bdd';

import { writesSerenityJson } from '../report/switch.js';

export type Profile = 'api' | 'ui';

/** The folder of a profile's Serenity JSON, relative to the harness (the working directory of every run). */
export const reportFolder = (profile: Profile) => path.join('reports', 'serenity', profile);

/**
 * `configure` takes the crew typed from the CommonJS build of @serenity-js/core, and @serenity-js/serenity-bdd is typed from the ES module build of it, so
 * TypeScript sees two Stage classes. At run time there is one package instance, and the reporter works as the Serenity/JS documentation shows.
 */
type Crew = NonNullable<Parameters<typeof configure>[0]['crew']>;

export function crewFor(profile: Profile): Crew {
    // A run that is not a whole `api` or `ui` run (a named feature, the flag proof's single scenarios) writes nothing and empties nothing (CDS-47).
    if (!writesSerenityJson(process.env)) return [ConsoleReporter.fromJSON({ theme: 'auto' })] as unknown as Crew;
    const folder = reportFolder(profile);
    fs.rmSync(folder, { recursive: true, force: true });
    fs.mkdirSync(folder, { recursive: true });
    return [
        ArtifactArchiver.storingArtifactsAt(folder),
        SerenityBDDReporter.fromJSON({ specDirectory: path.join('..', '..', 'features-shared') }),
        ConsoleReporter.fromJSON({ theme: 'auto' }),
    ] as unknown as Crew;
}
