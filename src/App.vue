<template>
  <div
    class="min-h-screen bg-felt-green flex flex-col items-center py-8 px-4 font-sans text-slate-100"
  >
    <!-- Lobby Screen -->
    <div v-if="gameStore.phase === 'LOBBY'" class="flex flex-col items-center gap-6 mt-6 px-4">
      <!-- Top row: two-column layout -->
      <div class="flex gap-8 items-stretch max-w-5xl w-full">
        <!-- Left: App Info / Branding -->
        <div
          class="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl p-8 flex flex-col justify-center"
        >
          <h2 class="text-5xl font-bold text-gold tracking-widest mb-4">EQUATION<br />HI-LO ♠</h2>
          <p class="text-slate-300 text-base italic leading-relaxed mb-4">
            Inspired by "The Devil's Plan" (Netflix), created by Jung Jong-yeon
          </p>
          <p class="text-slate-300 text-base leading-relaxed mb-4">
            A poker-style game where <strong class="text-white">math is your weapon</strong>.
            Combine your cards into an equation to hit the target number.
          </p>
          <div class="flex gap-6 text-sm text-slate-400">
            <div class="flex flex-col items-center gap-1">
              <span class="text-2xl">🎯</span>
              <span class="text-blue-400 font-bold">LOW</span>
              <span>Target 1</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-2xl">🎯</span>
              <span class="text-red-400 font-bold">HIGH</span>
              <span>Target 20</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-2xl">⚡</span>
              <span class="text-amber-400 font-bold">SWING</span>
              <span>Win Both!</span>
            </div>
          </div>
        </div>

        <!-- Right: Game Controls -->
        <div
          class="bg-felt-dark p-8 rounded-xl shadow-2xl flex flex-col items-center gap-5 w-80 shrink-0"
        >
          <h3 class="text-lg font-bold text-gold tracking-wider">New Game</h3>

          <label class="text-sm font-bold text-slate-300 uppercase tracking-wide"
            >AI Opponents</label
          >
          <div class="flex gap-3">
            <button
              v-for="n in [1, 2, 3]"
              :key="n"
              @click="selectedAiCount = n"
              class="w-14 h-14 rounded-lg text-xl font-bold transition-all duration-200 border-2"
              :class="
                selectedAiCount === n
                  ? 'bg-gold text-black border-gold scale-110 shadow-lg'
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-gold hover:text-gold'
              "
            >
              {{ n }}
            </button>
          </div>
          <p class="text-xs text-slate-500">{{ selectedAiCount + 1 }} players total</p>

          <label class="text-sm font-bold text-slate-300 uppercase tracking-wide">Rounds</label>
          <div class="flex gap-3">
            <button
              v-for="r in [
                { val: 5, label: '5' },
                { val: 10, label: '10' },
                { val: 0, label: '∞' },
              ]"
              :key="r.val"
              @click="selectedRounds = r.val"
              class="w-14 h-14 rounded-lg text-xl font-bold transition-all duration-200 border-2"
              :class="
                selectedRounds === r.val
                  ? 'bg-gold text-black border-gold scale-110 shadow-lg'
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-gold hover:text-gold'
              "
            >
              {{ r.label }}
            </button>
          </div>
          <p class="text-xs text-slate-500">
            {{ selectedRounds === 0 ? 'Elimination mode' : `${selectedRounds} rounds` }}
          </p>

          <button
            @click="gameStore.initGame(selectedAiCount, selectedRounds)"
            class="bg-gold text-black font-bold px-10 py-3 rounded-lg hover:bg-yellow-400 text-lg tracking-wider shadow-lg transition-transform hover:scale-105 mt-2 w-full"
          >
            ▶ Start Game
          </button>
        </div>
      </div>

      <!-- Bottom: How to Play (Progressive Disclosure) -->
      <div class="max-w-5xl w-full">
        <button
          @click="toggleRules"
          class="w-full text-center py-3 rounded-lg border border-slate-700 hover:border-gold bg-slate-900/40 hover:bg-slate-900/60 transition-all text-gold hover:text-yellow-300 text-sm font-bold uppercase tracking-wider"
        >
          {{ showRules ? '▲ Hide How to Play' : '▼ How to Play' }}
        </button>
        <div
          v-if="showRules"
          ref="rulesSection"
          class="bg-slate-900/80 border border-slate-700 border-t-0 rounded-b-xl p-6 text-sm text-slate-300 grid grid-cols-2 gap-x-8 gap-y-4"
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
          <div class="col-span-2 border-t border-slate-700 pt-3">
            <h4 class="text-gold font-bold text-sm mb-2">⭐ Important Rules</h4>
            <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-400">
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
      <div class="mt-12 mb-8 text-center text-sm text-slate-400 font-mono tracking-wide">
        <p class="mb-2">
          Created by
          <a
            href="https://linjin.me"
            target="_blank"
            class="text-lime-400 hover:text-gold transition-colors underline decoration-slate-600 underline-offset-4"
            >Jin</a
          >
          &copy; 2026
        </p>
        <p class="text-xs opacity-80 uppercase tracking-widest">
          Built using Agentic Engineering -
          <a
            href="https://www.anthropic.com/news/claude-opus-4-6"
            target="_blank"
            class="hover:text-gold transition-colors border-b border-dotted border-slate-600 hover:border-gold"
            >Claude 4.6 Opus</a
          >
          &amp;
          <a
            href="https://blog.google/products-and-platforms/products/gemini/gemini-3/"
            target="_blank"
            class="hover:text-gold transition-colors border-b border-dotted border-slate-600 hover:border-gold"
            >Gemini 3 Pro</a
          >
        </p>
      </div>
    </div>

    <!-- Main Table (Rounded Poker Table Shape) -->
    <template v-if="gameStore.phase !== 'LOBBY'">
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
            <span class="text-gold font-mono text-base">${{ p.chips }}</span>
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
              <div class="text-gold font-mono text-xl">${{ me.chips }}</div>
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

    <!-- Showdown / Round End Overlay -->
    <div
      v-if="gameStore.winnerMsg"
      class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="flex flex-col items-center gap-6 w-full max-w-6xl">
        <!-- Showdown Results Panel -->
        <div
          v-if="gameStore.showdownResults"
          class="bg-black/95 text-white p-6 rounded-xl border-2 border-gold shadow-2xl w-full"
        >
          <h3 class="text-gold text-xl font-bold mb-4 tracking-wider text-center">
            🏆 SHOWDOWN RESULTS
          </h3>
          <!-- 2x2 Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(r, i) in gameStore.showdownResults"
              :key="i"
              class="bg-slate-800/80 rounded-lg px-4 py-3 border"
              :class="r.isLowWinner || r.isHighWinner ? 'border-gold' : 'border-slate-700'"
            >
              <!-- Name + badges row -->
              <div class="flex items-center justify-between mb-2">
                <div
                  class="font-bold text-sm"
                  :class="r.isLowWinner || r.isHighWinner ? 'text-gold' : 'text-slate-300'"
                >
                  {{ r.name }}
                  <span
                    v-if="r.isLowWinner"
                    class="ml-1 text-[10px] bg-blue-600 px-1.5 py-0.5 rounded text-white"
                    >LOW 🏆</span
                  >
                  <span
                    v-if="r.isHighWinner"
                    class="ml-1 text-[10px] bg-red-600 px-1.5 py-0.5 rounded text-white"
                    >HIGH 🏆</span
                  >
                </div>
                <span class="text-[10px] text-slate-400 uppercase tracking-wide">{{
                  r.declaration
                }}</span>
              </div>

              <!-- SWING: two equation blocks -->
              <template v-if="r.declaration === 'SWING'">
                <!-- LOW equation -->
                <div class="mb-2">
                  <div class="text-[10px] text-blue-400 font-bold uppercase mb-1">
                    Low → Target 1
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap mb-1">
                    <template
                      v-for="(item, j) in interleaveEquation(r.hand, r.ops, r.lowEqStr)"
                      :key="'l' + j"
                    >
                      <div
                        v-if="item.kind === 'card'"
                        class="w-8 h-12 rounded border-2 bg-slate-100 flex flex-col items-center justify-center text-[10px] font-bold shadow-sm"
                        :class="{
                          'border-yellow-500': item.suit === 'gold',
                          'border-gray-400': item.suit === 'silver',
                          'border-orange-600': item.suit === 'bronze',
                          'border-slate-400': item.suit === 'black',
                          'border-purple-400': item.type === 'sqrt',
                        }"
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
                        class="w-6 h-12 rounded flex items-center justify-center text-xs font-bold shadow-sm"
                        :class="opColorMini(item.value)"
                      >
                        {{ item.value }}
                      </div>
                    </template>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <span class="font-mono font-bold text-sm text-blue-300"
                      >= {{ r.lowResult != null ? r.lowResult.toFixed(2) : '?' }}</span
                    >
                    <span
                      v-if="r.lowDiff != null"
                      class="text-[10px] font-mono"
                      :class="
                        r.lowDiff === 0
                          ? 'text-green-400'
                          : r.lowDiff < 1
                            ? 'text-yellow-400'
                            : 'text-slate-500'
                      "
                      >(Δ1: {{ r.lowDiff.toFixed(2) }})</span
                    >
                  </div>
                </div>
                <!-- HIGH equation -->
                <div>
                  <div class="text-[10px] text-red-400 font-bold uppercase mb-1">
                    High → Target 20
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap mb-1">
                    <template
                      v-for="(item, j) in interleaveEquation(r.hand, r.ops, r.highEqStr)"
                      :key="'h' + j"
                    >
                      <div
                        v-if="item.kind === 'card'"
                        class="w-8 h-12 rounded border-2 bg-slate-100 flex flex-col items-center justify-center text-[10px] font-bold shadow-sm"
                        :class="{
                          'border-yellow-500': item.suit === 'gold',
                          'border-gray-400': item.suit === 'silver',
                          'border-orange-600': item.suit === 'bronze',
                          'border-slate-400': item.suit === 'black',
                          'border-purple-400': item.type === 'sqrt',
                        }"
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
                        class="w-6 h-12 rounded flex items-center justify-center text-xs font-bold shadow-sm"
                        :class="opColorMini(item.value)"
                      >
                        {{ item.value }}
                      </div>
                    </template>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <span class="font-mono font-bold text-sm text-red-300"
                      >= {{ r.highResult != null ? r.highResult.toFixed(2) : '?' }}</span
                    >
                    <span
                      v-if="r.highDiff != null"
                      class="text-[10px] font-mono"
                      :class="
                        r.highDiff === 0
                          ? 'text-green-400'
                          : r.highDiff < 1
                            ? 'text-yellow-400'
                            : 'text-slate-500'
                      "
                      >(Δ20: {{ r.highDiff.toFixed(2) }})</span
                    >
                  </div>
                </div>
              </template>

              <!-- Normal (non-swing) equation -->
              <template v-else>
                <div class="flex items-center gap-1.5 flex-wrap mb-3">
                  <template
                    v-for="(item, j) in interleaveEquation(r.hand, r.ops, r.equation)"
                    :key="j"
                  >
                    <div
                      v-if="item.kind === 'card'"
                      class="w-10 h-14 rounded-lg border-2 bg-slate-100 flex flex-col items-center justify-center text-xs font-bold shadow-sm"
                      :class="{
                        'border-yellow-500': item.suit === 'gold',
                        'border-gray-400': item.suit === 'silver',
                        'border-orange-600': item.suit === 'bronze',
                        'border-slate-400': item.suit === 'black',
                        'border-purple-400': item.type === 'sqrt',
                      }"
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
                        class="text-[7px] uppercase font-semibold opacity-70"
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
                      class="w-8 h-14 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
                      :class="opColorMini(item.value)"
                    >
                      {{ item.value }}
                    </div>
                  </template>
                </div>
                <div class="flex items-baseline gap-2">
                  <span
                    class="font-mono font-bold text-lg"
                    :class="r.isLowWinner || r.isHighWinner ? 'text-gold' : 'text-slate-200'"
                  >
                    = {{ typeof r.result === 'number' ? r.result.toFixed(2) : r.result }}
                  </span>
                  <span
                    v-if="r.diff != null"
                    class="text-sm font-mono"
                    :class="
                      r.diff === 0
                        ? 'text-green-400'
                        : r.diff < 1
                          ? 'text-yellow-400'
                          : 'text-slate-500'
                    "
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
            class="mt-3 p-2.5 bg-amber-900/30 border border-amber-700/50 rounded-lg"
          >
            <div class="text-amber-300 text-base font-semibold mb-1">⚖️ Tie Detected</div>
            <div
              v-if="gameStore.lowTiebreakExplanation"
              class="text-amber-200/80 text-sm font-mono"
            >
              LOW: {{ gameStore.lowTiebreakExplanation }}
            </div>
            <div
              v-if="gameStore.highTiebreakExplanation"
              class="text-amber-200/80 text-sm font-mono"
            >
              HIGH: {{ gameStore.highTiebreakExplanation }}
            </div>
          </div>
          <!-- Winner message -->
          <div class="mt-3 text-center text-large font-semibold text-slate-300">
            {{ gameStore.winnerMsg }}
          </div>
        </div>

        <!-- Next Round / Game Over Controls (Always visible in overlay if ready) -->
        <!-- Round Over (Fold Win) Card -->
        <div
          v-if="gameStore.phase === 'END' && !gameStore.showdownResults"
          class="bg-black/90 text-white p-8 rounded-xl border-2 border-gold shadow-2xl max-w-md text-center flex flex-col items-center gap-4"
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
          class="bg-black/95 text-white p-8 rounded-xl border-2 border-gold shadow-2xl w-full max-w-lg flex flex-col items-center gap-6"
        >
          <h3 class="text-gold text-4xl font-black tracking-widest uppercase drop-shadow-md">
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
            <table class="w-full text-left text-sm">
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
                  <td class="px-4 py-3 text-right font-mono text-gold">${{ p.chips }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button
            @click="gameStore.resetToLobby()"
            class="bg-gold text-black font-bold px-10 py-3 rounded-full hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5)] text-xl transition-transform hover:scale-105 mt-2"
          >
            Back to Lobby ⟳
          </button>
        </div>

        <!-- Next Round Button (For Showdown results view - at bottom) -->
        <div v-if="gameStore.phase === 'END' && gameStore.showdownResults" class="mt-4">
          <button
            @click="gameStore.completeRoundAndStartNext()"
            class="bg-gold text-black font-bold px-8 py-3 rounded-full hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5)] text-xl transition-transform hover:scale-105"
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
        class="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4"
      >
        <div class="relative w-full max-w-4xl">
          <!-- Minimize Button -->
          <button
            @click="isBuilderMinimized = true"
            class="absolute -top-12 right-0 text-slate-400 hover:text-white flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-600 hover:border-white transition-all"
          >
            <span class="text-sm font-bold">Minimise</span>
          </button>

          <EquationBoard />
        </div>
      </div>

      <!-- Minimized Floating Button -->
      <div v-else class="fixed bottom-8 right-8 z-[60]">
        <button
          @click="isBuilderMinimized = false"
          class="bg-gold text-black font-bold px-6 py-4 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.6)] text-xl flex items-center gap-2 animate-bounce-slight hover:scale-105 transition-transform border-4 border-black"
        >
          <span>📝 Open Equation Builder</span>
        </button>
      </div>
    </template>

    <!-- Discard Operator Modal -->
    <div
      v-if="gameStore.pendingDiscard"
      class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center"
    >
      <div
        class="bg-slate-800 p-8 rounded-xl border-2 border-gold shadow-2xl flex flex-col items-center gap-6"
      >
        <h3 class="text-gold text-xl font-bold tracking-wider">× Card Drawn!</h3>

        <div class="w-full text-center">
          <p class="text-slate-300 text-center">
            You drew a <span class="text-gold font-bold">Multiply (×)</span> card.
          </p>
        </div>

        <!-- Show Current Hand + Ops for Context -->
        <div class="flex items-center gap-4 justify-center mb-2">
          <!-- Cards -->
          <div class="flex -space-x-2 perspective-1000">
            <div
              v-for="(c, i) in sortedHand"
              :key="c.id"
              class="transform hover:-translate-y-2 transition-transform"
              :style="{ 'z-index': i }"
            >
              <Card :card="c" :isFaceDown="false" class="shadow-xl" />
            </div>
          </div>
          <!-- Operators -->
          <div class="flex gap-2">
            <div
              v-for="(op, i) in me.ops"
              :key="i"
              class="w-12 h-16 rounded flex items-center justify-center text-xl font-bold border shadow-md"
              :class="opStyle(op)"
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

          <div class="flex gap-6 justify-center">
            <button
              @click="gameStore.resolveDiscard('+')"
              class="w-20 h-20 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-3xl font-bold border-2 border-emerald-400 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
            >
              +
            </button>
            <button
              @click="gameStore.resolveDiscard('-')"
              class="w-20 h-20 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-3xl font-bold border-2 border-rose-400 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
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
      v-if="gameStore.phase !== 'LOBBY'"
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
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useGameStore, AI_NAMES } from './stores/game'
import Card from './components/Card.vue'
import EquationBoard from './components/EquationBoard.vue'
import ActionLog from './components/ActionLog.vue'
import Tooltip from './components/Tooltip.vue'

const gameStore = useGameStore()
const selectedAiCount = ref(3)
const selectedRounds = ref(10)
const showRules = ref(false)
const rulesSection = ref(null)
const isBuilderMinimized = ref(false)

const toggleRules = async () => {
  showRules.value = !showRules.value
  if (showRules.value) {
    await nextTick()
    rulesSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
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

const maxBetOnTable = computed(() => Math.max(...gameStore.players.map((p) => p.currentBet), 0))
const toCall = computed(() => maxBetOnTable.value - (me.value.currentBet || 0))
const raiseAmount = ref(20)
const maxRaise = computed(() => {
  const remaining = (gameStore.roundBettingCap || Infinity) - (me.value.totalWagered || 0)
  return Math.min(remaining - toCall.value, (me.value.chips || 0) - toCall.value)
})

const canRaise = computed(() => maxRaise.value >= 10)

const sortedHand = computed(() => me.value.hand || [])

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
      '--ty': '-20vh',
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

onMounted(() => {
  // Preload all possible avatars for a smooth experience
  const avatarsToPreload = ['You', ...AI_NAMES]
  avatarsToPreload.forEach((name) => {
    const img = new Image()
    img.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`
  })
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

// Smaller op color styling for showdown grid
const opColorMini = (op) => {
  switch (op) {
    case '+':
      return 'bg-emerald-700 text-white'
    case '-':
      return 'bg-rose-700 text-white'
    case '÷':
      return 'bg-sky-700 text-white'
    case '×':
      return 'bg-amber-600 text-black'
    default:
      return 'bg-slate-600 text-white'
  }
}

// Color coding for operations to make them visually distinct
const opStyle = (op) => {
  switch (op) {
    case '+':
      return 'bg-emerald-700 border-emerald-500 text-white'
    case '-':
      return 'bg-rose-700 border-rose-500 text-white'
    case '÷':
      return 'bg-sky-700 border-sky-500 text-white'
    case '×':
      return 'bg-amber-600 border-amber-400 text-black'
    default:
      return 'bg-slate-600 border-slate-400 text-white'
  }
}

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
