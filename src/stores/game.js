import { defineStore } from 'pinia'
import { solveHand, SUITS } from '../utils/mathSolver'

export const AI_NAMES = ['Luna', 'Archie', 'Sage', 'Nova', 'Felix', 'Iris']

// Suit priority for tiebreaking (§10)
const HIGH_SUIT_PRIORITY = { gold: 4, silver: 3, bronze: 2, black: 1 }
const LOW_SUIT_PRIORITY = { black: 4, bronze: 3, silver: 2, gold: 1 }

// ── Hand-strength thresholds ──
const LOW_THRESHOLDS = { elite: 0.05, strong: 0.17, decent: 0.5, weak: 1.0 }
const HIGH_LENIENCY = 4
const HIGH_THRESHOLDS = {
  elite: LOW_THRESHOLDS.elite * HIGH_LENIENCY,
  strong: LOW_THRESHOLDS.strong * HIGH_LENIENCY,
  decent: LOW_THRESHOLDS.decent * HIGH_LENIENCY,
  weak: LOW_THRESHOLDS.weak * HIGH_LENIENCY,
}

// ── Estimated base win probability per tier (heads-up, one side) ──
const TIER_WIN_PROB = { elite: 0.85, strong: 0.65, decent: 0.4, weak: 0.2, junk: 0.05 }

// ── Numeric rank for tier comparison ──
const TIER_RANK = { elite: 5, strong: 4, decent: 3, weak: 2, junk: 1 }
const AI_MISTAKES_SETTING_KEY = 'equationHiLo.settings.aiMistakesEnabled'
const NEUTRAL_AI_PERSONALITY = { riskLevel: 0.5, carelessnessLevel: 0.5 }

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function randomCentered(scale) {
  return (Math.random() * 2 - 1) * scale
}

function createAIPersonality() {
  return {
    riskLevel: clamp(0.5 + randomCentered(0.1), 0.4, 0.6),
    carelessnessLevel: clamp(0.5 + randomCentered(0.1), 0.4, 0.6),
  }
}

function getAIPersonality(ai) {
  if (!ai?.aiPersonality) return NEUTRAL_AI_PERSONALITY
  return {
    riskLevel: clamp(ai.aiPersonality.riskLevel ?? 0.5, 0.4, 0.6),
    carelessnessLevel: clamp(ai.aiPersonality.carelessnessLevel ?? 0.5, 0.4, 0.6),
  }
}

/**
 * Classify a diff into a tier using the appropriate threshold table.
 */
function classifyTier(diff, thresholds) {
  if (diff <= thresholds.elite) return 'elite'
  if (diff <= thresholds.strong) return 'strong'
  if (diff <= thresholds.decent) return 'decent'
  if (diff <= thresholds.weak) return 'weak'
  return 'junk'
}

/**
 * Estimate probability of winning one side given tier and number
 * of opponents competing on the same side.
 *
 * 0 opponents → uncontested (near-certain win).
 * Each additional opponent beyond 1 reduces win chance by ~25%.
 */
function estimateWinProb(tier, sameSideOpponents) {
  if (sameSideOpponents <= 0) return 0.95 // uncontested
  const base = TIER_WIN_PROB[tier]
  return Math.min(0.95, base * Math.pow(0.75, sameSideOpponents - 1))
}

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
    currentTurnIndex: -1,
    dealerIndex: 0,
    phase: 'LOBBY', // LOBBY, ANTE, ROUND_1, DEAL_4, ROUND_2, SHOWDOWN, END, GAME_OVER
    minBet: 10,
    currentBet: 0,
    communityMsg: 'Welcome to Equation Hi-Lo',
    winnerMsg: null,
    lastAggressorIndex: -1,
    actedSinceLastAction: [],
    numAiPlayers: 3,
    maxRounds: 10, // 0 = unlimited (elimination only)
    roundNumber: 0,
    showdownResults: null,
    lowTiebreakExplanation: '',
    highTiebreakExplanation: '',
    pendingDiscard: null, // { playerId, cardId } — when human draws multiply, must choose +/- to discard
    announcement: null, // { msg: string, visible: boolean } for central overlay
    actionLog: [],
    collectingAnte: false, // New state for ante animation
    aiMistakesEnabled: true,
  }),

  actions: {
    loadSettings() {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          this.aiMistakesEnabled = true
          return
        }
        const raw = window.localStorage.getItem(AI_MISTAKES_SETTING_KEY)
        if (raw === null) {
          this.aiMistakesEnabled = true
          return
        }
        if (raw === 'true' || raw === 'false') {
          this.aiMistakesEnabled = raw === 'true'
          return
        }
        const parsed = JSON.parse(raw)
        this.aiMistakesEnabled = typeof parsed === 'boolean' ? parsed : true
      } catch {
        this.aiMistakesEnabled = true
      }
    },

    setAiMistakesEnabled(enabled) {
      this.aiMistakesEnabled = !!enabled
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(AI_MISTAKES_SETTING_KEY, String(this.aiMistakesEnabled))
        }
      } catch {
        // Ignore storage failures and keep in-memory value.
      }
    },

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

    logPlayerAction(player, action, amount = 0) {
      const label = player?.isHuman ? 'You' : player?.name || 'Player'
      if (action === 'check') this.logAction(`${label} checked.`)
      else if (action === 'call') this.logAction(`${label} called $${amount}.`)
      else if (action === 'raise') this.logAction(`${label} raised $${amount}.`)
      else if (action === 'fold') this.logAction(`${label} folded.`)
    },

    initGame(numAi, rounds, aiMistakesEnabled) {
      if (numAi !== undefined) this.numAiPlayers = numAi
      if (rounds !== undefined) this.maxRounds = rounds
      if (aiMistakesEnabled !== undefined) this.setAiMistakesEnabled(aiMistakesEnabled)
      this.roundNumber = 0
      this.currentTurnIndex = -1
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
          aiPersonality: null,
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
          aiPersonality: this.aiMistakesEnabled
            ? createAIPersonality()
            : { ...NEUTRAL_AI_PERSONALITY },
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
      this.currentTurnIndex = -1
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
      this.collectingAnte = true

      // 1. Deduct chips immediately (they spawn at player)
      this.players.forEach((p) => {
        if (p.eliminated || p.folded) return
        const anteAmt = Math.min(this.minBet, p.chips)
        p.chips -= anteAmt
        p.anteWager = anteAmt // Store temporarily for animation/logic
        p.currentBet = anteAmt
        p.totalWagered = anteAmt
        p.allIn = p.chips === 0
      })

      // 2. Wait for animation to travel to pot (1s)
      await new Promise((r) => setTimeout(r, 1000))

      // 3. Add to pot and clear animation state
      this.players.forEach((p) => {
        if (p.anteWager) {
          this.pot += p.anteWager
          delete p.anteWager
        }
      })
      this.collectingAnte = false

      this.dealInitialCards()
    },

    getNoisyDiff(diff, carelessnessLevel, shouldAddNoise) {
      if (!shouldAddNoise) return diff
      const noisePct = 0.04 + carelessnessLevel * 0.04
      return Math.max(0, diff * (1 + randomCentered(noisePct)))
    },

    chooseAIDiscardOp(player) {
      const hasPlus = player.ops.includes('+')
      const hasMinus = player.ops.includes('-')
      if (hasPlus && !hasMinus) return '+'
      if (hasMinus && !hasPlus) return '-'

      const numbers = player.hand.filter((c) => c.type === 'number')
      const sqrtCount = player.hand.filter((c) => c.type === 'sqrt').length
      const evaluateDiscard = (discardOp) => {
        const projectedOps = [...player.ops]
        const idx = projectedOps.indexOf(discardOp)
        if (idx > -1) projectedOps.splice(idx, 1)
        projectedOps.push('×')
        const sol = solveHand(numbers, projectedOps, sqrtCount)
        const lowTier = classifyTier(sol.low.diff, LOW_THRESHOLDS)
        const highTier = classifyTier(sol.high.diff, HIGH_THRESHOLDS)
        const tierScore = Math.max(TIER_RANK[lowTier], TIER_RANK[highTier])
        const lowQuality = 1 / (1 + sol.low.diff)
        const highQuality = 1 / (1 + sol.high.diff / HIGH_LENIENCY)
        const swingQuality = lowQuality * highQuality
        return tierScore * 10 + Math.max(lowQuality, highQuality, swingQuality * 1.2)
      }

      const plusScore = evaluateDiscard('+')
      const minusScore = evaluateDiscard('-')
      const betterOp = plusScore >= minusScore ? '+' : '-'
      const worseOp = betterOp === '+' ? '-' : '+'

      if (!this.aiMistakesEnabled) return betterOp

      const { carelessnessLevel } = getAIPersonality(player)
      const mistakeChance = clamp(0.06 + carelessnessLevel * 0.12, 0.08, 0.14)
      return Math.random() < mistakeChance ? worseOp : betterOp
    },

    drawCard(player, isFaceDown = false) {
      if (this.deck.length === 0) return
      let card = this.deck.pop()

      // Rule: First card must be a number. If special, return and redraw.
      if (player.hand.length === 0 && card.type !== 'number') {
        this.deck.unshift(card)
        return this.drawNumber(player, isFaceDown)
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
          const opToDiscard = this.chooseAIDiscardOp(player)
          const removeIdx = player.ops.indexOf(opToDiscard)
          if (removeIdx > -1) player.ops.splice(removeIdx, 1)
          player.ops.push('×')
        }
        // Draw extra number
        this.drawNumber(player, false)
        return
      } else if (card.type === 'sqrt') {
        player.hand.push(card)
        this.drawNumber(player, false)
        return
      }

      player.hand.push(card)
    },

    drawNumber(player, isFaceDown = false) {
      if (this.deck.length === 0) return
      let card = this.deck.pop()

      if (card.type !== 'number') {
        // If not a number, put it back and find a number
        this.deck.unshift(card)
        const idx = this.deck.findIndex((c) => c.type === 'number')
        if (idx > -1) {
          card = this.deck.splice(idx, 1)[0]
        } else {
          // Should not happen if deck is properly constructed with enough numbers
          console.warn('No number card found in deck for drawNumber!')
          return
        }
      }
      card.faceDown = isFaceDown
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

    async dealInitialCards() {
      this.phase = 'DEALING'
      this.players.forEach((p) => {
        if (p.eliminated) return
        this.drawCard(p, true) // Card 1 (Hidden)
        this.drawCard(p, false) // Card 2
        this.drawCard(p, false) // Card 3
      })

      // Pause for deal animation (cards flying to players)
      await new Promise((r) => setTimeout(r, 1500))

      // Pause if human has to discard an operator
      if (this.pendingDiscard) return

      this.startBettingRound('ROUND_1')
      this.logAction(`<strong>Turn 1:</strong> Deal & Betting.`)
    },

    async dealFourthCard() {
      this.phase = 'DEAL_4'
      await this.showAnnouncement('4th Card')
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
          await this.dealFourthCard()
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

      // Start Left of Dealer (skipping folded)
      let firstIndex = (this.dealerIndex + 1) % this.players.length
      let loops = 0
      while (this.players[firstIndex].folded && loops < this.players.length) {
        firstIndex = (firstIndex + 1) % this.players.length
        loops++
      }
      this.currentTurnIndex = firstIndex
      this.lastAggressorIndex = -1 // no one has raised yet
      this.actedSinceLastAction = []
      this.processTurn()
    },

    processTurn() {
      const activePlayers = this.players.filter((p) => !p.folded)
      if (activePlayers.length === 1) {
        this.endRoundFold(activePlayers[0])
        return
      }

      // Check if betting round is done (everyone called or checked)
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
      // ── 1. Solve hand ──
      const numbers = ai.hand.filter((c) => c.type === 'number')
      const sqrtCount = ai.hand.filter((c) => c.type === 'sqrt').length
      const solution = solveHand(numbers, ai.ops, sqrtCount)
      const mistakesEnabled = this.aiMistakesEnabled
      const personality = getAIPersonality(ai)
      const riskBias = mistakesEnabled ? personality.riskLevel - 0.5 : 0
      const carelessnessLevel = mistakesEnabled ? personality.carelessnessLevel : 0

      // ── 2. Classify both sides ──
      const lowTierDiff = this.getNoisyDiff(solution.low.diff, carelessnessLevel, mistakesEnabled)
      const highTierDiff = this.getNoisyDiff(solution.high.diff, carelessnessLevel, mistakesEnabled)
      const lowTier = classifyTier(lowTierDiff, LOW_THRESHOLDS)
      const highTier = classifyTier(highTierDiff, HIGH_THRESHOLDS)

      // ── 3. Estimate same-side competition ──
      const activeOpponents = this.players.filter((p) => !p.folded && p.id !== ai.id).length
      const estPerSide = Math.max(1, Math.ceil(activeOpponents / 2))

      // ── 4. Win probabilities ──
      const isRound1 = this.phase === 'ROUND_1'
      // Round 1: 4th card roughly quadruples permutation space (4! vs 3!)
      // Hands improve substantially — a "decent" 3-card hand often becomes "strong"
      const improvementBonus = isRound1 ? 0.15 : 0
      const lowWinProb = Math.min(0.95, estimateWinProb(lowTier, estPerSide) + improvementBonus)
      const highWinProb = Math.min(0.95, estimateWinProb(highTier, estPerSide) + improvementBonus)

      // ── 5. Expected value ──
      const currentTableBet = Math.max(...this.players.map((p) => p.currentBet))
      const toCall = currentTableBet - ai.currentBet
      const potAfterCall = this.pot + toCall

      // Expected pot share: winner doesn't always split 50/50.
      // If no one declares the opposing side, winner takes the full pot (§9).
      // Round 1 has more declaration uncertainty → higher expected share.
      const expectedShare = isRound1 ? 0.65 : 0.6

      const evLow = lowWinProb * (potAfterCall * expectedShare) - toCall
      const evHigh = highWinProb * (potAfterCall * expectedShare) - toCall
      const evSwing = lowWinProb * highWinProb * potAfterCall - toCall

      // ── 6. Pick best strategy ──
      const bestEv = Math.max(evLow, evHigh, evSwing)

      const bothSidesStrong =
        TIER_RANK[lowTier] >= TIER_RANK['strong'] && TIER_RANK[highTier] >= TIER_RANK['strong']

      let bestTier
      if (bestEv === evSwing && bothSidesStrong) {
        bestTier = TIER_RANK[lowTier] <= TIER_RANK[highTier] ? lowTier : highTier
      } else if (evLow >= evHigh) {
        bestTier = lowTier
      } else {
        bestTier = highTier
      }

      // ── 7. Decide action ──
      // Pot odds: what fraction of the total pot is your call?
      // Lower = better odds = more reason to stay in.
      const potOddsRatio = toCall / (this.pot + toCall + 0.01)
      const cheapCallCutoff = clamp(0.25 + riskBias * 0.12, 0.22, 0.28)
      const decentOddsCutoff = clamp(0.38 + riskBias * 0.14, 0.34, 0.42)
      const cheapCall = potOddsRatio < cheapCallCutoff // getting roughly 3:1 or better
      const decentOdds = potOddsRatio < decentOddsCutoff // reasonable odds

      let action = 'fold'
      if (!mistakesEnabled) {
        if (toCall === 0) {
          if (
            !ai.hasRaisedThisRound &&
            (bestTier === 'elite' || (bestTier === 'strong' && bestEv > this.pot * 0.08))
          ) {
            action = 'raise'
          } else {
            action = 'check'
          }
        } else if (bestEv > 0) {
          const shouldRaise =
            !ai.hasRaisedThisRound &&
            (bestTier === 'elite' || (bestTier === 'strong' && cheapCall))
          action = shouldRaise ? 'raise' : 'call'
        } else if (bestTier === 'elite') {
          action = 'call'
        } else if (bestTier === 'strong') {
          action = decentOdds ? 'call' : 'fold'
        } else if (bestTier === 'decent') {
          action = isRound1 ? (cheapCall || decentOdds ? 'call' : 'fold') : cheapCall ? 'call' : 'fold'
        } else if (bestTier === 'weak') {
          action = isRound1 && cheapCall ? 'call' : 'fold'
        } else {
          action = 'fold'
        }
      } else {
        const roll = clamp(
          Math.random() + riskBias * 0.18 + randomCentered(0.05 * carelessnessLevel),
          0,
          1,
        )

        if (toCall === 0) {
          // Free to check — NEVER fold
          if (
            bestTier === 'elite' &&
            !ai.hasRaisedThisRound &&
            roll > clamp(0.55 - riskBias * 0.2, 0.35, 0.75)
          ) {
            action = 'raise'
          } else if (
            bestTier === 'strong' &&
            !ai.hasRaisedThisRound &&
            roll > clamp(0.9 - riskBias * 0.08, 0.78, 0.95)
          ) {
            action = 'raise'
          } else {
            action = 'check'
          }
        } else if (bestEv > 0) {
          // Positive EV — lean toward calling or raising
          if (
            bestTier === 'elite' &&
            !ai.hasRaisedThisRound &&
            roll > clamp(0.5 - riskBias * 0.2, 0.32, 0.7)
          ) {
            action = 'raise'
          } else if (
            bestTier === 'strong' &&
            !ai.hasRaisedThisRound &&
            roll > clamp(0.92 - riskBias * 0.08, 0.8, 0.97)
          ) {
            action = 'raise'
          } else {
            action = 'call'
          }
        } else {
          // Negative EV — use pot odds + tier + round context to decide.
          if (bestTier === 'elite') {
            action = 'call'
          } else if (bestTier === 'strong') {
            action = decentOdds || roll > 0.4 ? 'call' : 'fold'
          } else if (bestTier === 'decent') {
            if (isRound1) {
              if (cheapCall) {
                action = 'call'
              } else if (decentOdds) {
                action = roll > 0.4 ? 'call' : 'fold'
              } else {
                action = roll > 0.55 ? 'call' : 'fold'
              }
            } else {
              action = cheapCall && roll > 0.55 ? 'call' : 'fold'
            }
          } else if (bestTier === 'weak') {
            action = isRound1 && cheapCall && roll > 0.6 ? 'call' : 'fold'
          } else {
            action = 'fold'
          }
        }
      }

      // ── 8. Execute action (unchanged) ──
      if (action === 'raise') {
        const eliteRaiseFactor = clamp(0.3 + riskBias * 0.08, 0.24, 0.36)
        const strongRaiseFactor = clamp(0.15 + riskBias * 0.06, 0.12, 0.18)
        const raiseBase =
          bestTier === 'elite'
            ? Math.max(10, Math.floor(this.pot * eliteRaiseFactor))
            : Math.max(10, Math.floor(this.pot * strongRaiseFactor))
        const raiseAmt = raiseBase + (mistakesEnabled ? Math.floor(Math.random() * 2) * 5 : 0)
        const maxRaiseShare = clamp(0.25 + riskBias * 0.08, 0.2, 0.3)
        const maxRaise = Math.floor(ai.chips * maxRaiseShare)
        const finalRaise = Math.max(10, Math.round(Math.min(raiseAmt, maxRaise) / 10) * 10)

        const maxAdditional = this.roundBettingCap - ai.totalWagered
        if (ai.chips >= toCall + finalRaise && toCall + finalRaise <= maxAdditional) {
          this.placeBet(ai, toCall + finalRaise)
          ai.hasRaisedThisRound = true
          this.lastAggressorIndex = ai.id
          ai.lastAction = `Raise $${finalRaise}`
          this.logPlayerAction(ai, 'raise', finalRaise)
          // Reset: everyone must respond to the raise
          this.actedSinceLastAction = [ai.id]
        } else {
          const callAmt = Math.min(toCall, ai.chips)
          this.placeBet(ai, callAmt)
          ai.lastAction = toCall === 0 ? 'Check' : `Call $${callAmt}`
          this.logPlayerAction(ai, toCall === 0 ? 'check' : 'call', callAmt)
          this.actedSinceLastAction.push(ai.id)
        }
      } else if (action === 'call' || action === 'check') {
        const callAmt = Math.min(toCall, ai.chips)
        this.placeBet(ai, callAmt)
        ai.lastAction = toCall === 0 ? 'Check' : `Call $${callAmt}`
        this.logPlayerAction(ai, toCall === 0 ? 'check' : 'call', callAmt)
        this.actedSinceLastAction.push(ai.id)
      } else {
        ai.folded = true
        ai.lastAction = 'Fold'
        this.logPlayerAction(ai, 'fold')
        this.actedSinceLastAction.push(ai.id)
      }

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
    },

    async nextTurn() {
      let nextIndex = (this.currentTurnIndex + 1) % this.players.length
      let loops = 0
      while (this.players[nextIndex].folded && loops < this.players.length) {
        nextIndex = (nextIndex + 1) % this.players.length
        loops++
      }

      const active = this.players.filter((p) => !p.folded)
      if (active.length === 1) {
        this.endRoundFold(active[0])
        return
      }

      const maxBet = Math.max(...this.players.map((p) => p.currentBet))
      const allMatched = active.every((p) => p.currentBet === maxBet || p.chips === 0)

      // every active player must have explicitly acted
      const everyoneActed = active.every((p) => this.actedSinceLastAction.includes(p.id))

      if (allMatched && everyoneActed) {
        if (this.phase === 'ROUND_1') {
          await this.dealFourthCard()
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
          const mistakesEnabled = this.aiMistakesEnabled
          const personality = getAIPersonality(ai)
          const carelessnessLevel = mistakesEnabled ? personality.carelessnessLevel : 0
          const nums = ai.hand.filter((c) => c.type === 'number')
          const sqrtCount = ai.hand.filter((c) => c.type === 'sqrt').length
          const sol = solveHand(nums, ai.ops, sqrtCount)

          // Classify both sides
          const lowTierDiff = this.getNoisyDiff(sol.low.diff, carelessnessLevel, mistakesEnabled)
          const highTierDiff = this.getNoisyDiff(sol.high.diff, carelessnessLevel, mistakesEnabled)
          const lowTier = classifyTier(lowTierDiff, LOW_THRESHOLDS)
          const highTier = classifyTier(highTierDiff, HIGH_THRESHOLDS)

          // Estimate same-side opponents
          const activeOpponents = this.players.filter((p) => !p.folded && p.id !== ai.id).length
          const estPerSide = Math.max(1, Math.ceil(activeOpponents / 2))

          const lowWinProb = estimateWinProb(lowTier, estPerSide)
          const highWinProb = estimateWinProb(highTier, estPerSide)

          // EV comparison (no cost — declaration is free, just comparing payoff)
          let evLow = lowWinProb * (this.pot / 2)
          let evHigh = highWinProb * (this.pot / 2)
          let evSwing = lowWinProb * highWinProb * this.pot
          if (mistakesEnabled) {
            const evNoiseScale = 0.02 + carelessnessLevel * 0.03
            evLow += evLow * randomCentered(evNoiseScale)
            evHigh += evHigh * randomCentered(evNoiseScale)
            evSwing += evSwing * randomCentered(evNoiseScale)
          }

          // Safety gate: both sides must be at least "strong" to attempt swing
          const bothSidesStrong =
            TIER_RANK[lowTier] >= TIER_RANK['strong'] && TIER_RANK[highTier] >= TIER_RANK['strong']

          if (evSwing > evLow && evSwing > evHigh && bothSidesStrong) {
            ai.declaration = 'SWING'
            ai.lowResult = sol.low.result
            ai.highResult = sol.high.result
            ai.lowEqStr = sol.low.equation
            ai.highEqStr = sol.high.equation
            ai.finalResult = sol.low.result // display fallback
            ai.equationStr = null
          } else if (evLow >= evHigh) {
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
      this.currentTurnIndex = -1
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
        this.logPlayerAction(human, 'fold')
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
            this.showdownResults = active.map((p) => {
              const target = p.declaration === 'LOW' || p.declaration === 'SWING' ? 1 : 20
              const result = typeof p.finalResult === 'number' ? p.finalResult : 0
              const diff = Math.abs(result - target)
              return {
                name: p.name,
                declaration: p.declaration,
                result: p.declaration === 'SWING' ? null : p.finalResult,
                lowResult: p.declaration === 'SWING' ? p.lowResult : null,
                highResult: p.declaration === 'SWING' ? p.highResult : null,
                lowEqStr: p.lowEqStr || null,
                highEqStr: p.highEqStr || null,
                equation: p.equationStr || '(built manually)',
                isLowWinner: p.id === sp.id,
                isHighWinner: p.id === sp.id,
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
          // (Calculated inline below for return object)
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
