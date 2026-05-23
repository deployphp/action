import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { depCommandFailureMessage } from './index.js'

describe('depCommandFailureMessage', () => {
  it('surfaces the original process error message instead of a generic dep failure', () => {
    const err = Object.assign(
      new Error('connecting develop\n\n    at dep()\n    exit code: 1'),
      { stderr: 'connecting develop\n', exitCode: 1 },
    )

    const message = depCommandFailureMessage(err)

    assert.match(message, /connecting develop/)
    assert.doesNotMatch(message, /Failed: dep/)
  })
})
