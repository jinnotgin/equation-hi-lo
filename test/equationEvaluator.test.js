import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateEquation } from '../src/utils/equationEvaluator.js'

const EPSILON = 1e-9
const RANDOMIZED_DIFF_CASES = 5000

const tokensToNativeExpression = (tokens) => {
  const parts = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === 'sqrt') {
      const next = tokens[i + 1]
      if (!next || next.type !== 'number') throw new Error('Invalid sqrt token sequence in test')
      parts.push(`Math.sqrt(${next.value})`)
      i += 1
      continue
    }
    if (token.type === 'number') {
      parts.push(String(token.value))
      continue
    }
    if (token.type === 'op') {
      parts.push(token.value === '×' ? '*' : token.value === '÷' ? '/' : token.value)
      continue
    }
    throw new Error(`Unknown token type in test: ${token.type}`)
  }

  return parts.join(' ')
}

const evaluateNative = (tokens) => {
  const expression = tokensToNativeExpression(tokens)
  return new Function(`return (${expression})`)()
}

const createRng = (seed = 0xdecafbad) => {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const randomInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min

const pick = (rng, arr) => arr[randomInt(rng, 0, arr.length - 1)]

const buildRandomValidTokens = (rng) => {
  const numberCount = randomInt(rng, 1, 6)
  const ops = ['+', '-', '×', '÷']
  const tokens = []

  for (let i = 0; i < numberCount; i++) {
    if (rng() < 0.3) tokens.push({ type: 'sqrt' })
    tokens.push({ type: 'number', value: randomInt(rng, 0, 10) })
    if (i < numberCount - 1) tokens.push({ type: 'op', value: pick(rng, ops) })
  }

  return tokens
}

test('evaluateEquation handles precedence and associativity', () => {
  const result = evaluateEquation([
    { type: 'number', value: 2 },
    { type: 'op', value: '+' },
    { type: 'number', value: 3 },
    { type: 'op', value: '×' },
    { type: 'number', value: 4 },
  ])
  assert.equal(result.valid, true)
  assert.equal(result.result, 14)

  const leftAssoc = evaluateEquation([
    { type: 'number', value: 8 },
    { type: 'op', value: '÷' },
    { type: 'number', value: 4 },
    { type: 'op', value: '×' },
    { type: 'number', value: 2 },
  ])
  assert.equal(leftAssoc.valid, true)
  assert.equal(leftAssoc.result, 4)
})

test('evaluateEquation handles sqrt token correctly', () => {
  const result = evaluateEquation([
    { type: 'sqrt' },
    { type: 'number', value: 9 },
    { type: 'op', value: '+' },
    { type: 'number', value: 1 },
  ])
  assert.equal(result.valid, true)
  assert.equal(result.result, 4)
})

test('evaluateEquation returns DIV_ZERO for division by zero', () => {
  const result = evaluateEquation([
    { type: 'number', value: 5 },
    { type: 'op', value: '÷' },
    { type: 'number', value: 0 },
  ])
  assert.deepEqual(result, { valid: false, result: null, error: 'DIV_ZERO' })
})

test('evaluateEquation rejects malformed syntax', () => {
  assert.equal(evaluateEquation([]).valid, false)
  assert.equal(
    evaluateEquation([
      { type: 'number', value: 1 },
      { type: 'op', value: '+' },
    ]).error,
    'SYNTAX',
  )
  assert.equal(
    evaluateEquation([
      { type: 'sqrt' },
      { type: 'sqrt' },
      { type: 'number', value: 9 },
    ]).error,
    'SYNTAX',
  )
  assert.equal(
    evaluateEquation([
      { type: 'op', value: '+' },
      { type: 'number', value: 9 },
    ]).error,
    'SYNTAX',
  )
})

test('evaluateEquation matches native evaluation on randomized valid expressions', () => {
  const rng = createRng(0x12345678)

  for (let i = 0; i < RANDOMIZED_DIFF_CASES; i++) {
    const tokens = buildRandomValidTokens(rng)
    const ours = evaluateEquation(tokens)
    const native = evaluateNative(tokens)

    if (!Number.isFinite(native)) {
      assert.equal(ours.valid, false)
      assert.equal(ours.error, 'DIV_ZERO')
      continue
    }

    assert.equal(ours.valid, true, `expected valid for ${tokensToNativeExpression(tokens)}`)
    assert.ok(
      Math.abs(ours.result - native) <= EPSILON,
      `mismatch for ${tokensToNativeExpression(tokens)}: ours=${ours.result}, native=${native}`,
    )
  }
})
