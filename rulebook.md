# Equation Hi-Lo — Complete Rulebook

_A game of poker-style betting meets mathematical equation building_
_Inspired by "The Devil's Plan" (Netflix), created by Jung Jong-yeon_

---

## 1. Overview

Equation Hi-Lo is a chip-based card game where players construct mathematical equations to produce results as close to **1** (low) or **20** (high) as possible, while betting against each other in poker-style rounds. The player whose equation result is nearest to their declared target wins the pot.

---

## 2. Components

### The Main Deck (52 cards)

| Card Type                 | Details                                                | Count |
| ------------------------- | ------------------------------------------------------ | ----- |
| **Number cards**          | Values 0–10 in four suits: Gold, Silver, Bronze, Black | 44    |
| **Multiply (×) cards**    | 4 total (no suit)                                      | 4     |
| **Square Root (√) cards** | 4 total (no suit)                                      | 4     |

### Given Operation Cards (per player, per round)

Each player receives these three operation cards at the start of every round. These are **not** drawn from the deck and are returned/refreshed each round:

- **Plus (+)**
- **Minus (−)**
- **Divide (÷)**

### Other Materials

- Poker chips (quantity and denominations agreed upon by players)
- Declaration tiles or tokens (for declaring 1, 20, or both)
- **Win Order reference card** (for tiebreaking — see Section 9)

---

## 3. Setup

1. Players agree on a **minimum bet (ante)** amount.
2. Each player receives a starting stack of chips.
3. Shuffle the 52-card main deck.
4. Each player receives their 3 given operation cards: **+**, **−**, **÷**.
5. Select a dealer. Play proceeds clockwise.

---

## 4. Round Structure

Each round follows this sequence:

```
ANTE → DEAL 3 CARDS → BETTING ROUND 1 → DEAL 1 CARD → BETTING ROUND 2 → DECLARATION & SHOWDOWN
```

### Step-by-Step:

**1. Ante**
All players place the agreed minimum bet into the pot.

**2. Deal — First 3 Cards**
Each player receives 3 cards from the deck:

- **Card 1:** Dealt **face-down** (closed) — only the player may look at it. **This card must be a number card.** If a × or √ is drawn, it is returned to the deck and the player draws again until they receive a number.
- **Cards 2 & 3:** Dealt **face-up** (open) — visible to all players. These may be number cards, × cards, or √ cards. Special draw rules apply (see Section 5).

**3. Betting Round 1**
Players bet in turn (see Section 6).

**4. Deal — 4th Card**
Each player receives 1 additional card dealt **face-up** (open). Special draw rules apply if × or √.

**5. Betting Round 2**
Players bet in turn again.

**6. Declaration & Showdown**
All remaining players declare their target and reveal their equations (see Sections 7 & 8).

---

## 5. Special Card Draw Rules

### Drawing a Square Root (√)

When a player draws a √ card from the deck (in any open card position):

1. The √ card is placed face-up in front of the player.
2. The player draws **1 additional card** from the deck (must be a number card — if another √ or × is drawn, see below).
3. The player keeps **all three** given operation cards (+, −, ÷). No discard is required.
4. The √ will be applied as a unary operator to one number card in the player's equation.

### Drawing a Multiply (×)

When a player draws a × card from the deck (in any open card position):

1. The × card is placed face-up in front of the player.
2. The player draws **1 additional card** from the deck (must be a number card).
3. The player **must discard** either their **+** or **−** card (player's choice). The × replaces the discarded operation as one of the player's three binary operators.
4. **Limit:** A player may only possess **one** × operator at a time. If a second × is drawn, it is returned to the deck and a replacement card is drawn.

### Multiple Special Cards

| Scenario        | Handling                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **2 √ cards**   | Draw 1 extra number for each √. No operations discarded. Player has: 4 numbers, 2 √ modifiers, +, −, ÷.                   |
| **1 √ and 1 ×** | Draw 1 extra number for each. Discard either + or − for the ×. Player has: 4 numbers, 1 √ modifier, ×, ÷, and one of +/−. |
| **3 √ cards**   | Draw 1 extra number for each √. No discards. Player has: 4 numbers, 3 √ modifiers, +, −, ÷.                               |

> **Note:** The extra card drawn as a result of a × or √ **must be a number card**. If the next card in the deck is another special card, it is set aside and the next available number card is drawn instead.

---

## 6. Betting

### Betting Cap

The **maximum total amount** any player may wager in a single round (including ante) is equal to the **smallest chip stack** among all active players **at the start of the round** (before the ante is paid).

> **Example:** Players A (50 chips), B (30 chips), and C (12 chips) are in a round. The ante is 2. The betting cap is 12 (Player C's stack). After the ante, each player has wagered 2. Players may bet up to 10 more chips total across both betting rounds (12 − 2 = 10 remaining).

If the betting cap has been reached (all players have wagered the maximum), **remaining betting rounds are skipped** and play proceeds directly to the next phase.

### Betting Actions

During each betting round, players act in clockwise order starting from the player to the dealer's left, with the following options:

| Action          | Description                                                                |
| --------------- | -------------------------------------------------------------------------- |
| **Check**       | Pass without betting (only if no one has bet yet in this betting round).   |
| **Bet / Raise** | Place or increase the current bet, up to the betting cap.                  |
| **Call**        | Match the current bet amount.                                              |
| **Fold**        | Forfeit your hand and any chips already wagered. You are out of the round. |

- A betting round ends when all active players have acted and all bets are equalized.
- All standard poker betting etiquette applies (no string bets, etc.).

---

## 7. Declaration

After the final betting round, all remaining players **simultaneously** declare their target using tiles or tokens:

| Declaration        | Meaning                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 (Low)**        | Your equation aims to be as close to **1** as possible.                                                                                                                                                        |
| **20 (High)**      | Your equation aims to be as close to **20** as possible.                                                                                                                                                       |
| **1 & 20 (Swing)** | You will construct **two** equations — one targeting 1 and one targeting 20 — using the **same set of cards** rearranged differently. You must **win both sides** or you **lose everything** (see Section 10). |

---

## 8. Showdown — Equation Building & Scoring

### Building Your Equation

Each player arranges **all** of their cards (number cards and operation cards) into a valid mathematical equation:

- All number cards **must** be used.
- All remaining operation cards **must** be used.
- **Binary operations** (+, −, ×, ÷) go **between** two numbers.
- **√** is a unary operator and must be placed **immediately before** the number card it modifies. Each √ applies to exactly one number card.
- The equation is evaluated using **standard order of operations (PEMDAS)**:
  1. √ (applied to its number first)
  2. × and ÷ (left to right)
  3. - and − (left to right)
- Results **can be negative**, fractional, or zero.
- **Division by zero is not permitted.** A player may not construct an equation that results in division by zero.

### Example Equations

**Targeting 1 (Low):**

```
√4 ÷ 7 + 9 − 8
= 2 ÷ 7 + 9 − 8
= 0.286 + 9 − 8
= 1.286
Distance from 1: |1.286 − 1| = 0.286
```

**Targeting 20 (High):**

```
8 × 3 ÷ 1 − 4
= 24 ÷ 1 − 4
= 24 − 4
= 20
Distance from 20: |20 − 20| = 0
```

---

## 9. Pot Distribution

### Splitting the Pot

The pot is divided into **two equal halves**:

- **Low Half** — awarded to the best Low (1) declarer.
- **High Half** — awarded to the best High (20) declarer.

"Best" is determined by the **smallest absolute difference** between the player's equation result and their target number.

### Odd-Chip Rule

When the pot contains an **odd number of chips** and must be split between Low and High:

- Each side receives **floor(pot ÷ 2)** chips.
- The **remaining 1 chip is removed from the game** (kept by the house).

> **Example:** Pot = 19 chips. Low winner receives 9 chips. High winner receives 9 chips. 1 chip is removed from play.

This rule applies to **any** pot split that results in a remainder — the leftover is always discarded.

### Pot Scenarios

| Scenario                              | Result                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Both sides have declarers**         | Pot splits 50/50 (minus any odd chip). Each side's winner takes their half.                                        |
| **Nobody declared Low**               | The entire pot goes to the High winner.                                                                            |
| **Nobody declared High**              | The entire pot goes to the Low winner.                                                                             |
| **All players declare the same side** | The entire pot goes to the winner of that side. The other side has no declarers, so no split occurs.               |
| **All players fold except one**       | The remaining player wins the entire pot immediately without showdown (no equation needed, no declaration needed). |

---

## 10. Tiebreaking — Win Order

When two or more players' equations are **equally close** to the target, the tie is broken as follows:

### Step 1: Compare Key Number Card

- **High (20) tie:** Compare the **highest-value number card** in each tied player's hand. The player with the higher number wins.
- **Low (1) tie:** Compare the **lowest-value number card** in each tied player's hand. The player with the lower number wins.

### Step 2: Compare Suit (if numbers are identical)

If the key number cards have the same value, compare their **suits**:

| Tie Type      | Suit Priority (strongest → weakest) |
| ------------- | ----------------------------------- |
| **High (20)** | Gold > Silver > Bronze > Black      |
| **Low (1)**   | Black > Bronze > Silver > Gold      |

> **Note:** Since each card in the deck is unique (a specific value + suit combination), the suit comparison will always produce a definitive winner. True ties are impossible.

---

## 11. Swing Bet (Declaring Both 1 & 20)

A swing bet is a high-risk, high-reward play:

1. The player constructs **two separate equations** using the **exact same set of cards**, rearranged differently.
2. One equation targets **1**, the other targets **20**.
3. The player's Low equation competes against all other Low declarers. The player's High equation competes against all other High declarers.
4. The player must **win both** the Low side and the High side to claim the **entire pot** (not just one half).
5. If the player **fails either side**, they **win nothing** — both halves are awarded to the respective side winners as normal.

### Swing Pot Scenarios

| Scenario                                        | Result                                                                                                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Swing player wins both sides**                | Swing player takes the **entire pot**. No other player receives anything.                                                                                                            |
| **Swing player wins Low but loses High**        | Swing player receives **nothing**. Low half goes to the **next best** Low declarer (if any; otherwise the Low half also goes to the High winner). High half goes to the High winner. |
| **Swing player wins High but loses Low**        | Swing player receives **nothing**. Same logic reversed.                                                                                                                              |
| **Swing player loses both sides**               | Swing player receives **nothing**. Each side's winner takes their half normally.                                                                                                     |
| **Swing player is the only declarer on a side** | The swing player automatically wins that side (uncontested). They still must win the other side too.                                                                                 |
| **No other declarers exist on either side**     | The swing player wins both sides by default and takes the entire pot.                                                                                                                |

> **Note on ties involving a swing player:** If the swing player ties on one side (resolved via tiebreaker in Section 10), the tiebreaker result counts. A tiebreaker win counts as a win for swing purposes; a tiebreaker loss counts as a loss and the swing fails.

---

## 12. Player Elimination

- A player is **eliminated** when their chip stack reaches **0** at the end of a round.
- An eliminated player cannot participate in further rounds.
- If only **one player remains**, that player wins the game immediately.
- If a player's chips are exactly equal to the ante at the start of a round, they must go all-in on the ante. Their remaining participation in that round's betting is automatic (they are treated as all-in and cannot bet further, but remain in the hand through showdown).

---

## 13. End of Game

The game continues for as many rounds as players agree upon. The player with the **most chips** at the end is the winner.

Alternatively, the game may end when all players except one have been eliminated.

---

## 14. Quick Reference — Card Anatomy

Each player's hand at showdown consists of:

| Component         | Source          | Quantity                                   |
| ----------------- | --------------- | ------------------------------------------ |
| Number cards      | Drawn from deck | 4 (always, after special draw adjustments) |
| Binary operations | Given + drawn   | 3 (always: some combination of +, −, ÷, ×) |
| √ modifiers       | Drawn from deck | 0–3 (unary, each applied to one number)    |

The equation always follows the structure:

```
[√]Number ○ [√]Number ○ [√]Number ○ [√]Number
```

Where `○` represents one of the 3 binary operations, and `[√]` is optionally applied.

---

## 15. House Rules & Edge Cases to Agree On Before Play

These situations are rare but should be decided before starting:

1. **Can √ be nested?** (e.g., √(√9) = √3 ≈ 1.732) - No. Each √ applies to exactly one number card.
2. **√ of non-perfect squares:** Results in irrational numbers (e.g., √7 ≈ 2.6458). These are valid and computed to reasonable precision.
3. **Swing bet ties:** If a swing bettor ties on one side, the standard tiebreaker (Section 10) determines the result. A tiebreaker win counts as a win for swing purposes.
4. **Number of rounds:** Fixed number, timed session, or elimination-style? Agree before play.
5. **Player count:** The deck supports roughly 2–8 players comfortably, depending on how many special cards are drawn.
6. **Starting chip count:** Recommended 50–100 chips per player with an ante of 1–2 chips.

---

_Good luck, and may your equations be precise!_
