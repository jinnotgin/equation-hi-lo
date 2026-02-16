import { defineStore } from 'pinia';
import { solveHand, SUITS } from '../utils/mathSolver';

const AI_NAMES = ['Luna', 'Archie', 'Sage', 'Nova', 'Felix', 'Iris'];

// Suit priority for tiebreaking (§10)
const HIGH_SUIT_PRIORITY = { gold: 4, silver: 3, bronze: 2, black: 1 };
const LOW_SUIT_PRIORITY  = { black: 4, bronze: 3, silver: 2, gold: 1 };

/**
 * Tiebreaker per §10:
 * - HIGH tie: compare highest-value number card; higher wins. Same value → suit (Gold > Silver > Bronze > Black)
 * - LOW tie:  compare lowest-value number card; lower wins. Same value → suit (Black > Bronze > Silver > Gold)
 * Returns the winning player.
 */
function tiebreak(a, b, side) {
  const aNumbers = a.hand.filter(c => c.type === 'number');
  const bNumbers = b.hand.filter(c => c.type === 'number');

  if (side === 'HIGH') {
    const aMax = aNumbers.reduce((best, c) => (!best || c.value > best.value || (c.value === best.value && HIGH_SUIT_PRIORITY[c.suit] > HIGH_SUIT_PRIORITY[best.suit])) ? c : best, null);
    const bMax = bNumbers.reduce((best, c) => (!best || c.value > best.value || (c.value === best.value && HIGH_SUIT_PRIORITY[c.suit] > HIGH_SUIT_PRIORITY[best.suit])) ? c : best, null);
    if (aMax.value !== bMax.value) {
      const winner = aMax.value > bMax.value ? a : b;
      const wCard = aMax.value > bMax.value ? aMax : bMax;
      return { winner, explanation: `Tiebreaker: highest card ${wCard.value} (${wCard.suit})` };
    }
    const winner = HIGH_SUIT_PRIORITY[aMax.suit] > HIGH_SUIT_PRIORITY[bMax.suit] ? a : b;
    const wCard = HIGH_SUIT_PRIORITY[aMax.suit] > HIGH_SUIT_PRIORITY[bMax.suit] ? aMax : bMax;
    return { winner, explanation: `Tiebreaker: same value ${wCard.value}, suit ${wCard.suit} wins` };
  } else {
    const aMin = aNumbers.reduce((best, c) => (!best || c.value < best.value || (c.value === best.value && LOW_SUIT_PRIORITY[c.suit] > LOW_SUIT_PRIORITY[best.suit])) ? c : best, null);
    const bMin = bNumbers.reduce((best, c) => (!best || c.value < best.value || (c.value === best.value && LOW_SUIT_PRIORITY[c.suit] > LOW_SUIT_PRIORITY[best.suit])) ? c : best, null);
    if (aMin.value !== bMin.value) {
      const winner = aMin.value < bMin.value ? a : b;
      const wCard = aMin.value < bMin.value ? aMin : bMin;
      return { winner, explanation: `Tiebreaker: lowest card ${wCard.value} (${wCard.suit})` };
    }
    const winner = LOW_SUIT_PRIORITY[aMin.suit] > LOW_SUIT_PRIORITY[bMin.suit] ? a : b;
    const wCard = LOW_SUIT_PRIORITY[aMin.suit] > LOW_SUIT_PRIORITY[bMin.suit] ? aMin : bMin;
    return { winner, explanation: `Tiebreaker: same value ${wCard.value}, suit ${wCard.suit} wins` };
  }
}

export const useGameStore = defineStore('game', {
  state: () => ({
    deck: [],
    players: [], // 0 is Human, rest are AI
    pot: 0,
    currentTurnIndex: 0,
    dealerIndex: 0,
    phase: 'LOBBY', // LOBBY, ANTE, ROUND_1, DEAL_4, ROUND_2, SHOWDOWN, END, GAME_OVER
    minBet: 10,
    currentBet: 0,
    communityMsg: "Welcome to Equation Hi-Lo",
    winnerMsg: null,
    lastAggressorIndex: -1,
    actedCount: 0,
    numAiPlayers: 3,
    maxRounds: 10, // 0 = unlimited (elimination only)
    roundNumber: 0,
    showdownResults: null,
    lowTiebreakExplanation: '',
    highTiebreakExplanation: '',
    pendingDiscard: null, // { playerId, cardId } — when human draws multiply, must choose +/- to discard
  }),

  actions: {
    initGame(numAi, rounds) {
      if (numAi !== undefined) this.numAiPlayers = numAi;
      if (rounds !== undefined) this.maxRounds = rounds;
      this.roundNumber = 0;
      const totalPlayers = this.numAiPlayers + 1;

      // Shuffle name pool and pick — only on first init
      const shuffled = [...AI_NAMES].sort(() => Math.random() - 0.5);

      this.players = [
        { id: 0, name: 'You', isHuman: true, chips: 500, hand: [], ops: ['+', '-', '÷'], folded: false, eliminated: false, currentBet: 0, role: null, declaration: null },
      ];
      for (let i = 0; i < this.numAiPlayers; i++) {
        this.players.push({
          id: i + 1, name: shuffled[i], isHuman: false, chips: 500, hand: [], ops: ['+', '-', '÷'], folded: false, eliminated: false, currentBet: 0, role: null, declaration: null,
        });
      }
      this.dealerIndex = this.dealerIndex % totalPlayers;
      this.startRound();
    },

    createDeck() {
      const deck = [];
      for (let v = 0; v <= 10; v++) {
        SUITS.forEach(s => deck.push({ type: 'number', value: v, suit: s, id: `n-${v}-${s}` }));
      }
      for (let i = 0; i < 4; i++) deck.push({ type: 'multiply', value: '×', id: `x-${i}` });
      for (let i = 0; i < 4; i++) deck.push({ type: 'sqrt', value: '√', id: `s-${i}` });
      this.deck = deck.sort(() => Math.random() - 0.5);
    },

    startRound() {
      // Check for last-player-standing §12
      const alive = this.players.filter(p => !p.eliminated);
      if (alive.length <= 1) {
        this.phase = 'GAME_OVER';
        this.winnerMsg = alive.length === 1 ? `${alive[0].name} wins the game!` : 'Game Over!';
        return;
      }

      // Check round limit (§13)
      this.roundNumber++;
      if (this.maxRounds > 0 && this.roundNumber > this.maxRounds) {
        const richest = alive.reduce((best, p) => p.chips > best.chips ? p : best);
        this.phase = 'GAME_OVER';
        this.winnerMsg = `🏆 ${richest.name} wins with ${richest.chips} chips after ${this.maxRounds} rounds!`;
        return;
      }

      this.phase = 'ANTE';
      this.pot = 0;
      this.currentBet = this.minBet;
      this.winnerMsg = null;
      this.showdownResults = null;
      this.pendingDiscard = null;
      this.createDeck();

      // Betting cap = smallest stack BEFORE ante (§6) — only non-eliminated players
      this.roundBettingCap = Math.min(...alive.map(p => p.chips));
      
      // Reset per-round player state (preserve name, chips, id, isHuman, eliminated)
      this.players.forEach(p => {
        p.hand = [];
        p.ops = ['+', '-', '÷'];
        p.folded = p.eliminated; // eliminated players are auto-folded
        p.currentBet = 0;
        p.totalWagered = 0;
        p.declaration = null;
        p.equationStr = null;
        p.finalResult = null;
        p.role = (p.id === this.dealerIndex) ? 'D' : '';
      });

      // Auto Ante — handle all-in ante (§12)
      this.communityMsg = "Collecting Ante...";
      setTimeout(() => {
        this.players.forEach(p => {
          if (p.eliminated || p.folded) return;
          const anteAmt = Math.min(this.minBet, p.chips);
          p.chips -= anteAmt;
          p.currentBet = anteAmt;
          p.totalWagered = anteAmt;
          p.allIn = p.chips === 0; // mark all-in for ante edge case
          this.pot += anteAmt;
        });
        this.dealInitialCards();
      }, 1000);
    },

    drawCard(player, isFaceDown = false) {
      if (this.deck.length === 0) return;
      let card = this.deck.pop();
      
      // Rule: First card must be a number. If special, return and redraw.
      if (player.hand.length === 0 && card.type !== 'number') {
        this.deck.unshift(card);
        const idx = this.deck.findIndex(c => c.type === 'number');
        card = this.deck.splice(idx, 1)[0];
      }

      card.faceDown = isFaceDown;
      
      // Handle Specials
      if (card.type === 'multiply') {
        // §5 Edge case: 3rd × — if no + or - left to discard, ignore and draw next card
        const hasPlus = player.ops.includes('+');
        const hasMinus = player.ops.includes('-');
        if (!hasPlus && !hasMinus) {
          // Can't use this ×, return to deck and draw next
          this.deck.unshift(card);
          this.drawCard(player, isFaceDown);
          return;
        }
        player.hand.push(card);
        // For human: set pendingDiscard so UI prompts them. For AI: auto-discard.
        if (player.isHuman) {
          if (hasPlus && hasMinus) {
            // Player must choose
            this.pendingDiscard = { playerId: player.id, cardId: card.id };
          } else if (hasPlus) {
            player.ops.splice(player.ops.indexOf('+'), 1);
            player.ops.push('×');
          } else if (hasMinus) {
            player.ops.splice(player.ops.indexOf('-'), 1);
            player.ops.push('×');
          }
        } else {
          // AI always discards + first (arbitrary choice)
          const removeIdx = player.ops.findIndex(o => o === '+' || o === '-');
          if (removeIdx > -1) player.ops.splice(removeIdx, 1);
          player.ops.push('×');
        }
        // Draw extra number
        this.drawCard(player, false);
        return;
      } else if (card.type === 'sqrt') {
        player.hand.push(card);
        this.drawCard(player, false);
        return;
      }
      
      player.hand.push(card);
    },

    // Called by UI when human chooses to discard + or - after drawing a multiply card
    resolveDiscard(opToDiscard) {
      if (!this.pendingDiscard) return;
      const player = this.players.find(p => p.id === this.pendingDiscard.playerId);
      const idx = player.ops.indexOf(opToDiscard);
      if (idx > -1) {
        player.ops.splice(idx, 1);
        player.ops.push('×');
      }
      this.pendingDiscard = null;
    },

    dealInitialCards() {
      this.phase = 'DEALING';
      this.players.forEach(p => {
        if (p.eliminated) return;
        this.drawCard(p, true); // Card 1 (Hidden)
        this.drawCard(p, false); // Card 2
        this.drawCard(p, false); // Card 3
      });
      
      this.startBettingRound('ROUND_1');
    },

    dealFourthCard() {
      this.phase = 'DEAL_4';
      this.players.forEach(p => {
        if(!p.folded) this.drawCard(p, false);
      });
      this.startBettingRound('ROUND_2');
    },

    startBettingRound(nextPhase) {
      this.phase = nextPhase;
      this.currentBet = 0; // Reset for the round structure (simplified poker)
      this.players.forEach(p => {
        p.currentBet = 0;
        p.hasRaisedThisRound = false; // reset per-round raise limit
      });
      
      // Check if betting cap already reached — auto-skip (§6)
      const active = this.players.filter(p => !p.folded);
      const allAtCap = active.every(p => p.totalWagered >= this.roundBettingCap || p.chips === 0);
      if (allAtCap) {
        this.communityMsg = "Betting cap reached — skipping betting.";
        if (nextPhase === 'ROUND_1') {
          setTimeout(() => this.dealFourthCard(), 1000);
        } else {
          setTimeout(() => {
            this.precomputeAIDeclarations();
            this.phase = 'SHOWDOWN';
            this.communityMsg = "Showdown! Build your equations.";
          }, 1000);
        }
        return;
      }

      // Start Left of Dealer
      this.currentTurnIndex = (this.dealerIndex + 1) % this.players.length;
      this.lastAggressorIndex = -1; // no one has raised yet
      this.actedCount = 0;
      this.processTurn();
    },

    processTurn() {
      const activePlayers = this.players.filter(p => !p.folded);
      if (activePlayers.length === 1) {
        this.endRoundFold(activePlayers[0]);
        return;
      }

      // Check if betting round is done (everyone called or checked)
      const maxCurrentBet = Math.max(...this.players.map(p => p.currentBet));
      const allMatched = activePlayers.every(p => p.currentBet === maxCurrentBet || p.chips === 0);
      
      // Logic for "End of Betting Round" is tricky. Simplified:
      // If we cycled back to start and bets match, move on.
      // We'll use a simple counter or check state in a real engine, 
      // here we assume if it's the start player's turn again and matched.
      
      const currentPlayer = this.players[this.currentTurnIndex];
      
      if (currentPlayer.folded) {
        this.nextTurn();
        return;
      }

      if (currentPlayer.isHuman) {
        this.communityMsg = "Your Turn. Call, Raise or Fold?";
      } else {
        this.communityMsg = `${currentPlayer.name} is thinking...`;
        setTimeout(() => this.aiMove(currentPlayer), 1500);
      }
    },

    aiMove(ai) {
      // 1. Solve Hand
      const numbers = ai.hand.filter(c => c.type === 'number');
      const sqrtCount = ai.hand.filter(c => c.type === 'sqrt').length;
      
      const solution = solveHand(numbers, ai.ops, sqrtCount);
      const bestDiff = Math.min(solution.low.diff, solution.high.diff);
      
      // Betting Logic
      const currentTableBet = Math.max(...this.players.map(p => p.currentBet));
      const toCall = currentTableBet - ai.currentBet;
      
      // Decider
      let action = 'fold';
      
      // Only allow raise if AI hasn't already raised this round
      if (bestDiff <= 1 && !ai.hasRaisedThisRound) action = 'raise';
      else if (bestDiff <= 1) action = 'call'; // Strong but already raised, just call
      else if (bestDiff <= 5) action = 'call';
      else if (toCall === 0) action = 'check';
      else if (Math.random() > 0.8) action = 'call';
      
      // Execute
      if (action === 'raise') {
        const raiseAmt = 20;
        const maxAdditional = this.roundBettingCap - ai.totalWagered;
        if (ai.chips >= toCall + raiseAmt && toCall + raiseAmt <= maxAdditional) {
          this.placeBet(ai, toCall + raiseAmt);
          ai.hasRaisedThisRound = true;
          this.lastAggressorIndex = ai.id; // mark this AI as last aggressor
        } else {
          this.placeBet(ai, toCall); // Just call if can't raise
        }
      } else if (action === 'call' || action === 'check') {
        if (ai.chips >= toCall) this.placeBet(ai, toCall);
        else this.placeBet(ai, ai.chips); // All in
      } else {
        ai.folded = true;
        this.communityMsg = `${ai.name} Folded.`;
      }
      
      this.nextTurn();
    },

    placeBet(player, amount) {
      // Clamp to betting cap
      const maxAdditional = this.roundBettingCap - player.totalWagered;
      const clamped = Math.min(amount, maxAdditional, player.chips);
      player.chips -= clamped;
      player.currentBet += clamped;
      player.totalWagered += clamped;
      this.pot += clamped;
      this.communityMsg = `${player.name} bets ${amount}`;
    },

    nextTurn() {
      this.actedCount++;
      
      // Find next active player index
      let nextIndex = (this.currentTurnIndex + 1) % this.players.length;
      
      // Check for round end condition
      const active = this.players.filter(p => !p.folded);
      const maxBet = Math.max(...this.players.map(p => p.currentBet));
      const allMatched = active.every(p => p.currentBet === maxBet || p.chips === 0);
      
      // Round ends when:
      // 1. Everyone has acted at least once AND all bets match, OR
      // 2. We've come back to the last aggressor and all bets match
      const everyoneActed = this.actedCount >= active.length;
      const backToAggressor = this.lastAggressorIndex >= 0 && nextIndex === this.lastAggressorIndex;
      
      if (allMatched && (everyoneActed || backToAggressor)) {
        if (this.phase === 'ROUND_1') {
           this.dealFourthCard();
           return;
        } else if (this.phase === 'ROUND_2') {
           this.precomputeAIDeclarations();
           this.phase = 'SHOWDOWN';
           this.communityMsg = "Showdown! Build your equations.";
           return;
        }
      }

      this.currentTurnIndex = nextIndex;
      this.processTurn();
    },

    endRoundFold(winner) {
      this.phase = 'END';
      winner.chips += this.pot;
      this.winnerMsg = `${winner.name} wins ${this.pot} (Others folded)`;
      this.advanceDealer();
      this.checkEliminations();
    },

    submitEquation(playerId, declaration, equationResult, highResult = null) {
      const p = this.players.find(pl => pl.id === playerId);
      p.declaration = declaration;
      if (declaration === 'SWING') {
        p.lowResult = equationResult;   // low equation result
        p.highResult = highResult;       // high equation result
        p.finalResult = equationResult;  // for display: show low
      } else {
        p.finalResult = equationResult;
      }
      
      // AI declarations were already pre-computed when entering showdown (§7 simultaneous)
      this.evaluateShowdown();
    },

    // §7: Pre-compute AI declarations when entering showdown (before human chooses)
    precomputeAIDeclarations() {
      this.players.filter(p => !p.isHuman && !p.folded).forEach(ai => {
        const nums = ai.hand.filter(c => c.type === 'number');
        const sqrtCount = ai.hand.filter(c => c.type === 'sqrt').length;
        const sol = solveHand(nums, ai.ops, sqrtCount);
        if (sol.low.diff < sol.high.diff) {
          ai.declaration = 'LOW';
          ai.finalResult = sol.low.result;
          ai.equationStr = sol.low.equation;
        } else {
          ai.declaration = 'HIGH';
          ai.finalResult = sol.high.result;
          ai.equationStr = sol.high.equation;
        }
      });
    },
    
    evaluateShowdown() {
        let lowWinner = null;
        let highWinner = null;
        let bestLowDiff = Infinity;
        let bestHighDiff = Infinity;
        let lowTiebreakExplanation = '';
        let highTiebreakExplanation = '';

        const active = this.players.filter(p => !p.folded);
        const swingPlayers = active.filter(p => p.declaration === 'SWING');

        active.forEach(p => {
            // Determine the result to use for each side
            const lowVal = p.declaration === 'SWING' ? p.lowResult : p.finalResult;
            const highVal = p.declaration === 'SWING' ? p.highResult : p.finalResult;

            if (p.declaration === 'LOW' || p.declaration === 'SWING') {
                const diff = Math.abs(lowVal - 1);
                if (diff < bestLowDiff) {
                    bestLowDiff = diff;
                    lowWinner = p;
                    lowTiebreakExplanation = '';
                } else if (diff === bestLowDiff && lowWinner) {
                    const tb = tiebreak(lowWinner, p, 'LOW');
                    lowWinner = tb.winner;
                    lowTiebreakExplanation = tb.explanation;
                }
            }
            if (p.declaration === 'HIGH' || p.declaration === 'SWING') {
                const diff = Math.abs(highVal - 20);
                if (diff < bestHighDiff) {
                    bestHighDiff = diff;
                    highWinner = p;
                    highTiebreakExplanation = '';
                } else if (diff === bestHighDiff && highWinner) {
                    const tb = tiebreak(highWinner, p, 'HIGH');
                    highWinner = tb.winner;
                    highTiebreakExplanation = tb.explanation;
                }
            }
        });

        // §11: Handle swing bet logic
        // A swing player must win BOTH sides or gets nothing
        for (const sp of swingPlayers) {
          const wonLow = lowWinner && lowWinner.id === sp.id;
          const wonHigh = highWinner && highWinner.id === sp.id;
          
          if (wonLow && wonHigh) {
            // Swing player wins both — takes entire pot
            sp.chips += this.pot;
            const msg = `🎯 SWING! ${sp.name} wins both sides and takes the entire pot!`;
            this.showdownResults = active.map(p => ({
              name: p.name,
              declaration: p.declaration,
              result: p.declaration === 'SWING' ? `L:${parseFloat(p.lowResult).toFixed(2)} H:${parseFloat(p.highResult).toFixed(2)}` : p.finalResult,
              equation: p.equationStr || '(built manually)',
              isLowWinner: p.id === sp.id,
              isHighWinner: p.id === sp.id,
            }));
            this.winnerMsg = msg;
            this.phase = 'END';
            this.advanceDealer();
            this.checkEliminations();
            return;
          } else {
            // Swing player failed — remove them from winner consideration
            if (wonLow) {
              // Find next best low (non-swing or another swing that also failed)
              lowWinner = null;
              bestLowDiff = Infinity;
              active.filter(p => p.id !== sp.id).forEach(p => {
                const lv = p.declaration === 'SWING' ? p.lowResult : p.finalResult;
                if (p.declaration === 'LOW' || p.declaration === 'SWING') {
                  const diff = Math.abs(lv - 1);
                  if (diff < bestLowDiff) { bestLowDiff = diff; lowWinner = p; }
                }
              });
            }
            if (wonHigh) {
              highWinner = null;
              bestHighDiff = Infinity;
              active.filter(p => p.id !== sp.id).forEach(p => {
                const hv = p.declaration === 'SWING' ? p.highResult : p.finalResult;
                if (p.declaration === 'HIGH' || p.declaration === 'SWING') {
                  const diff = Math.abs(hv - 20);
                  if (diff < bestHighDiff) { bestHighDiff = diff; highWinner = p; }
                }
              });
            }
          }
        }

        // Distribute pot per §9 rules (standard, after swing resolution)
        let msg = "";
        const bothSides = lowWinner && highWinner;

        if (bothSides) {
            const halfPot = Math.floor(this.pot / 2);
            const oddChip = this.pot - halfPot * 2;
            lowWinner.chips += halfPot;
            highWinner.chips += halfPot;
            msg += `Low: ${lowWinner.name} (${parseFloat(lowWinner.finalResult).toFixed(2)}). `;
            msg += `High: ${highWinner.name} (${parseFloat(highWinner.finalResult).toFixed(2)}).`;
            if (oddChip > 0) msg += ` (1 chip removed)`;
        } else if (lowWinner) {
            lowWinner.chips += this.pot;
            msg += `Low: ${lowWinner.name} (${parseFloat(lowWinner.finalResult).toFixed(2)}) wins entire pot!`;
        } else if (highWinner) {
            highWinner.chips += this.pot;
            msg += `High: ${highWinner.name} (${parseFloat(highWinner.finalResult).toFixed(2)}) wins entire pot!`;
        }

        // Build showdown results for display with diffs and tiebreaker info
        this.showdownResults = active.map(p => {
            const target = (p.declaration === 'LOW' || p.declaration === 'SWING') ? 1 : 20;
            const result = typeof p.finalResult === 'number' ? p.finalResult : 0;
            const diff = Math.abs(result - target);
            // For SWING, show both diffs
            let lowDiff = null, highDiff = null;
            if (p.declaration === 'SWING') {
              lowDiff = Math.abs((p.lowResult || 0) - 1);
              highDiff = Math.abs((p.highResult || 0) - 20);
            }
            return {
              name: p.name,
              declaration: p.declaration,
              result: p.declaration === 'SWING' 
                ? `L:${parseFloat(p.lowResult).toFixed(2)} H:${parseFloat(p.highResult).toFixed(2)}`
                : p.finalResult,
              equation: p.equationStr || '(built manually)',
              isLowWinner: lowWinner && lowWinner.id === p.id,
              isHighWinner: highWinner && highWinner.id === p.id,
              diff: p.declaration === 'SWING' ? null : parseFloat(diff.toFixed(4)),
              lowDiff,
              highDiff,
              hand: p.hand.filter(c => c.type === 'number' || c.type === 'sqrt'),
              ops: [...p.ops],
            };
        });
        // Attach tiebreaker explanations
        this.lowTiebreakExplanation = lowTiebreakExplanation;
        this.highTiebreakExplanation = highTiebreakExplanation;

        this.winnerMsg = msg;
        this.phase = 'END';
        // Advance dealer to next non-eliminated player
        this.advanceDealer();
        // Check for eliminations
        this.checkEliminations();
    },

    // §12: Eliminate players with 0 chips at end of round
    checkEliminations() {
      let eliminatedNames = [];
      this.players.forEach(p => {
        if (!p.eliminated && p.chips <= 0) {
          p.eliminated = true;
          p.chips = 0;
          eliminatedNames.push(p.name);
        }
      });
      if (eliminatedNames.length > 0) {
        this.winnerMsg += ` | Eliminated: ${eliminatedNames.join(', ')}`;
      }
      // Check for game over
      const alive = this.players.filter(p => !p.eliminated);
      if (alive.length <= 1) {
        this.phase = 'GAME_OVER';
        this.winnerMsg = alive.length === 1 ? `🏆 ${alive[0].name} wins the game!` : 'Game Over!';
      }
    },

    advanceDealer() {
      let next = (this.dealerIndex + 1) % this.players.length;
      let safety = 0;
      while (this.players[next].eliminated && safety < this.players.length) {
        next = (next + 1) % this.players.length;
        safety++;
      }
      this.dealerIndex = next;
    }
  }
});
