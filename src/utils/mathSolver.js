// Utilities for the game logic

export const SUITS = ['gold', 'silver', 'bronze', 'black'];

// Check if equation is valid (no division by zero)
const safeEval = (str) => {
  try {
    // Check for division by zero manually before eval
    if (/\/ 0(?!\.)/.test(str)) return null; 
    // eslint-disable-next-line no-new-func
    const res = new Function('return ' + str)();
    if (!isFinite(res) || isNaN(res)) return null;
    return res;
  } catch (e) {
    return null;
  }
};

// Permutation generator
const permute = (arr) => {
  if (arr.length <= 1) return [arr];
  let output = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const remainingPerms = permute(remaining);
    for (let j = 0; j < remainingPerms.length; j++) {
      output.push([current].concat(remainingPerms[j]));
    }
  }
  return output;
};

export const solveHand = (numberCards, operators) => {
  // numberCards array of objects { value, suit, hasSqrt }
  // operators array of strings ['+', '-', '*', '/']
  
  let bestLow = { result: Infinity, diff: Infinity, equation: '' };
  let bestHigh = { result: -Infinity, diff: Infinity, equation: '' };

  // 1. Permute Numbers
  const numPerms = permute(numberCards);
  
  // 2. Permute Operators
  const opPerms = permute(operators);

  // Iterate all combinations
  for (const nums of numPerms) {
    for (const ops of opPerms) {
      // Construct equation string: N1 Op1 N2 Op2 N3 Op3 N4
      // Handle Sqrt: If card has hasSqrt, value is Math.sqrt(val)
      
      // Build visual string and eval string
      let evalStr = "";
      
      // We assume standard 4 numbers 3 ops structure for simplicity of the AI solver
      // (The game logic ensures players always end up with balanced sets via discard rules)
      
      for (let i = 0; i < nums.length; i++) {
        let val = nums[i].value;
        if (nums[i].sqrt) val = Math.sqrt(val);
        
        evalStr += val;
        
        if (i < ops.length) {
          let op = ops[i];
          if (op === '×') op = '*';
          if (op === '÷') op = '/';
          evalStr += ` ${op} `;
        }
      }

      const res = safeEval(evalStr);

      if (res !== null) {
        // Check Low (Target 1)
        const diff1 = Math.abs(res - 1);
        if (diff1 < bestLow.diff) {
          bestLow = { result: res, diff: diff1, equation: evalStr };
        }

        // Check High (Target 20)
        const diff20 = Math.abs(res - 20);
        if (diff20 < bestHigh.diff) {
          bestHigh = { result: res, diff: diff20, equation: evalStr };
        }
      }
    }
  }

  return { low: bestLow, high: bestHigh };
};
