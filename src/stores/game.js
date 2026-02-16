import { defineStore } from 'pinia';
import { solveHand, SUITS } from '../utils/mathSolver';

export const useGameStore = defineStore('game', {
  state: () => ({
    deck: [],
    players: [], // 0 is Human, 1-3 are AI
    pot: 0,
    currentTurnIndex: 0,
    dealerIndex: 0,
    phase: 'LOBBY', // LOBBY, ANTE, ROUND_1, DEAL_4, ROUND_2, SHOWDOWN, END
    minBet: 10,
    currentBet: 0,
    communityMsg: "Welcome to Equation Hi-Lo",
    winnerMsg: null,
    lastAggressorIndex: -1, // tracks who last raised so we know when to end the round
    actedCount: 0, // how many players have acted this round
  }),

  actions: {
    initGame() {
      // Initialize 4 players
      this.players = [
        { id: 0, name: 'You', isHuman: true, chips: 500, hand: [], ops: ['+', '-', '÷'], folded: false, currentBet: 0, role: null, declaration: null },
        { id: 1, name: 'AI-1', isHuman: false, chips: 500, hand: [], ops: ['+', '-', '÷'], folded: false, currentBet: 0, role: null, declaration: null },
        { id: 2, name: 'AI-2', isHuman: false, chips: 500, hand: [], ops: ['+', '-', '÷'], folded: false, currentBet: 0, role: null, declaration: null },
        { id: 3, name: 'AI-3', isHuman: false, chips: 500, hand: [], ops: ['+', '-', '÷'], folded: false, currentBet: 0, role: null, declaration: null },
      ];
      this.startRound();
    },

    createDeck() {
      const deck = [];
      // Number cards
      for (let v = 0; v <= 10; v++) {
        SUITS.forEach(s => deck.push({ type: 'number', value: v, suit: s, id: `n-${v}-${s}` }));
      }
      // Special cards
      for (let i = 0; i < 4; i++) deck.push({ type: 'multiply', value: '×', id: `x-${i}` });
      for (let i = 0; i < 4; i++) deck.push({ type: 'sqrt', value: '√', id: `s-${i}` });
      
      // Shuffle
      this.deck = deck.sort(() => Math.random() - 0.5);
    },

    startRound() {
      this.phase = 'ANTE';
      this.pot = 0;
      this.currentBet = this.minBet;
      this.winnerMsg = null;
      this.createDeck();
      
      // Reset players
      this.players.forEach(p => {
        p.hand = [];
        p.ops = ['+', '-', '÷'];
        p.folded = false;
        p.currentBet = 0;
        p.declaration = null;
        p.role = (p.id === this.dealerIndex) ? 'D' : '';
      });

      // Auto Ante
      this.communityMsg = "Collecting Ante...";
      setTimeout(() => {
        this.players.forEach(p => {
          p.chips -= this.minBet;
          p.currentBet = this.minBet;
          this.pot += this.minBet;
        });
        this.dealInitialCards();
      }, 1000);
    },

    drawCard(player, isFaceDown = false) {
      if (this.deck.length === 0) return;
      let card = this.deck.pop();
      
      // Rule: First card must be a number. If special, return and reshuffle/redraw
      if (player.hand.length === 0 && card.type !== 'number') {
        this.deck.unshift(card); // put back
        // Cheat slightly for simplicity: find first number
        const idx = this.deck.findIndex(c => c.type === 'number');
        card = this.deck.splice(idx, 1)[0];
      }

      card.faceDown = isFaceDown;
      
      // Handle Specials
      if (card.type === 'multiply') {
        // Replace + or -
        const removeIdx = player.ops.findIndex(o => o === '+' || o === '-');
        if (removeIdx > -1) player.ops.splice(removeIdx, 1);
        player.ops.push('×');
        // Draw extra number
        this.drawCard(player, false); 
      } else if (card.type === 'sqrt') {
        // Draw extra number
        this.drawCard(player, false);
        // Mark the last drawn number as having sqrt potential (simplified logic)
        // In real UI, player drags sqrt to number. For data structure:
        // We push the sqrt card to hand visually, but logic attaches it later.
      }
      
      player.hand.push(card);
    },

    dealInitialCards() {
      this.phase = 'DEALING';
      this.players.forEach(p => {
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
      
      // Calc Lowest Stack Cap
      const minStack = Math.min(...this.players.filter(p => !p.folded).map(p => p.chips));
      this.maxBetCap = minStack;

      // Start Left of Dealer
      this.currentTurnIndex = (this.dealerIndex + 1) % 4;
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
      const numbers = ai.hand.filter(c => c.type === 'number').map(c => ({...c, sqrt: false}));
      
      const solution = solveHand(numbers, ai.ops);
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
        if (ai.chips >= toCall + raiseAmt && (currentTableBet + raiseAmt) <= this.maxBetCap) {
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
      player.chips -= amount;
      player.currentBet += amount;
      this.pot += amount;
      this.communityMsg = `${player.name} bets ${amount}`;
    },

    nextTurn() {
      this.actedCount++;
      
      // Find next active player index
      let nextIndex = (this.currentTurnIndex + 1) % 4;
      
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
      this.dealerIndex = (this.dealerIndex + 1) % 4;
    },

    submitEquation(playerId, declaration, equationResult) {
      // Called by UI when human submits. 
      // For AI, we auto-calc now.
      const p = this.players.find(pl => pl.id === playerId);
      p.declaration = declaration;
      p.finalResult = equationResult; // Simplified: AI provides this instantly
      
      // If all submitted, evaluate
      if (this.players.filter(pl => !pl.folded).every(pl => pl.declaration)) {
        this.evaluateShowdown();
      }
    },
    
    evaluateShowdown() {
        // Simple evaluator
        // 1. Calculate results for AIs
        this.players.filter(p => !p.isHuman && !p.folded).forEach(ai => {
            const nums = ai.hand.filter(c => c.type === 'number');
            // AI Logic to choose declaration
            const sol = solveHand(nums, ai.ops);
            if (sol.low.diff < sol.high.diff) {
                ai.declaration = 'LOW';
                ai.finalResult = sol.low.result;
            } else {
                ai.declaration = 'HIGH';
                ai.finalResult = sol.high.result;
            }
        });

        // 2. Determine Winners
        let lowWinner = null;
        let highWinner = null;
        let bestLowDiff = Infinity;
        let bestHighDiff = Infinity;

        const active = this.players.filter(p => !p.folded);

        active.forEach(p => {
            if (p.declaration === 'LOW' || p.declaration === 'BOTH') {
                const diff = Math.abs(p.finalResult - 1);
                if (diff < bestLowDiff) {
                    bestLowDiff = diff;
                    lowWinner = p;
                }
            }
            if (p.declaration === 'HIGH' || p.declaration === 'BOTH') {
                const diff = Math.abs(p.finalResult - 20);
                if (diff < bestHighDiff) {
                    bestHighDiff = diff;
                    highWinner = p;
                }
            }
        });

        // Split pot
        const halfPot = Math.floor(this.pot / 2);
        let msg = "";
        
        if (lowWinner) {
            lowWinner.chips += halfPot;
            msg += `Low: ${lowWinner.name} (${parseFloat(lowWinner.finalResult).toFixed(2)}). `;
        } else {
             // If no low winner, high takes all
             if(highWinner) highWinner.chips += halfPot;
        }

        if (highWinner) {
            highWinner.chips += halfPot;
            msg += `High: ${highWinner.name} (${parseFloat(highWinner.finalResult).toFixed(2)}).`;
        } else {
            if(lowWinner) lowWinner.chips += halfPot;
        }

        this.winnerMsg = msg;
        this.phase = 'END';
        this.dealerIndex = (this.dealerIndex + 1) % 4;
    }
  }
});
