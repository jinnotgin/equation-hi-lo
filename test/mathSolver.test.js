import assert from 'node:assert/strict'
import test from 'node:test'
import { solveHand } from '../src/utils/mathSolver.js'
import { evaluateEquation } from '../src/utils/equationEvaluator.js'

const EPSILON = 1e-9

const parseEquationTokens = (equation) => {
  const parts = equation.trim().split(/\s+/).filter(Boolean)
  const tokens = []

  for (const part of parts) {
    if (part === '+' || part === '-' || part === '×' || part === '÷') {
      tokens.push({ type: 'op', value: part })
      continue
    }
    if (part.startsWith('√')) {
      const value = Number(part.slice(1))
      tokens.push({ type: 'sqrt' })
      tokens.push({ type: 'number', value })
      continue
    }
    tokens.push({ type: 'number', value: Number(part) })
  }

  return tokens
}

const createRng = (seed = 0x51a7f00d) => {
  let state = seed >>> 0
  return () => {
    state = (state * 1103515245 + 12345) >>> 0
    return state / 0x100000000
  }
}

const randomInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min

const pickUnique = (rng, pool, count) => {
  const copy = [...pool]
  const out = []
  while (out.length < count && copy.length > 0) {
    const idx = randomInt(rng, 0, copy.length - 1)
    out.push(copy[idx])
    copy.splice(idx, 1)
  }
  return out
}

test('solveHand returns equations that are valid and match reported numeric results', () => {
  const rng = createRng()
  const suits = ['gold', 'silver', 'bronze', 'black']
  const opPool = ['+', '-', '÷', '×']

  for (let i = 0; i < 200; i++) {
    const numberCount = randomInt(rng, 3, 4)
    const hand = Array.from({ length: numberCount }, () => ({
      type: 'number',
      value: randomInt(rng, 0, 10),
      suit: suits[randomInt(rng, 0, suits.length - 1)],
    }))
    const operators = pickUnique(rng, opPool, 3)
    const sqrtCount = randomInt(rng, 0, Math.min(2, numberCount))

    const solved = solveHand(hand, operators, sqrtCount)

    for (const side of ['low', 'high']) {
      const entry = solved[side]
      assert.equal(typeof entry.equation, 'string')
      assert.ok(entry.equation.length > 0)
      assert.equal(Number.isFinite(entry.result), true)
      assert.equal(Number.isFinite(entry.diff), true)

      const tokens = parseEquationTokens(entry.equation)
      const evaluated = evaluateEquation(tokens)
      assert.equal(evaluated.valid, true, `invalid ${side} equation: ${entry.equation}`)
      assert.ok(
        Math.abs(evaluated.result - entry.result) <= EPSILON,
        `${side} mismatch: equation=${entry.equation}, solved=${entry.result}, evaluated=${evaluated.result}`,
      )
    }
  }
})
