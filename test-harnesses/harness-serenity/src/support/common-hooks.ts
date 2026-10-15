import { BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';

import { Contract } from '../contract/validate.js';
import { refuseParallelRun } from './parallel.js';
import { setContract } from './world.js';

setDefaultTimeout(30_000);

// The contract is read once, from DOCS/.architecture/openapi.yaml (DR-042); test-control calls are validated against it
// in every profile.
BeforeAll(() => {
    refuseParallelRun();
    setContract(new Contract());
});
