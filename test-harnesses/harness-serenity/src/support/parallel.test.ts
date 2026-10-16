import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { refuseParallelRun } from './parallel.js';

describe('the parallel-run guard (B-23)', () => {
    it('lets a serial run through', () => {
        refuseParallelRun({});
    });

    it('refuses a Cucumber worker, which only a parallel run starts', () => {
        assert.throws(() => refuseParallelRun({ CUCUMBER_WORKER_ID: '1' }), /parallel run is not supported/);
    });
});
