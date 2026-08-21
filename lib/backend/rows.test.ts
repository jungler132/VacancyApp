import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PUBLIC_PROFILE_COLUMNS } from './rows';

describe('public profile columns', () => {
  it('не включает account_state', () => {
    const cols = PUBLIC_PROFILE_COLUMNS.split(',');
    assert.equal(cols.includes('account_state'), false);
    assert.ok(cols.includes('display_name'));
    assert.ok(cols.includes('avatar_url'));
    assert.ok(cols.includes('company_name'));
  });
});
