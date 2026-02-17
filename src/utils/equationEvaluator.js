const VALID_OPERATORS = new Set(['+', '-', '×', '÷'])
const PRECEDENCE = {
  '+': 1,
  '-': 1,
  '×': 2,
  '÷': 2,
}
const DIV_ZERO_EPSILON = 1e-12

const invalid = (error = 'SYNTAX') => ({
  valid: false,
  result: null,
  error,
})

/**
 * Evaluate a tokenized equation.
 * Supported tokens:
 * - { type: 'number', value: number }
 * - { type: 'op', value: '+' | '-' | '×' | '÷' }
 * - { type: 'sqrt' }
 */
export const evaluateEquation = (tokens) => {
  if (!Array.isArray(tokens) || tokens.length === 0) return invalid()

  const values = []
  const operators = []
  let expectOperand = true
  let pendingSqrt = false

  const pushValue = (raw) => {
    let value = Number(raw)
    if (!Number.isFinite(value)) return false

    if (pendingSqrt) {
      if (value < 0) return false
      value = Math.sqrt(value)
      pendingSqrt = false
    }

    values.push(value)
    return true
  }

  const applyTopOperator = () => {
    if (values.length < 2 || operators.length === 0) return invalid()

    const right = values.pop()
    const left = values.pop()
    const op = operators.pop()

    let next
    if (op === '+') next = left + right
    else if (op === '-') next = left - right
    else if (op === '×') next = left * right
    else if (op === '÷') {
      if (Math.abs(right) < DIV_ZERO_EPSILON) return invalid('DIV_ZERO')
      next = left / right
    } else {
      return invalid()
    }

    if (!Number.isFinite(next)) return invalid(op === '÷' ? 'DIV_ZERO' : 'SYNTAX')
    values.push(next)
    return null
  }

  for (const token of tokens) {
    if (!token || typeof token !== 'object') return invalid()

    if (expectOperand) {
      if (token.type === 'sqrt') {
        if (pendingSqrt) return invalid()
        pendingSqrt = true
        continue
      }
      if (token.type !== 'number') return invalid()
      if (!pushValue(token.value)) return invalid()
      expectOperand = false
      continue
    }

    if (token.type !== 'op' || !VALID_OPERATORS.has(token.value)) return invalid()

    while (
      operators.length > 0 &&
      PRECEDENCE[operators[operators.length - 1]] >= PRECEDENCE[token.value]
    ) {
      const err = applyTopOperator()
      if (err) return err
    }

    operators.push(token.value)
    expectOperand = true
  }

  if (expectOperand || pendingSqrt) return invalid()

  while (operators.length > 0) {
    const err = applyTopOperator()
    if (err) return err
  }

  if (values.length !== 1 || !Number.isFinite(values[0])) return invalid()

  return {
    valid: true,
    result: values[0],
    error: null,
  }
}
