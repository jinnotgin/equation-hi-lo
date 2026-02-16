import { defineStore } from 'pinia'
import { solveHand, SUITS } from '../utils/mathSolver'

const AI_NAMES = ['Luna', 'Archie', 'Sage', 'Nova', 'Felix', 'Iris']

// Suit priority for tiebreaking (§10)
const HIGH_SUIT_PRIORITY = { gold: 4, silver: 3, bronze: 2, black: 1 }
const LOW_SUIT_PRIORITY = { black: 4, bronze: 3, silver: 2, gold: 1 }

/**
 * Tiebreaker per §10:
 * - HIGH tie: compare highest-value number card; higher wins. Same value → suit (Gold > Silver > Bronze > Black)
 * - LOW tie:  compare lowest-value number card; lower wins. Same value → suit (Black > Bronze > Silver > Gold)
 * Returns the winning player.
 */
function tiebreak(a, b, side) {
  const aNumbers = a.hand.filter((c) => c.type === 'number')
  const bNumbers = b.hand.filter((c) => c.type === 'number')

  if (side === 'HIGH') {
    const aMax = aNumbers.reduce(
      (best, c) =>
        !best ||
        c.value > best.value ||
        (c.value === best.value && HIGH_SUIT_PRIORITY[c.suit] > HIGH_SUIT_PRIORITY[best.suit])
          ? c
          : best,
      null,
    )
    const bMax = bNumbers.reduce(
      (best, c) =>
        !best ||
        c.value > best.value ||
        (c.value === best.value && HIGH_SUIT_PRIORITY[c.suit] > HIGH_SUIT_PRIORITY[best.suit])
          ? c
          : best,
      null,
    )
    if (aMax.value !== bMax.value) {
      const winner = aMax.value > bMax.value ? a : b
      const wCard = aMax.value > bMax.value ? aMax : bMax
      return { winner, explanation: `Tiebreaker: highest card ${wCard.value} (${wCard.suit})` }
    }
    const winner = HIGH_SUIT_PRIORITY[aMax.suit] > HIGH_SUIT_PRIORITY[bMax.suit] ? a : b
    const wCard = HIGH_SUIT_PRIORITY[aMax.suit] > HIGH_SUIT_PRIORITY[bMax.suit] ? aMax : bMax
    return { winner, explanation: `Tiebreaker: same value ${wCard.value}, suit ${wCard.suit} wins` }
  } else {
    const aMin = aNumbers.reduce(
      (best, c) =>
        !best ||
        c.value < best.value ||
        (c.value === best.value && LOW_SUIT_PRIORITY[c.suit] > LOW_SUIT_PRIORITY[best.suit])
          ? c
          : best,
      null,
    )
    const bMin = bNumbers.reduce(
      (best, c) =>
        !best ||
        c.value < best.value ||
        (c.value === best.value && LOW_SUIT_PRIORITY[c.suit] > LOW_SUIT_PRIORITY[best.suit])
          ? c
          : best,
      null,
    )
    if (aMin.value !== bMin.value) {
      const winner = aMin.value < bMin.value ? a : b
      const wCard = aMin.value < bMin.value ? aMin : bMin
      return { winner, explanation: `Tiebreaker: lowest card ${wCard.value} (${wCard.suit})` }
    }
    const winner = LOW_SUIT_PRIORITY[aMin.suit] > LOW_SUIT_PRIORITY[bMin.suit] ? a : b
    const wCard = LOW_SUIT_PRIORITY[aMin.suit] > LOW_SUIT_PRIORITY[bMin.suit] ? aMin : bMin
    return { winner, explanation: `Tiebreaker: same value ${wCard.value}, suit ${wCard.suit} wins` }
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
    communityMsg: 'Welcome to Equation Hi-Lo',
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
    announcement: null, // { msg: string, visible: boolean } for central overlay
    actionLog: [],
  }),

  actions: {
    showAnnouncement(msg) {
      return new Promise((resolve) => {
        this.announcement = { msg, visible: true }
        // Auto-hide after 1.5s
        setTimeout(() => {
          if (this.announcement && this.announcement.msg === msg) {
            this.announcement.visible = false
            // Clear null after fade out (allow for 500ms transition)
            setTimeout(() => {
              this.announcement = null
              resolve()
            }, 500)
          } else {
            resolve()
          }
        }, 1500)
      })
    },

    logAction(msg) {
      const time = new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      this.actionLog.push({ time, msg })
    },

    initGame(numAi, rounds) {
      if (numAi !== undefined) this.numAiPlayers = numAi
      if (rounds !== undefined) this.maxRounds = rounds
      this.roundNumber = 0
      this.actionLog = []
      const totalPlayers = this.numAiPlayers + 1

      // Shuffle name pool and pick — only on first init
      const shuffled = [...AI_NAMES].sort(() => Math.random() - 0.5)

      this.players = [
        {
          id: 0,
          name: 'You',
          isHuman: true,
          chips: 500,
          hand: [],
          ops: ['+', '-', '÷'],
          folded: false,
          eliminated: false,
          currentBet: 0,
          role: null,
          declaration: null,
          lastAction: null,
        },
      ]
      for (let i = 0; i < this.numAiPlayers; i++) {
        this.players.push({
          id: i + 1,
          name: shuffled[i],
          isHuman: false,
          chips: 500,
          hand: [],
          ops: ['+', '-', '÷'],
          folded: false,
          eliminated: false,
          currentBet: 0,
          role: null,
          declaration: null,
          lastAction: null,
        })
      }
      this.dealerIndex = this.dealerIndex % totalPlayers
      this.startRound()
    },

    createDeck() {
      const deck = []
      for (let v = 0; v <= 10; v++) {
        SUITS.forEach((s) => deck.push({ type: 'number', value: v, suit: s, id: `n-${v}-${s}` }))
      }
      for (let i = 0; i < 4; i++) deck.push({ type: 'multiply', value: '×', id: `x-${i}` })
      for (let i = 0; i < 4; i++) deck.push({ type: 'sqrt', value: '√', id: `s-${i}` })
      // Fisher-Yates Shuffle
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
      }
      this.deck = deck
    },

    async startRound() {
      // Check for last-player-standing §12
      const alive = this.players.filter((p) => !p.eliminated)
      if (alive.length <= 1) {
        this.phase = 'GAME_OVER'
        this.winnerMsg = alive.length === 1 ? `${alive[0].name} wins the game!` : 'Game Over!'
        this.logAction(
          `🎮 <strong>Game Over!</strong> ${alive.length === 1 ? alive[0].name + ' wins!' : ''}`,
        )
        return
      }

      // Check round limit (§13)
      this.roundNumber++
      if (this.maxRounds > 0 && this.roundNumber > this.maxRounds) {
        const richest = alive.reduce((best, p) => (p.chips > best.chips ? p : best))
        this.phase = 'GAME_OVER'
        this.winnerMsg = `🏆 ${richest.name} wins with ${richest.chips} chips after ${this.maxRounds} rounds!`
        this.logAction(
          `🎮 <strong>Game Over!</strong> ${richest.name} wins with $${richest.chips}!`,
        )
        return
      }

      this.phase = 'ANTE'
      this.logAction(`━━━ <strong>Round ${this.roundNumber}</strong> ━━━`)
      this.pot = 0
      this.currentBet = this.minBet
      this.winnerMsg = null
      this.showdownResults = null
      this.pendingDiscard = null

      // Betting cap = smallest stack BEFORE ante (§6) — only non-eliminated players
      this.roundBettingCap = Math.min(...alive.map((p) => p.chips))

      // Reset per-round player state (preserve name, chips, id, isHuman, eliminated)
      this.players.forEach((p) => {
        p.hand = []
        p.ops = ['+', '-', '÷']
        p.folded = p.eliminated // eliminated players are auto-folded
        p.currentBet = 0
        p.totalWagered = 0
        p.declaration = null
        p.lastAction = null
        p.equationStr = null
        p.finalResult = null
        p.role = p.id === this.dealerIndex ? 'D' : ''
      })

      await this.showAnnouncement(`Round ${this.roundNumber}`)
      this.createDeck()

      // Auto Ante — handle all-in ante (§12)
      this.communityMsg = 'Collecting Ante...'
      await new Promise((r) => setTimeout(r, 1000))

      this.players.forEach((p) => {
        if (p.eliminated || p.folded) return
        const anteAmt = Math.min(this.minBet, p.chips)
        p.chips -= anteAmt
        p.currentBet = anteAmt
        p.totalWagered = anteAmt
        p.allIn = p.chips === 0 // mark all-in for ante edge case
        this.pot += anteAmt
      })
      this.dealInitialCards()
    },

    drawCard(player, isFaceDown = false) {
      if (this.deck.length === 0) return
      let card = this.deck.pop()

      // Rule: First card must be a number. If special, return and redraw.
      if (player.hand.length === 0 && card.type !== 'number') {
        this.deck.unshift(card)
        const idx = this.deck.findIndex((c) => c.type === 'number')
        card = this.deck.splice(idx, 1)[0]
      }

      card.faceDown = isFaceDown

      // Handle Specials
      if (card.type === 'multiply') {
        // Rule update: Max 1 '×' per player.
        // Check if player already has a '×' in ops OR has one in hand (unlikely for ops but possible if not yet resolved)
        const hasMultiply =
          player.ops.includes('×') || player.hand.some((c) => c.type === 'multiply')

        if (hasMultiply) {
          // Player already has a multiply card. Cannot have another.
          // Return to deck and draw next.
          this.deck.unshift(card)
          this.drawCard(player, isFaceDown)
          return
        }

        // §5 Edge case: If no + or - left to discard (shouldn't happen if limit is 1, but safe to keep)
        const hasPlus = player.ops.includes('+')
        const hasMinus = player.ops.includes('-')
        if (!hasPlus && !hasMinus) {
          // Can't use this ×, return to deck and draw next
          this.deck.unshift(card)
          this.drawCard(player, isFaceDown)
          return
        }
        player.hand.push(card)
        // For human: set pendingDiscard so UI prompts them. For AI: auto-discard.
        if (player.isHuman) {
          if (hasPlus && hasMinus) {
            // Player must choose
            this.pendingDiscard = { playerId: player.id, cardId: card.id }
          } else if (hasPlus) {
            player.ops.splice(player.ops.indexOf('+'), 1)
            player.ops.push('×')
          } else if (hasMinus) {
            player.ops.splice(player.ops.indexOf('-'), 1)
            player.ops.push('×')
          }
        } else {
          // AI always discards + first (arbitrary choice)
          const removeIdx = player.ops.findIndex((o) => o === '+' || o === '-')
          if (removeIdx > -1) player.ops.splice(removeIdx, 1)
          player.ops.push('×')
        }
        // Draw extra number
        this.drawCard(player, false)
        return
      } else if (card.type === 'sqrt') {
        player.hand.push(card)
        this.drawCard(player, false)
        return
      }

      player.hand.push(card)
    },

    // Called by UI when human chooses to discard + or - after drawing a multiply card
    resolveDiscard(opToDiscard) {
      if (!this.pendingDiscard) return
      const player = this.players.find((p) => p.id === this.pendingDiscard.playerId)
      const idx = player.ops.indexOf(opToDiscard)
      if (idx > -1) {
        player.ops.splice(idx, 1)
        player.ops.push('×')
      }
      this.pendingDiscard = null

      // Resume game flow based on phase
      if (this.phase === 'DEALING') {
        this.startBettingRound('ROUND_1')
      } else if (this.phase === 'DEAL_4') {
        this.startBettingRound('ROUND_2')
      }
    },

    dealInitialCards() {
      this.phase = 'DEALING'
      this.players.forEach((p) => {
        if (p.eliminated) return
        this.drawCard(p, true) // Card 1 (Hidden)
        this.drawCard(p, false) // Card 2
        this.drawCard(p, false) // Card 3
      })

      // Pause if human has to discard an operator
      if (this.pendingDiscard) return

      this.startBettingRound('ROUND_1')
      this.logAction(`<strong>Turn 1:</strong> Deal & Betting.`)
    },

    dealFourthCard() {
      this.phase = 'DEAL_4'
      this.logAction(`<strong>Turn 2:</strong> Dealt 4th card.`)
      this.players.forEach((p) => {
        if (!p.folded) this.drawCard(p, false)
      })

      // Pause if human has to discard an operator
      if (this.pendingDiscard) return

      this.startBettingRound('ROUND_2')
    },

    async startBettingRound(nextPhase) {
      this.phase = nextPhase
      this.currentBet = 0 // Reset for the round structure (simplified poker)
      this.players.forEach((p) => {
        p.currentBet = 0
        p.hasRaisedThisRound = false // reset per-round raise limit
      })

      // Check if betting cap already reached — auto-skip (§6)
      const active = this.players.filter((p) => !p.folded)
      const allAtCap = active.every((p) => p.totalWagered >= this.roundBettingCap || p.chips === 0)
      if (allAtCap) {
        this.communityMsg = 'Betting cap reached — skipping betting.'
        if (nextPhase === 'ROUND_1') {
          await new Promise((r) => setTimeout(r, 1000))
          this.dealFourthCard()
        } else {
          await new Promise((r) => setTimeout(r, 1000))
          this.precomputeAIDeclarations()
          await this.showAnnouncement('Showdown!')
          this.phase = 'SHOWDOWN'
          const human = this.players.find((p) => p.isHuman)
          if (human && human.folded) {
            await new Promise((r) => setTimeout(r, 1500))
            this.evaluateShowdown()
          }
        }
        return
      }

      // Start Left of Dealer
      this.currentTurnIndex = (this.dealerIndex + 1) % this.players.length
      this.lastAggressorIndex = -1 // no one has raised yet
      this.actedCount = 0
      this.processTurn()
    },

    processTurn() {
      const activePlayers = this.players.filter((p) => !p.folded)
      if (activePlayers.length === 1) {
        this.endRoundFold(activePlayers[0])
        return
      }

      // Check if betting round is done (everyone called or checked)
      const maxCurrentBet = Math.max(...this.players.map((p) => p.currentBet))
      const allMatched = activePlayers.every((p) => p.currentBet === maxCurrentBet || p.chips === 0)

      // Logic for "End of Betting Round" is tricky. Simplified:
      // If we cycled back to start and bets match, move on.
      // We'll use a simple counter or check state in a real engine,
      // here we assume if it's the start player's turn again and matched.

      const currentPlayer = this.players[this.currentTurnIndex]

      if (currentPlayer.folded) {
        this.nextTurn()
        return
      }

      if (!currentPlayer.isHuman) {
        setTimeout(() => this.aiMove(currentPlayer), 1500)
      }
    },

    aiMove(ai) {
      // 1. Solve Hand
      const numbers = ai.hand.filter((c) => c.type === 'number')
      const sqrtCount = ai.hand.filter((c) => c.type === 'sqrt').length

      const solution = solveHand(numbers, ai.ops, sqrtCount)

      // 2. Evaluate hand quality
      // LOW (target 1) is easier to hit precisely, so we use tighter thresholds.
      // HIGH thresholds = LOW thresholds × HIGH_LENIENCY_FACTOR
      const HIGH_LENIENCY_FACTOR = 4
      const LOW_THRESHOLDS = { elite: 0.05, strong: 0.17, decent: 0.5, weak: 1.0 }
      const HIGH_THRESHOLDS = {
        elite: LOW_THRESHOLDS.elite * HIGH_LENIENCY_FACTOR,
        strong: LOW_THRESHOLDS.strong * HIGH_LENIENCY_FACTOR,
        decent: LOW_THRESHOLDS.decent * HIGH_LENIENCY_FACTOR,
        weak: LOW_THRESHOLDS.weak * HIGH_LENIENCY_FACTOR,
      }

      const bestSide = solution.low.diff <= solution.high.diff ? 'LOW' : 'HIGH'
      const bestRawDiff = Math.min(solution.low.diff, solution.high.diff)
      const t = bestSide === 'LOW' ? LOW_THRESHOLDS : HIGH_THRESHOLDS

      // Classify hand into tier
      let tier
      if (bestRawDiff <= t.elite) tier = 'elite'
      else if (bestRawDiff <= t.strong) tier = 'strong'
      else if (bestRawDiff <= t.decent) tier = 'decent'
      else if (bestRawDiff <= t.weak) tier = 'weak'
      else tier = 'junk'

      // 3. Betting Context
      const currentTableBet = Math.max(...this.players.map((p) => p.currentBet))
      const toCall = currentTableBet - ai.currentBet
      const costRatio = toCall / (ai.chips + 0.1) // How expensive is this call relative to stack
      const isRound1 = this.phase === 'ROUND_1'

      // 4. Decide action based on tier and context
      let action = 'fold'
      const roll = Math.random()

      if (tier === 'elite') {
        // Very aggressive
        if (!ai.hasRaisedThisRound && roll > 0.3) {
          action = 'raise'
        } else {
          action = 'call'
        }
      } else if (tier === 'strong') {
        // Mostly call, context-aware
        if (!ai.hasRaisedThisRound && roll > 0.9) {
          action = 'raise'
        } else if (toCall === 0) {
          action = 'check'
        } else if (costRatio < 0.15) {
          action = 'call' // Cheap — always call
        } else if (costRatio < 0.3) {
          action = roll > 0.2 ? 'call' : 'fold' // 80% call, 20% fold
        } else {
          action = roll > 0.5 ? 'call' : 'fold' // 50/50 when expensive
        }
      } else if (tier === 'decent') {
        // Call only if cheap, fold into raises
        if (toCall === 0) {
          action = 'check'
        } else if (isRound1 && costRatio < 0.15) {
          action = 'call' // Round 1: call if cheap (hand may improve)
        } else if (!isRound1 && costRatio < 0.08) {
          action = 'call' // Round 2: only call if very cheap
        } else {
          action = 'fold'
        }
      } else if (tier === 'weak') {
        // Check if free, otherwise fold
        if (toCall === 0) {
          action = 'check'
        } else if (roll > 0.95 && costRatio < 0.05) {
          action = 'call' // 5% hero-call if basically free
        } else {
          action = 'fold'
        }
      } else {
        // JUNK HAND: Check if free, otherwise always fold
        if (toCall === 0) {
          action = 'check'
        } else {
          action = 'fold'
        }
      }

      // 5. Execute Action
      if (action === 'raise') {
        // Elite raises bigger
        const raiseAmt =
          tier === 'elite'
            ? 30 + Math.floor(Math.random() * 3) * 10
            : 20 + Math.floor(Math.random() * 2) * 10

        const maxAdditional = this.roundBettingCap - ai.totalWagered
        // Ensure we can afford it and it's under cap
        if (ai.chips >= toCall + raiseAmt && toCall + raiseAmt <= maxAdditional) {
          this.placeBet(ai, toCall + raiseAmt)
          ai.hasRaisedThisRound = true
          this.lastAggressorIndex = ai.id
          ai.lastAction = `Raise $${raiseAmt}`
        } else {
          // Fallback to call if raise fails
          if (ai.chips >= toCall) this.placeBet(ai, toCall)
          else this.placeBet(ai, ai.chips)
          ai.lastAction = toCall === 0 ? 'Check' : `Call $${toCall}`
        }
      } else if (action === 'call' || action === 'check') {
        if (ai.chips >= toCall) this.placeBet(ai, toCall)
        else this.placeBet(ai, ai.chips) // All in
        ai.lastAction = toCall === 0 ? 'Check' : `Call $${toCall}`
      } else {
        ai.folded = true
        ai.lastAction = 'Fold'
        this.communityMsg = `${ai.name} Folded.` // Leaving this one? No, remove.
        ai.folded = true
        ai.lastAction = 'Fold'
        this.logAction(`${ai.name} folded.`)
      }

      // Delay before passing turn so user sees the action/result
      setTimeout(() => {
        this.nextTurn()
      }, 1500)
    },

    placeBet(player, amount) {
      // Clamp to betting cap
      const maxAdditional = this.roundBettingCap - player.totalWagered
      const clamped = Math.min(amount, maxAdditional, player.chips)
      player.chips -= clamped
      player.currentBet += clamped
      player.totalWagered += clamped
      this.pot += clamped
      player.totalWagered += clamped
      this.pot += clamped
      // this.communityMsg = `${player.name} bets ${amount}` // Remove
      this.logAction(`${player.name} bets ${amount}`)
    },

    async nextTurn() {
      this.actedCount++

      // Find next active player index
      let nextIndex = (this.currentTurnIndex + 1) % this.players.length

      // Check for fold-win FIRST — if only 1 player remains, they win immediately
      const active = this.players.filter((p) => !p.folded)
      if (active.length === 1) {
        this.endRoundFold(active[0])
        return
      }

      // Check for round end condition
      const maxBet = Math.max(...this.players.map((p) => p.currentBet))
      const allMatched = active.every((p) => p.currentBet === maxBet || p.chips === 0)

      // Round ends when:
      // 1. Everyone has acted at least once AND all bets match, OR
      // 2. We've come back to the last aggressor and all bets match
      const everyoneActed = this.actedCount >= active.length
      const backToAggressor = this.lastAggressorIndex >= 0 && nextIndex === this.lastAggressorIndex

      if (allMatched && (everyoneActed || backToAggressor)) {
        if (this.phase === 'ROUND_1') {
          this.dealFourthCard()
          return
        } else if (this.phase === 'ROUND_2') {
          await new Promise((r) => setTimeout(r, 1000))
          this.precomputeAIDeclarations()
          await this.showAnnouncement('Showdown!')
          this.phase = 'SHOWDOWN'
          const human = this.players.find((p) => p.isHuman)
          if (human && human.folded) {
            await new Promise((r) => setTimeout(r, 1500))
            this.evaluateShowdown()
          }
          return
        }
      }

      this.currentTurnIndex = nextIndex
      this.processTurn()
    },

    endRoundFold(winner) {
      this.phase = 'END'
      winner.chips += this.pot
      this.winnerMsg = `${winner.name} wins ${this.pot} (Others folded)`
      this.logAction(`🏆 <strong>${winner.name}</strong> wins ${this.pot} (others folded)`)
      this.advanceDealer()
      this.checkEliminations()
    },

    submitEquation(playerId, declaration, equationResult, highResult = null) {
      const p = this.players.find((pl) => pl.id === playerId)
      p.declaration = declaration
      if (declaration === 'SWING') {
        p.lowResult = equationResult // low equation result
        p.highResult = highResult // high equation result
        p.finalResult = equationResult // for display: show low
      } else {
        p.finalResult = equationResult
      }

      // AI declarations were already pre-computed when entering showdown (§7 simultaneous)
      this.evaluateShowdown()
    },

    // §7: Pre-compute AI declarations when entering showdown (before human chooses)
    precomputeAIDeclarations() {
      this.players
        .filter((p) => !p.isHuman && !p.folded)
        .forEach((ai) => {
          const nums = ai.hand.filter((c) => c.type === 'number')
          const sqrtCount = ai.hand.filter((c) => c.type === 'sqrt').length
          const sol = solveHand(nums, ai.ops, sqrtCount)
          // Normalize: HIGH is 4x more forgiving than LOW
          const HIGH_LENIENCY_FACTOR = 4
          const normLowDiff = sol.low.diff
          const normHighDiff = sol.high.diff / HIGH_LENIENCY_FACTOR
          if (normLowDiff < normHighDiff) {
            ai.declaration = 'LOW'
            ai.finalResult = sol.low.result
            ai.equationStr = sol.low.equation
          } else {
            ai.declaration = 'HIGH'
            ai.finalResult = sol.high.result
            ai.equationStr = sol.high.equation
          }
        })
    },

    resetToLobby() {
      this.phase = 'LOBBY'
      this.winnerMsg = null
      this.showdownResults = null
      this.pendingDiscard = null
      this.pot = 0
      this.round = 0
      this.communityMsg = ''
      this.actionLog = []
      this.players = []
    },

    // Consolidated action for "Start Next Round" button
    completeRoundAndStartNext() {
      this.showdownResults = null
      this.winnerMsg = null
      this.startRound()
    },

    humanFold() {
      const human = this.players.find((p) => p.isHuman)
      if (human) {
        human.folded = true
        human.lastAction = 'Fold'
        // this.communityMsg = 'You Folded.' // Remove
        this.logAction('You folded.')
        this.nextTurn()
      }
    },

    evaluateShowdown() {
      try {
        console.log('Evaluating Showdown...')
        let lowWinner = null
        let highWinner = null
        let bestLowDiff = Infinity
        let bestHighDiff = Infinity
        let lowTiebreakExplanation = ''
        let highTiebreakExplanation = ''

        const active = this.players.filter((p) => !p.folded)
        console.log(
          'Active players in showdown:',
          active.length,
          active.map((p) => p.name),
        )

        const swingPlayers = active.filter((p) => p.declaration === 'SWING')

        active.forEach((p) => {
          // Determine the result to use for each side
          const lowVal = p.declaration === 'SWING' ? p.lowResult : p.finalResult
          const highVal = p.declaration === 'SWING' ? p.highResult : p.finalResult

          if (p.declaration === 'LOW' || p.declaration === 'SWING') {
            const diff = Math.abs(lowVal - 1)
            if (diff < bestLowDiff - 1e-6) {
              bestLowDiff = diff
              lowWinner = p
              lowTiebreakExplanation = ''
            } else if (Math.abs(diff - bestLowDiff) < 1e-6 && lowWinner) {
              const tb = tiebreak(lowWinner, p, 'LOW')
              lowWinner = tb.winner
              lowTiebreakExplanation = tb.explanation
            }
          }
          if (p.declaration === 'HIGH' || p.declaration === 'SWING') {
            const diff = Math.abs(highVal - 20)
            if (diff < bestHighDiff - 1e-6) {
              bestHighDiff = diff
              highWinner = p
              highTiebreakExplanation = ''
            } else if (Math.abs(diff - bestHighDiff) < 1e-6 && highWinner) {
              const tb = tiebreak(highWinner, p, 'HIGH')
              highWinner = tb.winner
              highTiebreakExplanation = tb.explanation
            }
          }
        })

        // §11: Handle swing bet logic
        // A swing player must win BOTH sides or gets nothing
        for (const sp of swingPlayers) {
          const wonLow = lowWinner && lowWinner.id === sp.id
          const wonHigh = highWinner && highWinner.id === sp.id

          if (wonLow && wonHigh) {
            // Swing player wins both — takes entire pot
            sp.chips += this.pot
            const msg = `🎯 SWING! ${sp.name} wins both sides and takes the entire pot!`
            this.showdownResults = active.map((p) => ({
              name: p.name,
              declaration: p.declaration,
              result:
                p.declaration === 'SWING'
                  ? `L:${parseFloat(p.lowResult).toFixed(2)} H:${parseFloat(p.highResult).toFixed(2)}`
                  : p.finalResult,
              equation: p.equationStr || '(built manually)',
              isLowWinner: p.id === sp.id,
              isHighWinner: p.id === sp.id,
            }))
            this.winnerMsg = msg
            this.logAction(`🏆 <strong>${sp.name}</strong> SWING — wins entire pot ($${this.pot})!`)
            this.phase = 'END'
            this.advanceDealer()
            this.checkEliminations()
            return
          } else {
            // Swing player failed — remove them from winner consideration
            if (wonLow) {
              // Find next best low (non-swing or another swing that also failed)
              lowWinner = null
              bestLowDiff = Infinity
              active
                .filter((p) => p.id !== sp.id)
                .forEach((p) => {
                  const lv = p.declaration === 'SWING' ? p.lowResult : p.finalResult
                  if (p.declaration === 'LOW' || p.declaration === 'SWING') {
                    const diff = Math.abs(lv - 1)
                    if (diff < bestLowDiff) {
                      bestLowDiff = diff
                      lowWinner = p
                    }
                  }
                })
            }
            if (wonHigh) {
              highWinner = null
              bestHighDiff = Infinity
              active
                .filter((p) => p.id !== sp.id)
                .forEach((p) => {
                  const hv = p.declaration === 'SWING' ? p.highResult : p.finalResult
                  if (p.declaration === 'HIGH' || p.declaration === 'SWING') {
                    const diff = Math.abs(hv - 20)
                    if (diff < bestHighDiff) {
                      bestHighDiff = diff
                      highWinner = p
                    }
                  }
                })
            }
          }
        }

        // Distribute pot per §9 rules (standard, after swing resolution)
        let msg = ''
        const bothSides = lowWinner && highWinner

        if (bothSides) {
          const halfPot = Math.floor(this.pot / 2)
          const oddChip = this.pot - halfPot * 2
          lowWinner.chips += halfPot
          highWinner.chips += halfPot
          msg += `Low: ${lowWinner.name} (${parseFloat(lowWinner.finalResult).toFixed(2)}). `
          msg += `High: ${highWinner.name} (${parseFloat(highWinner.finalResult).toFixed(2)}).`
          if (oddChip > 0) msg += ` (1 chip removed)`
        } else if (lowWinner) {
          lowWinner.chips += this.pot
          msg += `Low: ${lowWinner.name} (${parseFloat(lowWinner.finalResult).toFixed(2)}) wins entire pot!`
        } else if (highWinner) {
          highWinner.chips += this.pot
          msg += `High: ${highWinner.name} (${parseFloat(highWinner.finalResult).toFixed(2)}) wins entire pot!`
        }

        // Build showdown results for display with diffs and tiebreaker info
        this.showdownResults = active.map((p) => {
          const target = p.declaration === 'LOW' || p.declaration === 'SWING' ? 1 : 20
          const result = typeof p.finalResult === 'number' ? p.finalResult : 0
          const diff = Math.abs(result - target)
          // For SWING, show both diffs
          let lowDiff = null,
            highDiff = null
          if (p.declaration === 'SWING') {
            lowDiff = Math.abs((p.lowResult || 0) - 1)
            highDiff = Math.abs((p.highResult || 0) - 20)
          }
          return {
            name: p.name,
            declaration: p.declaration,
            result:
              p.declaration === 'SWING'
                ? null // handled separately in UI
                : p.finalResult,
            lowResult: p.declaration === 'SWING' ? p.lowResult : null,
            highResult: p.declaration === 'SWING' ? p.highResult : null,
            lowEqStr: p.lowEqStr || null,
            highEqStr: p.highEqStr || null,
            equation: p.equationStr || '(built manually)',
            isLowWinner: lowWinner && lowWinner.id === p.id,
            isHighWinner: highWinner && highWinner.id === p.id,
            diff: p.declaration === 'SWING' ? null : parseFloat(diff.toFixed(4)),
            lowDiff:
              p.declaration === 'SWING'
                ? parseFloat(Math.abs((p.lowResult || 0) - 1).toFixed(4))
                : null,
            highDiff:
              p.declaration === 'SWING'
                ? parseFloat(Math.abs((p.highResult || 0) - 20).toFixed(4))
                : null,
            hand: p.hand.filter((c) => c.type === 'number' || c.type === 'sqrt'),
            ops: [...p.ops],
          }
        })
        // Attach tiebreaker explanations
        this.lowTiebreakExplanation = lowTiebreakExplanation
        this.highTiebreakExplanation = highTiebreakExplanation

        this.winnerMsg = msg || 'No winners found (draw/error)'
        if (bothSides) {
          this.logAction(
            `🏆 Low: <strong>${lowWinner.name}</strong> · High: <strong>${highWinner.name}</strong> (pot $${this.pot})`,
          )
        } else if (lowWinner) {
          this.logAction(`🏆 <strong>${lowWinner.name}</strong> wins pot ($${this.pot})`)
        } else if (highWinner) {
          this.logAction(`🏆 <strong>${highWinner.name}</strong> wins pot ($${this.pot})`)
        }
        this.phase = 'END'
        // Advance dealer to next non-eliminated player
        this.advanceDealer()
        // Check for eliminations
        this.checkEliminations()
      } catch (err) {
        console.error('Error in evaluateShowdown:', err)
        this.winnerMsg = 'Game Error - Round Ended'
        this.phase = 'END'
      }
    },

    // §12: Eliminate players with 0 chips at end of round
    checkEliminations() {
      let eliminatedNames = []
      this.players.forEach((p) => {
        if (!p.eliminated && p.chips <= 0) {
          p.eliminated = true
          p.chips = 0
          eliminatedNames.push(p.name)
        }
      })
      if (eliminatedNames.length > 0) {
        this.winnerMsg += ` | Eliminated: ${eliminatedNames.join(', ')}`
      }
      // Check for game over
      const alive = this.players.filter((p) => !p.eliminated)
      if (alive.length <= 1) {
        this.phase = 'GAME_OVER'
        this.winnerMsg = alive.length === 1 ? `🏆 ${alive[0].name} wins the game!` : 'Game Over!'
      }
    },

    advanceDealer() {
      let next = (this.dealerIndex + 1) % this.players.length
      let safety = 0
      while (this.players[next].eliminated && safety < this.players.length) {
        next = (next + 1) % this.players.length
        safety++
      }
      this.dealerIndex = next
    },
  },
})
