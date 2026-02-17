// Utilities for the game logic

export const SUITS = ['gold', 'silver', 'bronze', 'black']

// Check if equation is valid (no division by zero)
const safeEval = (str) => {
  try {
    if (/\/ 0(?:\s|$)/.test(str)) return null

    const res = new Function('return ' + str)()
    if (!isFinite(res) || isNaN(res)) return null
    return res
  } catch (e) {
    return null
  }
}

// Permutation generator (full length)
const permute = (arr) => {
  if (arr.length <= 1) return [arr]
  let output = []
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i]
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1))
    const remainingPerms = permute(remaining)
    for (let j = 0; j < remainingPerms.length; j++) {
      output.push([current].concat(remainingPerms[j]))
    }
  }
  return output
}

/**
 * Generate all ordered permutations of length k from array.
 * e.g. permuteK(['+','-','÷'], 2) → [['+','-'],['+','÷'],['-','+'],['-','÷'],['÷','+'],[÷','-']]
 */
const permuteK = (arr, k) => {
  if (k === 0) return [[]]
  if (k > arr.length) return []
  let output = []
  for (let i = 0; i < arr.length; i++) {
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1))
    const subPerms = permuteK(remaining, k - 1)
    for (const sp of subPerms) {
      output.push([arr[i], ...sp])
    }
  }
  return output
}

/**
 * Generate all ways to assign `count` √ modifiers to `n` number positions.
 */
const sqrtCombinations = (n, count) => {
  if (count === 0) return [new Array(n).fill(false)]
  const results = []
  const combo = (start, remaining, current) => {
    if (remaining === 0) {
      results.push([...current])
      return
    }
    for (let i = start; i < n; i++) {
      current[i] = true
      combo(i + 1, remaining - 1, current)
      current[i] = false
    }
  }
  combo(0, count, new Array(n).fill(false))
  return results
}

/**
 * Solve a hand to find the best LOW (closest to 1) and HIGH (closest to 20) equations.
 * @param {Array} numberCards - Array of { value, suit } objects (only number cards)
 * @param {Array} operators - Array of operator strings ['+', '-', '÷', '×']
 * @param {number} sqrtCount - Number of √ cards available (0-3)
 */
export const solveHand = (numberCards, operators, sqrtCount = 0) => {
  let bestLow = { result: Infinity, diff: Infinity, equation: '' }
  let bestHigh = { result: -Infinity, diff: Infinity, equation: '' }

  // 1. Permute Numbers
  const numPerms = permute(numberCards)

  // 2. Permute Operators — select exactly (numbers - 1) operators from available set
  //    With 4 numbers & 3 ops → use all 3 (same as before)
  //    With 3 numbers & 3 ops → pick 2 of 3 (fixes Round 1 betting)
  const neededOps = numberCards.length - 1
  const opPerms = permuteK(operators, neededOps)

  // 3. All possible √ assignments
  const sqrtAssignments = sqrtCombinations(numberCards.length, sqrtCount)

  // Iterate all combinations
  for (const nums of numPerms) {
    for (const ops of opPerms) {
      for (const sqrtFlags of sqrtAssignments) {
        let evalStr = ''
        let displayStr = ''

        for (let i = 0; i < nums.length; i++) {
          let val = nums[i].value
          let displayVal = String(val)

          if (sqrtFlags[i]) {
            val = Math.sqrt(val)
            displayVal = `√${nums[i].value}`
          }

          evalStr += val
          displayStr += displayVal

          if (i < ops.length) {
            let op = ops[i]
            let displayOp = op
            if (op === '×') op = '*'
            if (op === '÷') op = '/'
            evalStr += ` ${op} `
            displayStr += ` ${displayOp} `
          }
        }

        const res = safeEval(evalStr)

        if (res !== null) {
          const diff1 = Math.abs(res - 1)
          if (diff1 < bestLow.diff) {
            bestLow = { result: res, diff: diff1, equation: displayStr }
          }

          const diff20 = Math.abs(res - 20)
          if (diff20 < bestHigh.diff) {
            bestHigh = { result: res, diff: diff20, equation: displayStr }
          }
        }
      }
    }
  }

  return { low: bestLow, high: bestHigh }
}
