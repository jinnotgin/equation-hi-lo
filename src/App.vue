<template>
  <div
    class="min-h-screen bg-felt-green flex flex-col items-center py-4 sm:py-8 px-3 sm:px-4 font-sans text-slate-100"
  >
    <!-- Lobby Screen -->
    <div v-if="gameStore.phase === 'LOBBY'" class="flex flex-col items-center gap-4 sm:gap-6 mt-2 sm:mt-6 w-full px-0 sm:px-4">
      <!-- Top row: two-column layout -->
      <div class="flex flex-col lg:flex-row gap-4 sm:gap-8 items-stretch max-w-5xl w-full">
        <!-- Left: App Info / Branding -->
        <div
          class="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl p-4 sm:p-8 flex flex-col justify-center"
        >
          <h2 class="text-3xl sm:text-5xl font-bold text-gold tracking-widest mb-3 sm:mb-4">
            EQUATION<br />HI-LO ♠
          </h2>
          <p class="text-slate-300 text-sm sm:text-base italic leading-relaxed mb-3 sm:mb-4">
            Inspired by "The Devil's Plan" (Netflix), created by Jung Jong-yeon
          </p>
          <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">
            A poker-style game where <strong class="text-white">math is your weapon</strong>.
            Combine your cards into an equation to hit the target number.
          </p>
          <div class="grid grid-cols-3 gap-3 sm:flex sm:gap-6 text-xs sm:text-sm text-slate-400">
            <div class="flex flex-col items-center gap-1">
              <span class="text-xl sm:text-2xl">🎯</span>
              <span class="text-blue-400 font-bold">LOW</span>
              <span>Target 1</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-xl sm:text-2xl">🎯</span>
              <span class="text-red-400 font-bold">HIGH</span>
              <span>Target 20</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-xl sm:text-2xl">⚡</span>
              <span class="text-amber-400 font-bold">SWING</span>
              <span>Win Both!</span>
            </div>
          </div>
        </div>

        <!-- Right: Game Controls -->
        <div
          class="bg-felt-dark p-4 sm:p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 sm:gap-5 w-full lg:w-80 shrink-0"
        >
          <div class="w-full flex items-center justify-between">
            <h3 class="text-lg font-bold text-gold tracking-wider">New Game</h3>
            <!-- <button
              @click="showSettingsDialog = true"
              class="px-3 py-1 rounded-md border border-slate-600 text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-gold hover:border-gold transition-colors"
            >
              Settings
            </button> -->
          </div>

          <label class="text-sm font-bold text-slate-300 uppercase tracking-wide"
            >AI Opponents</label
          >
          <div class="grid grid-cols-3 gap-2 w-full max-w-xs">
            <button
              v-for="n in [1, 2, 3]"
              :key="n"
              @click="selectedAiCount = n"
              class="w-full h-12 sm:w-14 sm:h-14 rounded-lg text-lg sm:text-xl font-bold transition-all duration-200 border-2"
              :class="
                selectedAiCount === n
                  ? 'bg-gold text-black border-gold sm:scale-110 shadow-lg'
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-gold hover:text-gold'
              "
            >
              {{ n }}
            </button>
          </div>
          <p class="text-xs text-slate-500">{{ selectedAiCount + 1 }} players total</p>

          <label class="text-sm font-bold text-slate-300 uppercase tracking-wide">Rounds</label>
          <div class="grid grid-cols-3 gap-2 w-full max-w-xs">
            <button
              v-for="r in [
                { val: 5, label: '5' },
                { val: 10, label: '10' },
                { val: 0, label: '∞' },
              ]"
              :key="r.val"
              @click="selectedRounds = r.val"
              class="w-full h-12 sm:w-14 sm:h-14 rounded-lg text-lg sm:text-xl font-bold transition-all duration-200 border-2"
              :class="
                selectedRounds === r.val
                  ? 'bg-gold text-black border-gold sm:scale-110 shadow-lg'
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-gold hover:text-gold'
              "
            >
              {{ r.label }}
            </button>
          </div>
          <p class="text-xs text-slate-500">
            {{ selectedRounds === 0 ? 'Elimination mode' : `${selectedRounds} rounds` }}
          </p>

          <div class="w-full rounded-lg border border-slate-700 bg-slate-900/40 p-3">
            <div class="flex items-start justify-between gap-3.5">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  AI Behavior
                </p>
                <p class="text-xs mt-1 text-slate-400">
                  {{
                    gameStore.aiMistakesEnabled
                      ? 'Human-like AI with occasional missteps.'
                      : 'AI always makes the most optimal move.'
                  }}
                </p>
              </div>
              <button
                @click="showSettingsDialog = true"
                class="px-2.5 py-1 rounded-md border border-slate-600 text-[10px] font-bold uppercase tracking-wider text-slate-200 hover:text-gold hover:border-gold transition-colors"
              >
                Edit
              </button>
            </div>
          </div>

          <button
            @click="
              gameStore.initGame(selectedAiCount, selectedRounds, gameStore.aiMistakesEnabled)
            "
            class="bg-gold text-black font-bold px-10 py-3 rounded-lg hover:bg-yellow-400 text-base sm:text-lg tracking-wider shadow-lg transition-transform hover:scale-105 mt-1.5 sm:mt-2 w-full min-h-12"
          >
            ▶ Start Game
          </button>
        </div>
      </div>

      <!-- Bottom: How to Play (Progressive Disclosure) -->
      <div class="max-w-5xl w-full">
        <button
          @click="toggleRules"
          class="w-full text-center py-2.5 sm:py-3 rounded-lg border border-slate-700 hover:border-gold bg-slate-900/40 hover:bg-slate-900/60 transition-all text-gold hover:text-yellow-300 text-xs sm:text-sm font-bold uppercase tracking-wider"
        >
          {{ showRules ? '▲ Hide How to Play' : '▼ How to Play' }}
        </button>
        <div
          v-if="showRules"
          ref="rulesSection"
          class="bg-slate-900/80 border border-slate-700 border-t-0 rounded-b-xl p-4 sm:p-6 text-sm text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"
        >
          <div>
            <h4 class="text-gold font-bold text-sm mb-1">🃏 Cards</h4>
            <p>
              <strong>Numbers:</strong> 0–9. <br /><strong>Suits:</strong> Gold, Silver, Bronze,
              Black (used for tiebreakers). <br /><strong>Special:</strong>
              <span class="text-purple-400">√</span> (Square Root) and
              <span class="text-blue-400">×</span> (Multiply).
            </p>
          </div>
          <div>
            <h4 class="text-gold font-bold text-sm mb-1">🃏 Game Flow</h4>
            <p>
              1. <strong>Deal:</strong> You get numbers and math operators (+, −, ÷). <br />2.
              <strong>Bet:</strong> Raise, call, or fold like poker. <br />3.
              <strong>Showdown:</strong> Build an equation!
            </p>
          </div>
          <div>
            <h4 class="text-gold font-bold text-sm mb-1">🏆 Winning the Pot</h4>
            <p>
              Combine your cards to make an equation. <br />Target
              <span class="text-blue-400 font-bold">1</span> (Low) or
              <span class="text-red-400 font-bold">20</span> (High). <br />Closest to the target
              wins half the pot.
            </p>
          </div>
          <div>
            <h4 class="text-gold font-bold text-sm mb-1">⚡ Swing Bet</h4>
            <p>
              Feeling lucky? Declare <strong>SWING</strong> to build TWO equations (one for Low, one
              for High). <br /><strong>Rule:</strong> You must win BOTH sides to take the whole pot!
            </p>
          </div>
          <div class="md:col-span-2 border-t border-slate-700 pt-3">
            <h4 class="text-gold font-bold text-sm mb-2">⭐ Important Rules</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-400">
              <p>
                &bull; <strong class="text-slate-300">Elimination:</strong> Run out of chips? You're
                out. Last player standing wins.
              </p>
              <p>
                &bull; <strong class="text-slate-300">Ante:</strong> Everyone pays a fixed ante when
                the round starts (doesn't count as a bet).
              </p>
              <p>
                &bull; <strong class="text-slate-300">√ Card:</strong> Applies square root to the
                <em>next</em> number in your equation.
              </p>
              <p>
                &bull; <strong class="text-slate-300">× Card:</strong> Can be used to multiply (Max
                1 per player). Must discard a + or −.
              </p>
              <p>
                &bull; <strong class="text-slate-300">Tiebreaker:</strong> Equal distance to target?
                Lowest card wins Low; Highest card wins High.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="mt-8 sm:mt-12 mb-4 sm:mb-8 text-center text-sm sm:text-base text-slate-400 font-mono tracking-wide font-semibold"
      >
        <p class="mb-2">
          Created by
          <a
            href="https://linjin.me"
            target="_blank"
            class="text-lime-400 hover:text-gold transition-colors underline decoration-slate-600 underline-offset-4"
            >Jin</a
          >
          &copy; 2026 • v{{ displayVersion }}
        </p>
        <p v-if="!isMobileLayout" class="text-sm opacity-65 uppercase tracking-widest">
          Built using Agentic Engineering •
          <a
            href="https://www.anthropic.com/news/claude-opus-4-6"
            target="_blank"
            class="hover:text-gold transition-colors border-b border-dotted border-slate-600 hover:border-gold"
            >Claude 4.6 Opus</a
          >
          •
          <a
            href="https://openai.com/index/introducing-gpt-5-3-codex/"
            target="_blank"
            class="hover:text-gold transition-colors border-b border-dotted border-slate-600 hover:border-gold"
            >GPT 5.3 Codex</a
          >
          •
          <a
            href="https://blog.google/products-and-platforms/products/gemini/gemini-3/"
            target="_blank"
            class="hover:text-gold transition-colors border-b border-dotted border-slate-600 hover:border-gold"
            >Gemini 3 Pro</a
          >
        </p>
        <p v-else class="text-[11px] opacity-65 uppercase tracking-widest">
          Built with Claude • GPT • Gemini
        </p>
      </div>
    </div>

    <div
      v-if="showSettingsDialog && gameStore.phase === 'LOBBY'"
      class="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4"
      @click.self="showSettingsDialog = false"
    >
      <div class="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-gold text-lg font-bold tracking-wider">Settings</h3>
          <button
            @click="showSettingsDialog = false"
            class="text-slate-300 hover:text-white text-xl leading-none"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <p class="text-xs text-slate-400 mb-4">Adjust settings before starting a new game.</p>

        <div class="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-bold text-white">AI makes mistakes</p>
              <p class="text-xs text-slate-400 mt-1">
                When on, AI opponents play more like humans - with personality and occasional
                mistakes. When off, AI always makes the optimal move.
              </p>
            </div>
            <button
              @click="gameStore.setAiMistakesEnabled(!gameStore.aiMistakesEnabled)"
              class="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors"
              :class="
                gameStore.aiMistakesEnabled
                  ? 'bg-emerald-600 border-emerald-400'
                  : 'bg-slate-700 border-slate-500'
              "
              role="switch"
              :aria-label="
                gameStore.aiMistakesEnabled
                  ? 'Disable AI mistakes and personality variation'
                  : 'Enable AI mistakes and personality variation'
              "
              :aria-checked="gameStore.aiMistakesEnabled ? 'true' : 'false'"
            >
              <span
                class="absolute top-1 left-1 inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform"
                :class="gameStore.aiMistakesEnabled ? 'translate-x-6' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>

        <div class="mt-5 flex justify-end">
          <button
            @click="showSettingsDialog = false"
            class="px-5 py-2 rounded-md bg-gold text-black font-bold hover:bg-yellow-400 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>

    <!-- Main Table (Rounded Poker Table Shape) -->
    <template v-if="gameStore.phase !== 'LOBBY'">
      <template v-if="isMobileLayout">
        <div class="fixed inset-0 bg-felt-dark"></div>

        <Transition
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0 scale-90"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-300 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-110"
        >
          <div
            v-if="gameStore.announcement && gameStore.announcement.visible"
            class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm pointer-events-auto p-4"
          >
            <div class="flex flex-col items-center justify-center">
              <div
                class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-tight uppercase text-center"
                style="-webkit-text-stroke: 1.5px black"
              >
                {{ gameStore.announcement.msg }}
              </div>
              <div
                class="w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent mt-3 shadow-[0_0_12px_#ffd700]"
              ></div>
            </div>
          </div>
        </Transition>

        <div class="fixed inset-0 z-[40] flex flex-col">
          <div
            class="sticky top-0 z-20 border-b border-slate-700/80 bg-black/70 backdrop-blur px-3 pt-3 pb-2"
          >
            <div class="flex items-center justify-between gap-2">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {{ phaseLabel }}
                </p>
                <p class="text-lg font-bold text-gold">Pot ${{ gameStore.pot }}</p>
              </div>

              <button
                v-if="gameStore.phase !== 'GAME_OVER'"
                @click="exitGame"
                class="h-10 w-10 shrink-0 rounded-full border border-white/60 bg-black/70 text-white text-2xl leading-none hover:bg-white/10 transition-colors flex items-center justify-center"
                aria-label="Exit Game"
                title="Exit Game"
              >
                <span class="relative -top-px">×</span>
              </button>
            </div>

            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-400">Round {{ gameStore.roundNumber }}</span>
              <span v-if="isAutoResolvingShowdown" class="text-gold uppercase tracking-wider font-bold"
                >Finalising showdown...</span
              >
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-3 py-3 pb-3">
            <div class="rounded-xl border border-slate-700/80 bg-black/45 p-2.5">
              <div class="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Opponents
              </div>
              <div class="space-y-2">
                <div
                  v-for="p in opponents"
                  :key="p.id"
                  class="relative rounded-lg border p-2 transition-all"
                  :class="{
                    'opacity-40 grayscale': p.folded || p.eliminated,
                    'border-gold/70 bg-gold/10 shadow-[0_0_14px_rgba(255,215,0,0.12)]':
                      gameStore.currentTurnIndex === p.id && !gameStore.winnerMsg,
                    'border-slate-600 bg-slate-900/70': !(gameStore.currentTurnIndex === p.id && !gameStore.winnerMsg),
                  }"
                >
                  <div
                    v-if="p.currentBet > 0 && ['ROUND_1', 'ROUND_2'].includes(gameStore.phase)"
                    class="absolute top-2 right-2 text-base font-bold text-amber-300"
                  >
                    Bet ${{ p.currentBet }}
                  </div>

                  <div class="flex items-center gap-2.5">
                    <div
                      class="relative w-9 h-9 rounded-full overflow-hidden border-2 bg-slate-800 shrink-0"
                      :class="gameStore.currentTurnIndex === p.id && !gameStore.winnerMsg ? 'border-gold' : 'border-slate-500'"
                    >
                      <img
                        :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`"
                        alt="AI"
                        class="w-full h-full"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <div class="truncate text-sm font-bold text-white">{{ p.name }}</div>
                        <Tooltip text="Dealer" v-if="gameStore.dealerIndex === p.id">
                          <div
                            class="bg-white text-black font-bold rounded-full w-4 h-4 flex items-center justify-center border border-slate-400 text-[10px] shadow-sm cursor-help"
                          >
                            D
                          </div>
                        </Tooltip>
                        <span
                          v-if="p.lastAction"
                          class="px-1.5 py-0.5 rounded border border-slate-500 text-[9px] text-slate-300 font-semibold uppercase tracking-wide"
                        >
                          {{ p.lastAction }}
                        </span>
                        <span
                          v-if="p.eliminated || p.folded"
                          class="px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide"
                          :class="
                            p.eliminated
                              ? 'text-slate-400 border-slate-600'
                              : 'text-rose-300 border-rose-500/60'
                          "
                        >
                          {{ p.eliminated ? 'Out' : 'Folded' }}
                        </span>
                      </div>
                      <div class="mt-0.5 flex items-center gap-2">
                        <div class="text-sm font-mono font-extrabold text-gold">${{ p.chips }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-2 overflow-x-auto">
                    <div class="flex items-center gap-1.5 min-w-max">
                      <Card
                        v-for="(c, i) in p.hand"
                        :key="c.id || i"
                        :card="c"
                        :isFaceDown="c.faceDown"
                        :compact="true"
                        class="shrink-0"
                      />
                      <div
                        v-for="(op, oi) in p.ops"
                        :key="oi"
                        class="w-7 h-9 rounded-md text-sm font-bold flex items-center justify-center border-2 shrink-0"
                        :class="opStyle(op)"
                      >
                        {{ op }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="sticky bottom-0 border-t border-slate-700/80 bg-black/80 backdrop-blur px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.8rem)]"
          >
            <div
              class="relative rounded-xl border p-2.5"
              :class="{
                'opacity-50 grayscale': me.folded,
                'border-gold/70 bg-gold/10': isMyTurn && !gameStore.winnerMsg,
                'border-slate-700 bg-slate-900/60': !(isMyTurn && !gameStore.winnerMsg),
              }"
            >
              <div class="flex items-center gap-3">
                <div
                  v-if="me.currentBet > 0 && ['ROUND_1', 'ROUND_2'].includes(gameStore.phase)"
                  class="absolute top-2 right-2 text-base font-bold text-amber-300"
                >
                  Bet ${{ me.currentBet }}
                </div>

                <div class="flex items-center min-w-0 flex-1">
                  <div class="min-w-0 flex-1 pr-20">
                    <div class="flex items-center gap-1.5">
                      <div class="truncate text-sm font-bold text-white">{{ me.name }}</div>
                      <Tooltip text="Dealer" v-if="gameStore.dealerIndex === me.id">
                        <div
                          class="bg-white text-black font-bold rounded-full w-4 h-4 flex items-center justify-center border border-slate-400 text-[10px] shadow-sm cursor-help"
                        >
                          D
                        </div>
                      </Tooltip>
                      <span
                        v-if="me.lastAction"
                        class="px-1.5 py-0.5 rounded border border-slate-500 text-[9px] text-slate-300 font-semibold uppercase tracking-wide"
                      >
                        {{ me.lastAction }}
                      </span>
                      <span
                        v-if="me.eliminated || me.folded"
                        class="px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide"
                        :class="
                          me.eliminated ? 'text-slate-400 border-slate-600' : 'text-rose-300 border-rose-500/60'
                        "
                      >
                        {{ me.eliminated ? 'Out' : 'Folded' }}
                      </span>
                    </div>
                    <div class="mt-0.5 flex items-center gap-2">
                      <div class="text-sm font-mono font-extrabold text-gold">${{ me.chips }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-2 overflow-x-auto">
                <div class="flex items-center gap-2 min-w-max">
                  <TransitionGroup name="deal-card" tag="div" class="flex gap-2">
                    <Card
                      v-for="(c, i) in sortedHand"
                      :key="c.id"
                      :card="c"
                      :isFaceDown="false"
                      :compact="true"
                      class="shadow-xl"
                      :style="{ 'z-index': i }"
                    />
                  </TransitionGroup>

                  <div
                    v-for="(op, i) in me.ops"
                    :key="i"
                    class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-md border-2"
                    :class="opStyle(op)"
                  >
                    {{ op }}
                  </div>
                </div>
              </div>

              <div
                v-if="isMyTurn && ['ROUND_1', 'ROUND_2'].includes(gameStore.phase)"
                class="mt-3 grid grid-cols-2 gap-2"
              >
                <div v-if="canRaise" class="col-span-2 grid grid-cols-[44px_1fr_44px] gap-2 items-center">
                  <button
                    @click="adjustRaise(-10)"
                    class="h-11 rounded-lg bg-slate-700 hover:bg-slate-600 text-lg font-bold border border-slate-500"
                  >
                    −
                  </button>
                  <button
                    @click="action('raise')"
                    class="h-11 bg-gold text-black hover:bg-yellow-400 px-4 rounded-lg font-bold uppercase tracking-wider border border-yellow-600 text-sm"
                  >
                    Raise ${{ raiseAmount }}
                  </button>
                  <button
                    @click="adjustRaise(10)"
                    class="h-11 rounded-lg bg-slate-700 hover:bg-slate-600 text-lg font-bold border border-slate-500"
                  >
                    +
                  </button>
                </div>
                <button
                  @click="action('fold')"
                  class="min-h-11 bg-red-900 hover:bg-red-700 px-4 py-2.5 rounded-lg font-bold uppercase tracking-wider border border-red-500 text-sm"
                >
                  Fold
                </button>
                <button
                  @click="action('call')"
                  class="min-h-11 bg-slate-600 hover:bg-slate-500 px-4 py-2.5 rounded-lg font-bold uppercase tracking-wider border border-slate-400 text-sm"
                >
                  {{ toCall === 0 ? 'Check' : `Call $${toCall}` }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <button
          v-if="gameStore.phase !== 'GAME_OVER'"
          @click="exitGame"
          class="fixed top-5 right-5 z-[70] h-9 w-9 rounded-full border border-white/50 bg-black/70 text-white text-xl leading-none hover:bg-white/10 hover:border-white transition-colors flex items-center justify-center"
          aria-label="Exit Game"
          title="Exit Game"
        >
          <span class="relative -top-px">×</span>
        </button>

        <!-- Background Layer (The Felt & Border) -->
        <div
          class="fixed inset-4 sm:inset-8 bg-felt-dark border-[20px] border-slate-800 shadow-2xl rounded-[150px] md:rounded-[300px] lg:rounded-[400px] pointer-events-none"
        ></div>

        <!-- Content Layer (UI Overlay - No Clipping) -->
        <div class="fixed inset-4 sm:inset-8 flex items-center justify-center">
        <!-- Central Announcement Overlay -->
        <Transition
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0 scale-90"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-300 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-110"
        >
          <div
            v-if="gameStore.announcement && gameStore.announcement.visible"
            class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm pointer-events-auto"
          >
            <div class="flex flex-col items-center justify-center">
              <div
                class="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-tighter uppercase text-center stroke-text transform scale-110"
                style="-webkit-text-stroke: 2px black"
              >
                {{ gameStore.announcement.msg }}
              </div>
              <div
                class="w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent mt-4 shadow-[0_0_15px_#ffd700]"
              ></div>
            </div>
          </div>
        </Transition>

        <!-- Opponents (Top) -->
        <div
          class="absolute top-6 flex"
          :class="opponents.length === 1 ? 'gap-0' : opponents.length === 2 ? 'gap-32' : 'gap-16'"
        >
          <div
            v-for="p in opponents"
            :key="p.id"
            class="flex flex-col items-center transition-all duration-500 p-4 rounded-xl relative border"
            :class="{
              'opacity-40 scale-95': p.folded,
              'opacity-100 scale-100': !p.folded,
              'border-white/20 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]':
                gameStore.currentTurnIndex === p.id && !gameStore.winnerMsg,
              'border-transparent': !(gameStore.currentTurnIndex === p.id && !gameStore.winnerMsg),
            }"
          >
            <!-- Flying Chip Animation (Opponents - Moves to Center) -->
            <div
              v-if="gameStore.collectingAnte && !p.eliminated"
              class="absolute top-1/2 left-1/2 w-8 h-8 z-50 pointer-events-none"
              :style="getAnteStyle(p.id)"
            >
              <div
                class="w-8 h-8 rounded-full bg-yellow-500 border-2 border-yellow-300 shadow-xl flex items-center justify-center text-[10px] font-bold text-black animate-spin-slow"
              >
                $10
              </div>
            </div>
            <div class="relative">
              <div
                class="w-16 h-16 rounded-full overflow-hidden border-4 bg-slate-800 shadow-lg mb-2 relative"
                :class="
                  gameStore.currentTurnIndex === p.id && !gameStore.winnerMsg
                    ? 'border-gold scale-110 border-pulse'
                    : 'border-slate-600'
                "
              >
                <img
                  :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`"
                  alt="AI"
                  class="w-full h-full"
                />
                <!-- Status overlay -->
                <div
                  v-if="p.folded"
                  class="absolute inset-0 bg-red-900/80 flex items-center justify-center font-bold text-xs uppercase tracking-wider"
                >
                  Fold
                </div>
              </div>
              <!-- Thinking Indicator -->
              <div
                v-if="gameStore.currentTurnIndex === p.id && !gameStore.winnerMsg"
                class="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
              >
                Thinking...
              </div>
              <!-- Action Toast (right of avatar) -->
              <div
                v-if="p.lastAction"
                class="action-toast absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xl border whitespace-nowrap z-30"
                :class="actionToastStyle(p.lastAction)"
              >
                {{ p.lastAction }}
              </div>
            </div>
            <div class="flex items-center gap-1 mt-1">
              <span class="font-bold text-base">{{ p.name }}</span>
              <Tooltip text="Dealer" v-if="gameStore.dealerIndex === p.id">
                <div
                  class="bg-white text-black font-bold rounded-full w-4 h-4 flex items-center justify-center border border-slate-400 text-[10px] shadow-sm cursor-help"
                >
                  D
                </div>
              </Tooltip>
            </div>
            <span class="text-gold font-mono font-bold text-base">${{ p.chips }}</span>
            <!-- Cards + Ops row -->
            <div class="flex items-center gap-2 mt-1.5 relative">
              <TransitionGroup name="deal-card" tag="div" class="flex -space-x-1">
                <Card
                  v-for="(c, i) in p.hand"
                  :key="c.id || i"
                  :card="c"
                  :isFaceDown="c.faceDown"
                  :compact="true"
                  class="origin-bottom transition-transform hover:-translate-y-2 hover:rotate-1"
                />
              </TransitionGroup>
              <!-- Opponent Operations (Styled like Player) -->
              <div class="flex gap-1 ml-1">
                <div
                  v-for="(op, oi) in p.ops"
                  :key="oi"
                  class="w-8 h-10 rounded-lg text-lg font-bold flex items-center justify-center shadow-md border-2"
                  :class="opStyle(op)"
                >
                  {{ op }}
                </div>
              </div>
              <!-- Bet Badge (Repositioned Below Cards) -->
              <div
                v-if="p.currentBet > 0 && ['ROUND_1', 'ROUND_2'].includes(gameStore.phase)"
                class="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/90 border border-gold px-3 py-0.5 rounded text-base text-gold shadow-lg font-bold whitespace-nowrap z-20 flex items-baseline gap-1"
              >
                <span class="text-[10px] text-slate-400 uppercase">Bet</span>
                <span>${{ p.currentBet }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Center Pot/Community & HUD -->
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full flex flex-col items-center justify-center pointer-events-none"
        >
          <!-- Central HUD (Pot & Round) - Hide during Showdown to avoid clutter -->
          <div
            v-if="!gameStore.winnerMsg"
            class="mb-4 flex flex-col items-center animate-pulse-slow"
          >
            <div class="text-slate-500 text-base uppercase tracking-widest font-bold mb-1">
              Current Pot
            </div>
            <div class="text-gold font-bold text-5xl drop-shadow-lg tracking-wider">
              ${{ gameStore.pot }}
            </div>
            <div class="mt-2 text-slate-400 text-base font-mono opacity-80">
              Round {{ gameStore.roundNumber }}
            </div>
            <div
              v-if="isAutoResolvingShowdown"
              class="mt-4 rounded-full border border-gold/40 bg-black/50 px-4 py-1 text-sm font-bold uppercase tracking-wider text-gold"
            >
              Finalising showdown results...
            </div>
          </div>
        </div>

        <!-- Player (Bottom) -->
        <div
          class="absolute bottom-10 flex flex-col items-center px-12 py-8 transition-all duration-300 p-4 rounded-xl border"
          :class="{
            'opacity-50 grayscale': me.folded,
            'bg-gradient-to-t from-black/0 via-gold/5 to-black/0': isMyTurn && !gameStore.winnerMsg,
            'border-white/20 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]':
              isMyTurn && !gameStore.winnerMsg,
            'border-transparent': !(isMyTurn && !gameStore.winnerMsg),
          }"
        >
          <!-- Flying Chip Animation (Player - Moves to Center) -->
          <div
            v-if="gameStore.collectingAnte && !me.eliminated"
            class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 z-50 pointer-events-none"
            :style="getAnteStyle(me.id)"
          >
            <div
              class="w-8 h-8 rounded-full bg-yellow-500 border-2 border-yellow-300 shadow-xl flex items-center justify-center text-[10px] font-bold text-black animate-spin-slow"
            >
              $10
            </div>
          </div>
          <!-- Player Bet Badge (Moved Top) -->
          <div
            v-if="me.currentBet > 0 && ['ROUND_1', 'ROUND_2'].includes(gameStore.phase)"
            class="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 border border-gold px-3 py-0.5 rounded text-gold font-bold text-lg shadow-lg whitespace-nowrap flex items-baseline gap-1"
          >
            <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bet</span>
            <span>${{ me.currentBet }}</span>
          </div>
          <div class="flex gap-6 items-end relative">
            <!-- Stats -->
            <div class="text-right mb-4 relative">
              <!-- Action Toast (above name) -->
              <div
                v-if="me.lastAction"
                class="action-toast absolute -top-8 right-0 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xl border whitespace-nowrap z-30"
                :class="actionToastStyle(me.lastAction)"
              >
                {{ me.lastAction }}
              </div>
              <div
                class="text-2xl font-bold"
                :class="isMyTurn ? 'text-gold scale-110' : 'text-white'"
              >
                {{ me.name }}
                <Tooltip
                  text="Dealer"
                  v-if="gameStore.dealerIndex === me.id"
                  class="ml-2 inline-flex align-middle"
                >
                  <span
                    class="bg-white text-black font-bold rounded-full w-5 h-5 flex items-center justify-center border border-slate-400 text-[10px] shadow-sm cursor-help"
                    >D</span
                  >
                </Tooltip>
              </div>
              <div class="text-gold font-mono font-bold text-xl">${{ me.chips }}</div>
            </div>

            <!-- Hand -->
            <TransitionGroup name="deal-card" tag="div" class="flex -space-x-2 perspective-1000">
              <div
                v-for="(c, i) in sortedHand"
                :key="c.id"
                class="transform transition-transform duration-300 hover:-translate-y-4 hover:rotate-2 z-10"
                :style="{ 'z-index': i }"
              >
                <Card :card="c" :isFaceDown="false" class="shadow-2xl" />
              </div>
            </TransitionGroup>

            <!-- Operations (styled to match card size) -->
            <div class="flex gap-1.5 mb-2">
              <div
                v-for="(op, i) in me.ops"
                :key="i"
                class="w-10 h-14 rounded-lg flex items-center justify-center font-bold text-xl shadow-md border-2"
                :class="opStyle(op)"
              >
                {{ op }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            v-if="isMyTurn && ['ROUND_1', 'ROUND_2'].includes(gameStore.phase)"
            class="flex gap-4 mt-6 items-center"
          >
            <button
              @click="action('fold')"
              class="bg-red-900 hover:bg-red-700 px-6 py-3 rounded font-bold uppercase tracking-wider border border-red-500"
            >
              Fold
            </button>
            <button
              @click="action('call')"
              class="bg-slate-600 hover:bg-slate-500 px-6 py-3 rounded font-bold uppercase tracking-wider border border-slate-400"
            >
              {{ toCall === 0 ? 'Check' : `Call $${toCall}` }}
            </button>
            <div v-if="canRaise" class="flex items-center gap-2">
              <button
                @click="adjustRaise(-10)"
                class="bg-slate-700 hover:bg-slate-600 w-8 h-8 rounded text-lg font-bold border border-slate-500"
              >
                −
              </button>
              <button
                @click="action('raise')"
                class="bg-gold text-black hover:bg-yellow-400 px-6 py-3 rounded font-bold uppercase tracking-wider border border-yellow-600"
              >
                Raise ${{ raiseAmount }}
              </button>
              <button
                @click="adjustRaise(10)"
                class="bg-slate-700 hover:bg-slate-600 w-8 h-8 rounded text-lg font-bold border border-slate-500"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
    </template>

    <!-- Showdown / Round End Overlay -->
    <div
      v-if="gameStore.winnerMsg"
      class="fixed inset-0 bg-black/80 z-[60] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      :class="isMobileLayout ? 'pb-24' : ''"
    >
      <div class="flex flex-col items-center w-full max-w-6xl" :class="isMobileLayout ? 'gap-4' : 'gap-6'">
        <!-- Showdown Results Panel -->
        <div
          v-if="gameStore.showdownResults"
          class="bg-black/95 text-white rounded-xl border-2 border-gold shadow-2xl w-full"
          :class="isMobileLayout ? 'p-3' : 'p-4 sm:p-6'"
        >
          <h3
            class="text-gold font-bold tracking-wider text-center"
            :class="isMobileLayout ? 'text-base mb-2.5' : 'text-lg sm:text-xl mb-4'"
          >
            🏆 SHOWDOWN RESULTS
          </h3>
          <!-- 2x2 Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2" :class="isMobileLayout ? 'gap-2.5' : 'gap-4'">
            <div
              v-for="(r, i) in gameStore.showdownResults"
              :key="i"
              class="bg-slate-800/80 rounded-lg border"
              :class="[
                isMobileLayout ? 'px-2.5 py-2' : 'px-4 py-3',
                r.isLowWinner || r.isHighWinner ? 'border-gold' : 'border-slate-700',
              ]"
            >
              <!-- Name + badges row -->
              <div class="flex items-center justify-between mb-1.5">
                <div
                  class="font-bold"
                  :class="[
                    isMobileLayout ? 'text-xs' : 'text-sm',
                    r.isLowWinner || r.isHighWinner ? 'text-gold' : 'text-slate-300',
                  ]"
                >
                  {{ r.name }}
                  <span
                    v-if="r.isLowWinner"
                    class="ml-1 bg-blue-600 px-1.5 py-0.5 rounded text-white"
                    :class="isMobileLayout ? 'text-[9px]' : 'text-[10px]'"
                    >LOW 🏆</span
                  >
                  <span
                    v-if="r.isHighWinner"
                    class="ml-1 bg-red-600 px-1.5 py-0.5 rounded text-white"
                    :class="isMobileLayout ? 'text-[9px]' : 'text-[10px]'"
                    >HIGH 🏆</span
                  >
                </div>
                <span class="text-slate-400 uppercase tracking-wide" :class="isMobileLayout ? 'text-[9px]' : 'text-[10px]'">{{
                  r.declaration
                }}</span>
              </div>

              <!-- SWING: two equation blocks -->
              <template v-if="r.declaration === 'SWING'">
                <!-- LOW equation -->
                <div class="mb-1.5">
                  <div class="text-blue-400 font-bold uppercase mb-1" :class="isMobileLayout ? 'text-[9px]' : 'text-[10px]'">
                    Low → Target 1
                  </div>
                  <div
                    :class="
                      isMobileLayout
                        ? 'flex items-center gap-1 overflow-x-auto whitespace-nowrap pb-1 mb-1'
                        : 'flex items-center gap-1.5 flex-wrap mb-1'
                    "
                  >
                    <template
                      v-for="(item, j) in interleaveEquation(r.hand, r.ops, r.lowEqStr)"
                      :key="'l' + j"
                    >
                      <div
                        v-if="item.kind === 'card'"
                        class="rounded border-2 bg-slate-100 flex flex-col items-center justify-center font-bold shadow-sm shrink-0"
                        :class="[
                          isMobileLayout ? 'w-7 h-10 text-[9px]' : 'w-8 h-12 text-[10px]',
                          {
                            'border-yellow-500': item.suit === 'gold',
                            'border-gray-400': item.suit === 'silver',
                            'border-orange-600': item.suit === 'bronze',
                            'border-slate-400': item.suit === 'black',
                            'border-purple-400': item.type === 'sqrt',
                          },
                        ]"
                      >
                        <span
                          :class="{
                            'text-yellow-600': item.suit === 'gold',
                            'text-gray-500': item.suit === 'silver',
                            'text-orange-700': item.suit === 'bronze',
                            'text-slate-800': item.suit === 'black',
                            'text-purple-700': item.type === 'sqrt',
                          }"
                          >{{ item.value }}</span
                        >
                      </div>
                      <div
                        v-else
                        class="rounded flex items-center justify-center font-bold shadow-sm shrink-0"
                        :class="[isMobileLayout ? 'w-5 h-10 text-[10px]' : 'w-6 h-12 text-xs', opColorMini(item.value)]"
                      >
                        {{ item.value }}
                      </div>
                    </template>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <span class="font-mono font-bold text-blue-300" :class="isMobileLayout ? 'text-xs' : 'text-sm'"
                      >= {{ r.lowResult != null ? r.lowResult.toFixed(2) : '?' }}</span
                    >
                    <span
                      v-if="r.lowDiff != null"
                      class="font-mono"
                      :class="[
                        isMobileLayout ? 'text-[9px]' : 'text-[10px]',
                        r.lowDiff === 0
                          ? 'text-green-400'
                          : r.lowDiff < 1
                            ? 'text-yellow-400'
                            : 'text-slate-500',
                      ]"
                      >(Δ1: {{ r.lowDiff.toFixed(2) }})</span
                    >
                  </div>
                </div>
                <!-- HIGH equation -->
                <div>
                  <div class="text-red-400 font-bold uppercase mb-1" :class="isMobileLayout ? 'text-[9px]' : 'text-[10px]'">
                    High → Target 20
                  </div>
                  <div
                    :class="
                      isMobileLayout
                        ? 'flex items-center gap-1 overflow-x-auto whitespace-nowrap pb-1 mb-1'
                        : 'flex items-center gap-1.5 flex-wrap mb-1'
                    "
                  >
                    <template
                      v-for="(item, j) in interleaveEquation(r.hand, r.ops, r.highEqStr)"
                      :key="'h' + j"
                    >
                      <div
                        v-if="item.kind === 'card'"
                        class="rounded border-2 bg-slate-100 flex flex-col items-center justify-center font-bold shadow-sm shrink-0"
                        :class="[
                          isMobileLayout ? 'w-7 h-10 text-[9px]' : 'w-8 h-12 text-[10px]',
                          {
                            'border-yellow-500': item.suit === 'gold',
                            'border-gray-400': item.suit === 'silver',
                            'border-orange-600': item.suit === 'bronze',
                            'border-slate-400': item.suit === 'black',
                            'border-purple-400': item.type === 'sqrt',
                          },
                        ]"
                      >
                        <span
                          :class="{
                            'text-yellow-600': item.suit === 'gold',
                            'text-gray-500': item.suit === 'silver',
                            'text-orange-700': item.suit === 'bronze',
                            'text-slate-800': item.suit === 'black',
                            'text-purple-700': item.type === 'sqrt',
                          }"
                          >{{ item.value }}</span
                        >
                      </div>
                      <div
                        v-else
                        class="rounded flex items-center justify-center font-bold shadow-sm shrink-0"
                        :class="[isMobileLayout ? 'w-5 h-10 text-[10px]' : 'w-6 h-12 text-xs', opColorMini(item.value)]"
                      >
                        {{ item.value }}
                      </div>
                    </template>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <span class="font-mono font-bold text-red-300" :class="isMobileLayout ? 'text-xs' : 'text-sm'"
                      >= {{ r.highResult != null ? r.highResult.toFixed(2) : '?' }}</span
                    >
                    <span
                      v-if="r.highDiff != null"
                      class="font-mono"
                      :class="[
                        isMobileLayout ? 'text-[9px]' : 'text-[10px]',
                        r.highDiff === 0
                          ? 'text-green-400'
                          : r.highDiff < 1
                            ? 'text-yellow-400'
                            : 'text-slate-500',
                      ]"
                      >(Δ20: {{ r.highDiff.toFixed(2) }})</span
                    >
                  </div>
                </div>
              </template>

              <!-- Normal (non-swing) equation -->
              <template v-else>
                <div
                  :class="
                    isMobileLayout
                      ? 'flex items-center gap-1 overflow-x-auto whitespace-nowrap pb-1 mb-2'
                      : 'flex items-center gap-1.5 flex-wrap mb-3'
                  "
                >
                  <template
                    v-for="(item, j) in interleaveEquation(r.hand, r.ops, r.equation)"
                    :key="j"
                  >
                    <div
                      v-if="item.kind === 'card'"
                      class="rounded-lg border-2 bg-slate-100 flex flex-col items-center justify-center font-bold shadow-sm shrink-0"
                      :class="[
                        isMobileLayout ? 'w-8 h-11 text-[10px]' : 'w-10 h-14 text-xs',
                        {
                          'border-yellow-500': item.suit === 'gold',
                          'border-gray-400': item.suit === 'silver',
                          'border-orange-600': item.suit === 'bronze',
                          'border-slate-400': item.suit === 'black',
                          'border-purple-400': item.type === 'sqrt',
                        },
                      ]"
                    >
                      <span
                        :class="{
                          'text-yellow-600': item.suit === 'gold',
                          'text-gray-500': item.suit === 'silver',
                          'text-orange-700': item.suit === 'bronze',
                          'text-slate-800': item.suit === 'black',
                          'text-purple-700': item.type === 'sqrt',
                        }"
                        >{{ item.value }}</span
                      >
                      <span
                        v-if="item.suit"
                        class="uppercase font-semibold opacity-70 hidden sm:block text-[7px]"
                        :class="{
                          'text-yellow-600': item.suit === 'gold',
                          'text-gray-500': item.suit === 'silver',
                          'text-orange-700': item.suit === 'bronze',
                          'text-slate-600': item.suit === 'black',
                          'text-purple-700': item.type === 'sqrt',
                        }"
                        >{{ item.suit }}</span
                      >
                    </div>
                    <div
                      v-else
                      class="rounded-lg flex items-center justify-center font-bold shadow-sm shrink-0"
                      :class="[isMobileLayout ? 'w-6 h-11 text-xs' : 'w-8 h-14 text-sm', opColorMini(item.value)]"
                    >
                      {{ item.value }}
                    </div>
                  </template>
                </div>
                <div class="flex items-baseline gap-2">
                  <span
                    class="font-mono font-bold"
                    :class="[
                      isMobileLayout ? 'text-base' : 'text-lg',
                      r.isLowWinner || r.isHighWinner ? 'text-gold' : 'text-slate-200',
                    ]"
                  >
                    = {{ typeof r.result === 'number' ? r.result.toFixed(2) : r.result }}
                  </span>
                  <span
                    v-if="r.diff != null"
                    class="font-mono"
                    :class="[
                      isMobileLayout ? 'text-xs' : 'text-sm',
                      r.diff === 0
                        ? 'text-green-400'
                        : r.diff < 1
                          ? 'text-yellow-400'
                          : 'text-slate-500',
                    ]"
                  >
                    ({{ r.declaration === 'LOW' ? 'Δ1' : 'Δ20' }}: {{ r.diff.toFixed(2) }})
                  </span>
                </div>
              </template>
            </div>
          </div>

          <!-- Tiebreaker explanation -->
          <div
            v-if="gameStore.lowTiebreakExplanation || gameStore.highTiebreakExplanation"
            class="mt-2.5 p-2.5 bg-amber-900/30 border border-amber-700/50 rounded-lg"
          >
            <div class="text-amber-300 font-semibold mb-1" :class="isMobileLayout ? 'text-sm' : 'text-base'">⚖️ Tie Detected</div>
            <div
              v-if="gameStore.lowTiebreakExplanation"
              class="text-amber-200/80 font-mono"
              :class="isMobileLayout ? 'text-xs' : 'text-sm'"
            >
              LOW: {{ lowTiebreakDisplay }}
            </div>
            <div
              v-if="gameStore.highTiebreakExplanation"
              class="text-amber-200/80 font-mono"
              :class="isMobileLayout ? 'text-xs' : 'text-sm'"
            >
              HIGH: {{ highTiebreakDisplay }}
            </div>
          </div>
          <!-- Winner message -->
          <div class="mt-2.5 text-center font-semibold text-slate-300" :class="isMobileLayout ? 'text-base' : 'text-large'">
            {{ gameStore.winnerMsg }}
          </div>
        </div>

        <!-- Next Round / Game Over Controls (Always visible in overlay if ready) -->
        <!-- Round Over (Fold Win) Card -->
        <div
          v-if="gameStore.phase === 'END' && !gameStore.showdownResults"
          class="bg-black/90 text-white p-5 sm:p-8 rounded-xl border-2 border-gold shadow-2xl max-w-md text-center flex flex-col items-center gap-4"
        >
          <h3 class="text-gold text-2xl font-bold tracking-wider uppercase">Round Over</h3>
          <p class="text-lg text-slate-200 font-medium">{{ gameStore.winnerMsg }}</p>
          <button
            @click="gameStore.completeRoundAndStartNext()"
            class="bg-gold text-black font-bold px-8 py-3 rounded-full hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5)] text-lg transition-transform hover:scale-105 mt-2"
          >
            Start Next Round ▶
          </button>
        </div>

        <!-- Game Over Card with Leaderboard -->
        <div
          v-if="gameStore.phase === 'GAME_OVER'"
          class="bg-black/95 text-white p-5 sm:p-8 rounded-xl border-2 border-gold shadow-2xl w-full max-w-lg flex flex-col items-center gap-6"
        >
          <h3 class="text-gold text-3xl sm:text-4xl font-black tracking-widest uppercase drop-shadow-md text-center">
            🏆 Game Over 🏆
          </h3>

          <!-- Winner Spotlight -->
          <div class="flex flex-col items-center">
            <div
              class="w-24 h-24 rounded-full border-4 border-gold shadow-[0_0_20px_rgba(255,215,0,0.6)] overflow-hidden mb-3"
            >
              <img
                :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${
                  [...gameStore.players].sort((a, b) => b.chips - a.chips)[0].name
                }`"
                alt="Winner"
                class="w-full h-full bg-slate-800"
              />
            </div>
            <div class="text-2xl font-bold text-white">
              {{ [...gameStore.players].sort((a, b) => b.chips - a.chips)[0].name }}
            </div>
            <div class="text-gold font-mono text-xl font-bold">WINS THE GAME!</div>
          </div>

          <!-- Leaderboard -->
          <div class="w-full bg-slate-900/80 rounded-lg border border-slate-700 overflow-hidden">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                  <th class="px-4 py-2 text-center">#</th>
                  <th class="px-4 py-2">Player</th>
                  <th class="px-4 py-2 text-right">Chips</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr
                  v-for="(p, i) in [...gameStore.players].sort((a, b) => b.chips - a.chips)"
                  :key="p.id"
                  class="hover:bg-white/5 transition-colors"
                  :class="{ 'bg-gold/10': i === 0 }"
                >
                  <td class="px-4 py-3 text-center font-mono text-slate-500">
                    <span v-if="i === 0" class="text-lg leading-none">🥇</span>
                    <span v-else-if="i === 1" class="text-lg leading-none">🥈</span>
                    <span v-else-if="i === 2" class="text-lg leading-none">🥉</span>
                    <span v-else>{{ i + 1 }}</span>
                  </td>
                  <td class="px-4 py-3 font-bold flex items-center gap-2">
                    <img
                      :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`"
                      class="w-6 h-6 rounded-full bg-slate-700"
                    />
                    <span :class="{ 'text-gold': i === 0 }">{{ p.name }}</span>
                    <span
                      v-if="p.isHuman"
                      class="text-[10px] bg-slate-700 px-1.5 rounded text-slate-300"
                      >YOU</span
                    >
                  </td>
                  <td class="px-4 py-3 text-right font-mono font-bold text-gold">${{ p.chips }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button
            @click="gameStore.resetToLobby()"
            class="bg-gold text-black font-bold px-10 py-3 rounded-full hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5)] text-lg sm:text-xl transition-transform hover:scale-105 mt-2"
          >
            Back to Lobby ⟳
          </button>
        </div>

        <!-- Next Round Button (For Showdown results view - at bottom) -->
        <div
          v-if="gameStore.phase === 'END' && gameStore.showdownResults"
          :class="isMobileLayout ? 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[65] w-[calc(100%-1.5rem)] max-w-md' : 'mt-4'"
        >
          <button
            @click="gameStore.completeRoundAndStartNext()"
            class="bg-gold text-black font-bold rounded-full hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5)] transition-transform hover:scale-105"
            :class="isMobileLayout ? 'w-full px-6 py-3.5 text-lg' : 'px-8 py-3 text-xl'"
          >
            Start Next Round ▶
          </button>
        </div>
      </div>
    </div>

    <!-- Equation Builder Overlay -->
    <!-- Equation Builder Overlay -->
    <template v-if="gameStore.phase === 'SHOWDOWN' && !me.folded && !me.declaration">
      <!-- Full Builder UI -->
      <div
        v-if="!isBuilderMinimized"
        class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <button
          v-if="isMobileLayout"
          @click="isBuilderMinimized = true"
          class="fixed top-3 right-3 z-[75] bg-slate-900/95 text-slate-100 border border-gold/70 rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(255,215,0,0.2)]"
        >
          Minimise
        </button>

        <div class="relative w-full max-w-4xl my-auto">
          <!-- Minimize Button -->
          <button
            v-if="!isMobileLayout"
            @click="isBuilderMinimized = true"
            class="text-slate-200 hover:text-white flex items-center gap-2 bg-slate-900/90 rounded-full border border-slate-600 hover:border-gold transition-all shadow-lg"
            :class="'absolute -top-12 right-0 px-5 py-2'"
          >
            <span class="text-sm font-bold">Minimise</span>
          </button>

          <EquationBoard :mobile="isMobileLayout" />
        </div>
      </div>

      <!-- Minimized Floating Button -->
      <div
        v-else
        class="fixed z-[60]"
        :class="isMobileLayout ? 'bottom-4 right-4' : 'bottom-8 right-8'"
      >
        <button
          @click="isBuilderMinimized = false"
          class="bg-gold text-black font-bold rounded-full shadow-[0_0_20px_rgba(255,215,0,0.6)] flex items-center gap-2 animate-bounce-slight hover:scale-105 transition-transform border-4 border-black"
          :class="isMobileLayout ? 'px-4 py-3 text-base' : 'px-6 py-4 text-xl'"
        >
          <span>📝 Open Equation Builder</span>
        </button>
      </div>
    </template>

    <!-- Discard Operator Modal -->
    <div
      v-if="gameStore.pendingDiscard"
      class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-3 sm:p-4"
    >
      <div
        class="w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-slate-800 p-5 sm:p-8 rounded-xl border-2 border-gold shadow-2xl flex flex-col items-center gap-6"
      >
        <h3 class="text-gold text-xl font-bold tracking-wider">× Card Drawn!</h3>

        <div class="w-full text-center">
          <p class="text-slate-300 text-center">
            You drew a <span class="text-gold font-bold">Multiply (×)</span> card.
          </p>
        </div>

        <!-- Show Current Hand + Ops for Context -->
        <div class="w-full flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center mb-2">
          <!-- Cards -->
          <div class="flex -space-x-2 perspective-1000 overflow-x-auto max-w-full py-1">
            <div
              v-for="(c, i) in sortedHand"
              :key="c.id"
              class="transform hover:-translate-y-2 transition-transform"
              :style="{ 'z-index': i }"
            >
              <Card :card="c" :isFaceDown="false" :compact="isMobileLayout" class="shadow-xl" />
            </div>
          </div>
          <!-- Operators -->
          <div class="flex gap-2">
            <div
              v-for="(op, i) in me.ops"
              :key="i"
              class="rounded flex items-center justify-center text-xl font-bold border shadow-md"
              :class="[isMobileLayout ? 'w-10 h-12' : 'w-12 h-16', opStyle(op)]"
            >
              {{ op }}
            </div>
          </div>
        </div>

        <div class="w-full text-center">
          <p class="text-slate-300 text-center mb-4">
            Choose which operator to
            <span class="font-bold underline text-white">discard</span> from your hand:
          </p>

          <div class="flex gap-3 sm:gap-6 justify-center">
            <button
              @click="gameStore.resolveDiscard('+')"
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-3xl font-bold border-2 border-emerald-400 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
            >
              +
            </button>
            <button
              @click="gameStore.resolveDiscard('-')"
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-3xl font-bold border-2 border-rose-400 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
            >
              −
            </button>
          </div>
        </div>
        <p class="text-xs text-slate-500">The discarded operator will be replaced by ×</p>
      </div>
    </div>

    <!-- HUD Container (Message + Action Log) -->
    <div
      v-if="gameStore.phase !== 'LOBBY' && !isMobileLayout"
      class="fixed bottom-4 left-4 z-50 flex flex-col-reverse items-start gap-1.5 pointer-events-none"
    >
      <ActionLog />

      <!-- Floating Phase/Msg Toast -->
      <div class="flex flex-col items-start gap-1">
        <div class="text-white/50 font-bold uppercase tracking-widest text-[10px] drop-shadow-md">
          {{ phaseLabel }}
        </div>
        <!-- Community Msg Removed (Redundant) -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useGameStore, AI_NAMES } from './stores/game'
import Card from './components/Card.vue'
import EquationBoard from './components/EquationBoard.vue'
import ActionLog from './components/ActionLog.vue'
import Tooltip from './components/Tooltip.vue'
import { getOperatorStyle, getOperatorMiniStyle } from './utils/operatorStyle'

const appVersion = import.meta.env.VITE_APP_VERSION || '0.0.0'
const displayVersion = String(Number.parseInt(appVersion, 10) || 0)
const gameStore = useGameStore()
const selectedAiCount = ref(3)
const selectedRounds = ref(10)
const showRules = ref(false)
const showSettingsDialog = ref(false)
const rulesSection = ref(null)
const isBuilderMinimized = ref(false)
const MOBILE_BREAKPOINT = 768
const isMobileLayout = ref(false)

const updateLayoutMode = () => {
  if (typeof window === 'undefined') return
  isMobileLayout.value = window.innerWidth < MOBILE_BREAKPOINT
}

const toggleRules = async () => {
  showRules.value = !showRules.value
  if (showRules.value) {
    await nextTick()
    rulesSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const exitGame = () => {
  if (typeof window !== 'undefined') {
    const confirmed = window.confirm('Exit current game and return to lobby?')
    if (!confirmed) return
  }
  gameStore.resetToLobby()
}

const me = computed(() => gameStore.players[0] || { hand: [], ops: [], chips: 0 })
const opponents = computed(() => gameStore.players.slice(1))
const phaseLabel = computed(() => {
  const labels = {
    LOBBY: 'Lobby',
    ANTE: 'Ante',
    ROUND_1: 'Betting 1',
    DEAL_4: 'Deal',
    ROUND_2: 'Betting 2',
    SHOWDOWN: 'Showdown',
    END: 'End',
    GAME_OVER: 'Game Over',
  }
  return labels[gameStore.phase] || gameStore.phase
})
const isMyTurn = computed(() => gameStore.currentTurnIndex === 0)
const isAutoResolvingShowdown = computed(() => {
  if (gameStore.phase !== 'SHOWDOWN' || gameStore.winnerMsg) return false
  const human = gameStore.players.find((p) => p.isHuman)
  if (!human) return true
  return human.folded || human.eliminated || !!human.declaration
})

const maxBetOnTable = computed(() => Math.max(...gameStore.players.map((p) => p.currentBet), 0))
const toCall = computed(() => maxBetOnTable.value - (me.value.currentBet || 0))
const raiseAmount = ref(20)
const maxRaise = computed(() => {
  const remaining = (gameStore.roundBettingCap || Infinity) - (me.value.totalWagered || 0)
  return Math.min(remaining - toCall.value, (me.value.chips || 0) - toCall.value)
})

const canRaise = computed(() => maxRaise.value >= 10)

const sortedHand = computed(() => me.value.hand || [])
const TIE_EPSILON = 1e-6

const sideDiff = (row, side) => {
  if (side === 'LOW') {
    if (row.declaration === 'LOW') return row.diff
    if (row.declaration === 'SWING') return row.lowDiff
    return null
  }
  if (row.declaration === 'HIGH') return row.diff
  if (row.declaration === 'SWING') return row.highDiff
  return null
}

const tiedNamesForSide = (rows, side) => {
  const candidates = rows
    .map((row) => ({ name: row.name, diff: sideDiff(row, side) }))
    .filter((row) => typeof row.diff === 'number')
  if (candidates.length < 2) return []

  const bestDiff = Math.min(...candidates.map((row) => row.diff))
  const tied = candidates
    .filter((row) => Math.abs(row.diff - bestDiff) < TIE_EPSILON)
    .map((row) => row.name)

  return tied.length > 1 ? tied : []
}

const formatNameList = (names) => {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

const showdownTieNames = computed(() => {
  const rows = gameStore.showdownResults || []
  return {
    LOW: tiedNamesForSide(rows, 'LOW'),
    HIGH: tiedNamesForSide(rows, 'HIGH'),
  }
})

const lowTiePlayersText = computed(() => formatNameList(showdownTieNames.value.LOW))
const highTiePlayersText = computed(() => formatNameList(showdownTieNames.value.HIGH))

const lowTiebreakDisplay = computed(() => {
  if (!gameStore.lowTiebreakExplanation) return ''
  if (lowTiePlayersText.value) {
    return `Tie between ${lowTiePlayersText.value}. ${gameStore.lowTiebreakExplanation}`
  }
  return gameStore.lowTiebreakExplanation
})

const highTiebreakDisplay = computed(() => {
  if (!gameStore.highTiebreakExplanation) return ''
  if (highTiePlayersText.value) {
    return `Tie between ${highTiePlayersText.value}. ${gameStore.highTiebreakExplanation}`
  }
  return gameStore.highTiebreakExplanation
})

// function confirmExit removed

const getAnteStyle = (id) => {
  // Animation paths must be shorter to land directly in pot (center)
  // Player panel top edge ~ 75vh? Center ~ 50vh. Delta ~ 25vh.
  // Opponent panel center ~ 15vh (top-6 + padding/height). Delta ~ 35vh.

  const isMe = id === me.value.id
  if (isMe) {
    // Player chip starts at TOP of player panel (closer to center)
    return {
      '--tx': '0px',
      '--ty': '-27.5vh',
      animation: 'ante-travel 1s cubic-bezier(0.5, 0, 0.5, 1) forwards',
    }
  }

  const oppIndex = opponents.value.findIndex((p) => p.id === id)
  const count = opponents.value.length

  let tx = '0px'
  let ty = '28vh' // Opponents move down to center

  if (count === 1) {
    tx = '0px'
  } else if (count === 3) {
    if (oppIndex === 0) tx = '15vw' // Left -> Right (reduced from 20)
    if (oppIndex === 1) tx = '0px'
    if (oppIndex === 2) tx = '-15vw' // Right -> Left
  } else if (count === 2) {
    if (oppIndex === 0) tx = '8vw'
    if (oppIndex === 1) tx = '-8vw'
  }

  return {
    '--tx': tx,
    '--ty': ty,
    animation: 'ante-travel 1s cubic-bezier(0.5, 0, 0.5, 1) forwards',
  }
}

const adjustRaise = (delta) => {
  raiseAmount.value = Math.max(10, Math.min(raiseAmount.value + delta, maxRaise.value))
}

// Reset raise amount at start of new round
watch(
  () => gameStore.phase,
  (newPhase) => {
    if (newPhase === 'ANTE' || newPhase === 'LOBBY') {
      raiseAmount.value = 20
    }
  },
)

watch(isMobileLayout, (mobile) => {
  if (mobile) {
    isBuilderMinimized.value = false
  }
})

onMounted(() => {
  gameStore.loadSettings()
  updateLayoutMode()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateLayoutMode)
  }

  // Preload all possible avatars for a smooth experience
  const avatarsToPreload = ['You', ...AI_NAMES]
  avatarsToPreload.forEach((name) => {
    const img = new Image()
    img.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`
  })
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateLayoutMode)
  }
})

// Parse equationStr to display cards in correct equation order, matching to hand for suit info
const interleaveEquation = (hand, ops, equationStr) => {
  const result = []
  if (!equationStr || !hand) return result
  const tokens = equationStr.trim().split(/\s+/)
  const available = [...hand] // copy to track consumed cards
  for (const token of tokens) {
    if (['+', '-', '×', '÷'].includes(token)) {
      result.push({ kind: 'op', value: token })
    } else if (token.startsWith('√')) {
      // √ card followed by the number it applies to
      const sqrtIdx = available.findIndex((c) => c.type === 'sqrt')
      if (sqrtIdx >= 0) {
        result.push({ kind: 'card', value: '√', type: 'sqrt' })
        available.splice(sqrtIdx, 1)
      }
      const numVal = parseFloat(token.slice(1))
      if (!isNaN(numVal)) {
        const numIdx = available.findIndex((c) => c.type === 'number' && c.value === numVal)
        if (numIdx >= 0) {
          result.push({
            kind: 'card',
            value: available[numIdx].value,
            suit: available[numIdx].suit,
            type: 'number',
          })
          available.splice(numIdx, 1)
        }
      }
    } else {
      const numVal = parseFloat(token)
      if (!isNaN(numVal)) {
        const numIdx = available.findIndex((c) => c.type === 'number' && c.value === numVal)
        if (numIdx >= 0) {
          result.push({
            kind: 'card',
            value: available[numIdx].value,
            suit: available[numIdx].suit,
            type: 'number',
          })
          available.splice(numIdx, 1)
        }
      }
    }
  }
  return result
}

const opColorMini = getOperatorMiniStyle
const opStyle = getOperatorStyle

const actionToastStyle = (action) => {
  if (!action) return ''
  if (action === 'Fold') return 'bg-red-900/90 border-red-500 text-red-200'
  if (action === 'Check') return 'bg-slate-700/90 border-slate-500 text-slate-200'
  if (action.startsWith('Call')) return 'bg-sky-900/90 border-sky-500 text-sky-200'
  if (action.startsWith('Raise')) return 'bg-amber-900/90 border-amber-500 text-amber-200'
  return 'bg-slate-700/90 border-slate-500 text-slate-200'
}

const action = (type) => {
  if (type === 'fold') {
    gameStore.actedSinceLastAction.push(0)
    gameStore.humanFold()
  } else if (type === 'call') {
    if (toCall.value === 0) {
      me.value.lastAction = 'Check'
      gameStore.logPlayerAction(me.value, 'check')
    } else {
      me.value.lastAction = `Call $${toCall.value}`
      gameStore.placeBet(me.value, toCall.value)
      gameStore.logPlayerAction(me.value, 'call', toCall.value)
    }
    gameStore.actedSinceLastAction.push(0)
    gameStore.nextTurn()
  } else if (type === 'raise') {
    me.value.lastAction = `Raise $${raiseAmount.value}`
    gameStore.placeBet(me.value, toCall.value + raiseAmount.value)
    gameStore.logPlayerAction(me.value, 'raise', raiseAmount.value)
    gameStore.actedSinceLastAction = [0] // Reset on raise
    gameStore.lastAggressorIndex = 0
    gameStore.nextTurn()
  }
}

// Auto-clear action toasts after 1.5 seconds
let actionToastTimers = {}
watch(
  () => gameStore.players.map((p) => p.lastAction),
  (newActions, oldActions) => {
    newActions.forEach((action, i) => {
      const oldAction = oldActions ? oldActions[i] : null
      if (action && action !== oldAction) {
        // Only start/restart timer when this player's action actually changed
        if (actionToastTimers[i]) clearTimeout(actionToastTimers[i])
        actionToastTimers[i] = setTimeout(() => {
          if (gameStore.players[i]) {
            gameStore.players[i].lastAction = null
          }
          delete actionToastTimers[i]
        }, 1500)
      } else if (!action && actionToastTimers[i]) {
        // Action was cleared externally — cancel any pending timer
        clearTimeout(actionToastTimers[i])
        delete actionToastTimers[i]
      }
    })
  },
)

onBeforeUnmount(() => {
  Object.values(actionToastTimers).forEach((timer) => clearTimeout(timer))
  actionToastTimers = {}
})
</script>

<style>
body {
  margin: 0;
  overflow: hidden;
}

/* Card deal-in animation */
.deal-card-enter-active {
  animation: card-deal-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes card-deal-in {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.7) rotate(-5deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
  }
}

@keyframes toast-pop {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.9);
  }
  20% {
    opacity: 1;
    transform: translateY(0) scale(1.05);
  }
  40% {
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.action-toast {
  animation: toast-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  pointer-events: none;
}

@keyframes border-glow {
  0%,
  100% {
    border-color: #ffd700;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
  }
  50% {
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 0 2px rgba(255, 215, 0, 0.1);
  }
}

.border-pulse {
  animation: border-glow 2s ease-in-out infinite;
}

@keyframes ante-travel {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(0.5);
  }
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
