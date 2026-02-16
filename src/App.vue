<template>
  <div class="min-h-screen bg-felt-green flex flex-col items-center justify-center p-4 font-sans text-slate-100">
    
    <!-- Top HUD -->
    <div class="w-full max-w-6xl flex justify-between items-center mb-4 bg-felt-dark p-4 rounded-lg shadow-lg">
      <div>
        <h1 class="text-2xl font-bold text-gold tracking-widest">EQUATION HI-LO</h1>
        <p class="text-sm opacity-75">Pot: <span class="text-gold font-mono text-xl">${{ gameStore.pot }}</span></p>
        <p v-if="gameStore.roundNumber" class="text-xs opacity-60">Round {{ gameStore.roundNumber }}{{ gameStore.maxRounds > 0 ? ` / ${gameStore.maxRounds}` : '' }}</p>
      </div>
      <div class="text-center">
         <div class="text-xl font-bold mb-1">{{ phaseLabel }}</div>
         <div class="bg-black/40 px-4 py-1 rounded text-yellow-300 animate-pulse">{{ gameStore.communityMsg }}</div>
      </div>
      <div v-if="gameStore.phase === 'END'">
        <button @click="gameStore.startRound()" class="bg-gold text-black font-bold px-6 py-2 rounded hover:bg-yellow-400">
          Next Round
        </button>
      </div>
      <div v-if="gameStore.phase === 'GAME_OVER'">
        <button @click="gameStore.phase = 'LOBBY'" class="bg-gold text-black font-bold px-6 py-2 rounded hover:bg-yellow-400">
          New Game
        </button>
      </div>
    </div>

    <!-- Lobby Screen -->
    <div v-if="gameStore.phase === 'LOBBY'" class="flex flex-col items-center gap-8 mt-12">
      <h2 class="text-4xl font-bold text-gold tracking-widest">♠ EQUATION HI-LO ♠</h2>
      <p class="text-slate-300 text-lg max-w-md text-center">Build equations. Bet wisely. Target 1 (Low) or 20 (High) to win the pot.</p>
      
      <div class="bg-felt-dark p-8 rounded-xl shadow-2xl flex flex-col items-center gap-6 w-80">
        <label class="text-lg font-bold text-slate-200">Number of AI Opponents</label>
        <div class="flex gap-3">
          <button 
            v-for="n in [1, 2, 3]" :key="n"
            @click="selectedAiCount = n"
            class="w-14 h-14 rounded-lg text-xl font-bold transition-all duration-200 border-2"
            :class="selectedAiCount === n
              ? 'bg-gold text-black border-gold scale-110 shadow-lg'
              : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-gold hover:text-gold'"
          >
            {{ n }}
          </button>
        </div>
        <p class="text-sm text-slate-400">{{ selectedAiCount + 1 }} players total</p>

        <label class="text-lg font-bold text-slate-200 mt-2">Number of Rounds</label>
        <div class="flex gap-3">
          <button 
            v-for="r in [{val: 5, label: '5'}, {val: 10, label: '10'}, {val: 0, label: '∞'}]" :key="r.val"
            @click="selectedRounds = r.val"
            class="w-14 h-14 rounded-lg text-xl font-bold transition-all duration-200 border-2"
            :class="selectedRounds === r.val
              ? 'bg-gold text-black border-gold scale-110 shadow-lg'
              : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-gold hover:text-gold'"
          >
            {{ r.label }}
          </button>
        </div>
        <p class="text-sm text-slate-400">{{ selectedRounds === 0 ? 'Elimination mode' : `${selectedRounds} rounds` }}</p>
        
        <button 
          @click="gameStore.initGame(selectedAiCount, selectedRounds)" 
          class="bg-gold text-black font-bold px-10 py-3 rounded-lg hover:bg-yellow-400 text-lg tracking-wider shadow-lg transition-transform hover:scale-105 mt-2"
        >
          Start Game
        </button>
      </div>
    </div>

    <!-- Main Table -->
    <div v-if="gameStore.phase !== 'LOBBY'" class="relative w-full max-w-6xl aspect-[16/9] bg-felt-dark rounded-full border-[20px] border-slate-800 shadow-2xl flex items-center justify-center">
      
      <!-- Opponents (Top) -->
      <div class="absolute top-6 flex" :class="opponents.length === 1 ? 'gap-0' : opponents.length === 2 ? 'gap-32' : 'gap-16'">
        <div v-for="p in opponents" :key="p.id" class="flex flex-col items-center transition-opacity duration-300" :class="{'opacity-30 grayscale': p.eliminated, 'opacity-50': p.folded && !p.eliminated, 'scale-110': gameStore.currentTurnIndex === p.id && !p.eliminated}">
          <div class="w-14 h-14 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center text-xl relative">
            {{ p.eliminated ? '💀' : '🤖' }}
            <div v-if="p.role && !p.eliminated" class="absolute -top-2 -right-2 bg-white text-black w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">{{p.role}}</div>
          </div>
          <span class="font-bold mt-1 text-sm">{{ p.name }}</span>
          <span class="text-gold font-mono text-xs">${{ p.chips }}</span>
          <!-- Cards + Ops row -->
          <div class="flex items-center gap-1 mt-1">
            <div class="flex -space-x-4">
              <Card v-for="(c, i) in p.hand" :key="i" :card="c" :isFaceDown="c.faceDown" class="scale-50 origin-top-left" />
            </div>
            <!-- Opponent Operations -->
            <div class="flex gap-0.5 ml-1">
              <div v-for="(op, oi) in p.ops" :key="oi" class="w-6 h-6 rounded text-xs font-bold flex items-center justify-center shadow"
                :class="opStyle(op)">
                {{op}}
              </div>
            </div>
          </div>
          <div v-if="p.currentBet > 0" class="mt-1 bg-black/50 px-2 rounded text-xs">Bet: {{p.currentBet}}</div>
        </div>
      </div>

      <!-- Center Pot/Community -->
      <div class="text-center z-10">
         <!-- Showdown Results Panel -->
         <div v-if="gameStore.winnerMsg && gameStore.showdownResults" class="bg-black/95 text-white p-5 rounded-xl border-2 border-gold max-w-6xl mx-auto">
             <h3 class="text-gold text-xl font-bold mb-4 tracking-wider">🏆 SHOWDOWN RESULTS</h3>
             <!-- 2x2 Grid -->
             <div class="grid grid-cols-2 gap-3">
               <div 
                 v-for="(r, i) in gameStore.showdownResults" :key="i"
                 class="bg-slate-800/80 rounded-lg px-4 py-3 border"
                 :class="r.isLowWinner || r.isHighWinner ? 'border-gold' : 'border-slate-700'"
               >
                 <!-- Name + badges row -->
                 <div class="flex items-center justify-between mb-2">
                   <div class="font-bold text-sm" :class="r.isLowWinner || r.isHighWinner ? 'text-gold' : 'text-slate-300'">
                     {{ r.name }}
                     <span v-if="r.isLowWinner" class="ml-1 text-[10px] bg-blue-600 px-1.5 py-0.5 rounded text-white">LOW 🏆</span>
                     <span v-if="r.isHighWinner" class="ml-1 text-[10px] bg-red-600 px-1.5 py-0.5 rounded text-white">HIGH 🏆</span>
                   </div>
                   <span class="text-[10px] text-slate-400 uppercase tracking-wide">{{ r.declaration }}</span>
                 </div>

                 <!-- SWING: two equation blocks -->
                 <template v-if="r.declaration === 'SWING'">
                   <!-- LOW equation -->
                   <div class="mb-2">
                     <div class="text-[10px] text-blue-400 font-bold uppercase mb-1">Low → Target 1</div>
                     <div class="flex items-center gap-1.5 flex-wrap mb-1">
                       <template v-for="(item, j) in interleaveEquation(r.hand, r.ops, r.lowEqStr)" :key="'l'+j">
                         <div v-if="item.kind === 'card'" class="w-10 h-14 rounded-lg border-2 bg-slate-100 flex flex-col items-center justify-center text-xs font-bold shadow-sm"
                           :class="{'border-yellow-500': item.suit === 'gold', 'border-gray-400': item.suit === 'silver', 'border-orange-600': item.suit === 'bronze', 'border-slate-400': item.suit === 'black', 'border-purple-400': item.type === 'sqrt'}"
                         >
                           <span :class="{'text-yellow-600': item.suit === 'gold', 'text-gray-500': item.suit === 'silver', 'text-orange-700': item.suit === 'bronze', 'text-slate-800': item.suit === 'black', 'text-purple-700': item.type === 'sqrt'}">{{ item.value }}</span>
                           <span v-if="item.suit" class="text-[7px] uppercase font-semibold opacity-70" :class="{'text-yellow-600': item.suit === 'gold', 'text-gray-500': item.suit === 'silver', 'text-orange-700': item.suit === 'bronze', 'text-slate-600': item.suit === 'black'}">{{ item.suit }}</span>
                         </div>
                         <div v-else class="w-7 h-14 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm" :class="opColorMini(item.value)">{{ item.value }}</div>
                       </template>
                     </div>
                     <div class="flex items-baseline gap-2">
                       <span class="font-mono font-bold text-base text-blue-300">= {{ r.lowResult != null ? r.lowResult.toFixed(2) : '?' }}</span>
                       <span v-if="r.lowDiff != null" class="text-xs font-mono" :class="r.lowDiff === 0 ? 'text-green-400' : r.lowDiff < 1 ? 'text-yellow-400' : 'text-slate-500'">(Δ1: {{ r.lowDiff.toFixed(2) }})</span>
                     </div>
                   </div>
                   <!-- HIGH equation -->
                   <div>
                     <div class="text-[10px] text-red-400 font-bold uppercase mb-1">High → Target 20</div>
                     <div class="flex items-center gap-1.5 flex-wrap mb-1">
                       <template v-for="(item, j) in interleaveEquation(r.hand, r.ops, r.highEqStr)" :key="'h'+j">
                         <div v-if="item.kind === 'card'" class="w-10 h-14 rounded-lg border-2 bg-slate-100 flex flex-col items-center justify-center text-xs font-bold shadow-sm"
                           :class="{'border-yellow-500': item.suit === 'gold', 'border-gray-400': item.suit === 'silver', 'border-orange-600': item.suit === 'bronze', 'border-slate-400': item.suit === 'black', 'border-purple-400': item.type === 'sqrt'}"
                         >
                           <span :class="{'text-yellow-600': item.suit === 'gold', 'text-gray-500': item.suit === 'silver', 'text-orange-700': item.suit === 'bronze', 'text-slate-800': item.suit === 'black', 'text-purple-700': item.type === 'sqrt'}">{{ item.value }}</span>
                           <span v-if="item.suit" class="text-[7px] uppercase font-semibold opacity-70" :class="{'text-yellow-600': item.suit === 'gold', 'text-gray-500': item.suit === 'silver', 'text-orange-700': item.suit === 'bronze', 'text-slate-600': item.suit === 'black'}">{{ item.suit }}</span>
                         </div>
                         <div v-else class="w-7 h-14 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm" :class="opColorMini(item.value)">{{ item.value }}</div>
                       </template>
                     </div>
                     <div class="flex items-baseline gap-2">
                       <span class="font-mono font-bold text-base text-red-300">= {{ r.highResult != null ? r.highResult.toFixed(2) : '?' }}</span>
                       <span v-if="r.highDiff != null" class="text-xs font-mono" :class="r.highDiff === 0 ? 'text-green-400' : r.highDiff < 1 ? 'text-yellow-400' : 'text-slate-500'">(Δ20: {{ r.highDiff.toFixed(2) }})</span>
                     </div>
                   </div>
                 </template>

                 <!-- Normal (non-swing) equation -->
                 <template v-else>
                   <div class="flex items-center gap-1.5 flex-wrap mb-3">
                     <template v-for="(item, j) in interleaveEquation(r.hand, r.ops, r.equation)" :key="j">
                       <div v-if="item.kind === 'card'" class="w-12 h-16 rounded-lg border-2 bg-slate-100 flex flex-col items-center justify-center text-sm font-bold shadow-sm"
                         :class="{'border-yellow-500': item.suit === 'gold', 'border-gray-400': item.suit === 'silver', 'border-orange-600': item.suit === 'bronze', 'border-slate-400': item.suit === 'black', 'border-purple-400': item.type === 'sqrt'}"
                       >
                         <span :class="{'text-yellow-600': item.suit === 'gold', 'text-gray-500': item.suit === 'silver', 'text-orange-700': item.suit === 'bronze', 'text-slate-800': item.suit === 'black', 'text-purple-700': item.type === 'sqrt'}">{{ item.value }}</span>
                         <span v-if="item.suit" class="text-[8px] uppercase font-semibold opacity-70" :class="{'text-yellow-600': item.suit === 'gold', 'text-gray-500': item.suit === 'silver', 'text-orange-700': item.suit === 'bronze', 'text-slate-600': item.suit === 'black'}">{{ item.suit }}</span>
                       </div>
                       <div v-else class="w-9 h-16 rounded-lg flex items-center justify-center text-base font-bold shadow-sm" :class="opColorMini(item.value)">{{ item.value }}</div>
                     </template>
                   </div>
                   <div class="flex items-baseline gap-2">
                     <span class="font-mono font-bold text-lg" :class="r.isLowWinner || r.isHighWinner ? 'text-gold' : 'text-slate-200'">
                       = {{ typeof r.result === 'number' ? r.result.toFixed(2) : r.result }}
                     </span>
                     <span v-if="r.diff != null" class="text-xs font-mono" :class="r.diff === 0 ? 'text-green-400' : r.diff < 1 ? 'text-yellow-400' : 'text-slate-500'">
                       ({{ r.declaration === 'LOW' ? 'Δ1' : 'Δ20' }}: {{ r.diff.toFixed(2) }})
                     </span>
                   </div>
                 </template>
               </div>
             </div>
             <!-- Tiebreaker explanation -->
             <div v-if="gameStore.lowTiebreakExplanation || gameStore.highTiebreakExplanation" class="mt-3 p-2.5 bg-amber-900/30 border border-amber-700/50 rounded-lg">
               <div class="text-amber-300 text-xs font-semibold mb-1">⚖️ Tie Detected</div>
               <div v-if="gameStore.lowTiebreakExplanation" class="text-amber-200/80 text-[11px] font-mono">LOW: {{ gameStore.lowTiebreakExplanation }}</div>
               <div v-if="gameStore.highTiebreakExplanation" class="text-amber-200/80 text-[11px] font-mono">HIGH: {{ gameStore.highTiebreakExplanation }}</div>
             </div>
             <!-- Winner message -->
             <div class="mt-3 text-center text-sm text-slate-300">{{ gameStore.winnerMsg }}</div>
         </div>
         <!-- Fallback for fold wins -->
         <div v-else-if="gameStore.winnerMsg" class="bg-black/80 text-white p-6 rounded-xl border-2 border-gold mb-4 max-w-md mx-auto">
             {{ gameStore.winnerMsg }}
         </div>
      </div>

      <!-- Player (Bottom) -->
      <div class="absolute bottom-10 flex flex-col items-center w-full" :class="{'opacity-50': me.folded}">
         <div class="flex gap-6 items-end">
            <!-- Stats -->
            <div class="text-right mb-4">
                <div class="text-2xl font-bold">{{ me.name }}</div>
                <div class="text-gold font-mono text-xl">${{ me.chips }}</div>
                <div v-if="me.role" class="bg-white text-black inline-block px-2 rounded-full font-bold text-xs">{{me.role}}</div>
            </div>

            <!-- Hand -->
            <div class="flex -space-x-2">
               <Card v-for="(c, i) in me.hand" :key="i" :card="c" :isFaceDown="false" class="hover:-translate-y-4 transition-transform duration-200" />
            </div>
            
            <!-- Operations (styled to match card size) -->
            <div class="flex gap-1.5 mb-2">
               <div v-for="(op, i) in me.ops" :key="i" 
                 class="w-10 h-14 rounded-lg flex items-center justify-center font-bold text-xl shadow-md border-2"
                 :class="opStyle(op)">
                 {{op}}
               </div>
            </div>
         </div>

         <!-- Actions -->
         <div v-if="isMyTurn && gameStore.phase !== 'SHOWDOWN'" class="flex gap-4 mt-6 items-center">
            <button @click="action('fold')" class="bg-red-900 hover:bg-red-700 px-6 py-3 rounded font-bold uppercase tracking-wider border border-red-500">Fold</button>
            <button @click="action('call')" class="bg-slate-600 hover:bg-slate-500 px-6 py-3 rounded font-bold uppercase tracking-wider border border-slate-400">
               {{ toCall === 0 ? 'Check' : `Call ${toCall}` }}
            </button>
            <div v-if="canRaise" class="flex items-center gap-2">
              <button @click="adjustRaise(-10)" class="bg-slate-700 hover:bg-slate-600 w-8 h-8 rounded text-lg font-bold border border-slate-500">−</button>
              <button @click="action('raise')" class="bg-gold text-black hover:bg-yellow-400 px-6 py-3 rounded font-bold uppercase tracking-wider border border-yellow-600">
                 Raise {{ raiseAmount }}
              </button>
              <button @click="adjustRaise(10)" class="bg-slate-700 hover:bg-slate-600 w-8 h-8 rounded text-lg font-bold border border-slate-500">+</button>
            </div>
         </div>
         <div v-if="me.currentBet > 0" class="mt-2 bg-black/50 px-4 py-1 rounded">Current Bet: {{me.currentBet}}</div>
      </div>
    </div>

    <!-- Equation Builder Overlay -->
    <div v-if="gameStore.phase === 'SHOWDOWN' && !me.folded && !me.declaration" class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
       <EquationBoard />
    </div>

    <!-- Discard Operator Modal -->
    <div v-if="gameStore.pendingDiscard" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div class="bg-slate-800 p-8 rounded-xl border-2 border-gold shadow-2xl flex flex-col items-center gap-6 max-w-sm">
        <h3 class="text-gold text-xl font-bold tracking-wider">× Card Drawn!</h3>
        <p class="text-slate-300 text-center">You drew a <span class="text-gold font-bold">Multiply (×)</span> card.<br>Choose which operator to discard:</p>
        <div class="flex gap-6">
          <button 
            @click="gameStore.resolveDiscard('+')"
            class="w-20 h-20 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-3xl font-bold border-2 border-emerald-400 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
          >+</button>
          <button 
            @click="gameStore.resolveDiscard('-')"
            class="w-20 h-20 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-3xl font-bold border-2 border-rose-400 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
          >−</button>
        </div>
        <p class="text-xs text-slate-500">The discarded operator will be replaced by ×</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from './stores/game';
import Card from './components/Card.vue';
import EquationBoard from './components/EquationBoard.vue';

const gameStore = useGameStore();
const selectedAiCount = ref(3);
const selectedRounds = ref(10);

const me = computed(() => gameStore.players[0] || { hand: [], ops: [], chips: 0 });
const opponents = computed(() => gameStore.players.slice(1));
const phaseLabel = computed(() => {
  const labels = {
    LOBBY: 'Lobby', ANTE: 'Ante', ROUND_1: 'Betting 1', DEAL_4: 'Deal',
    ROUND_2: 'Betting 2', SHOWDOWN: 'Showdown', END: 'End', GAME_OVER: 'Game Over'
  };
  return labels[gameStore.phase] || gameStore.phase;
});
const isMyTurn = computed(() => gameStore.currentTurnIndex === 0);

const maxBetOnTable = computed(() => Math.max(...gameStore.players.map(p => p.currentBet), 0));
const toCall = computed(() => maxBetOnTable.value - (me.value.currentBet || 0));
const raiseAmount = ref(20);
const maxRaise = computed(() => {
  const remaining = (gameStore.roundBettingCap || Infinity) - (me.value.totalWagered || 0);
  return Math.min(remaining - toCall.value, (me.value.chips || 0) - toCall.value);
});
const canRaise = computed(() => maxRaise.value >= 10);

const adjustRaise = (delta) => {
  raiseAmount.value = Math.max(10, Math.min(raiseAmount.value + delta, maxRaise.value));
};

// Parse equationStr to display cards in correct equation order, matching to hand for suit info
const interleaveEquation = (hand, ops, equationStr) => {
  const result = [];
  if (!equationStr || !hand) return result;
  const tokens = equationStr.trim().split(/\s+/);
  const available = [...hand]; // copy to track consumed cards
  for (const token of tokens) {
    if (['+', '-', '×', '÷'].includes(token)) {
      result.push({ kind: 'op', value: token });
    } else if (token.startsWith('√')) {
      // √ card followed by the number it applies to
      const sqrtIdx = available.findIndex(c => c.type === 'sqrt');
      if (sqrtIdx >= 0) {
        result.push({ kind: 'card', value: '√', type: 'sqrt' });
        available.splice(sqrtIdx, 1);
      }
      const numVal = parseFloat(token.slice(1));
      if (!isNaN(numVal)) {
        const numIdx = available.findIndex(c => c.type === 'number' && c.value === numVal);
        if (numIdx >= 0) {
          result.push({ kind: 'card', value: available[numIdx].value, suit: available[numIdx].suit, type: 'number' });
          available.splice(numIdx, 1);
        }
      }
    } else {
      const numVal = parseFloat(token);
      if (!isNaN(numVal)) {
        const numIdx = available.findIndex(c => c.type === 'number' && c.value === numVal);
        if (numIdx >= 0) {
          result.push({ kind: 'card', value: available[numIdx].value, suit: available[numIdx].suit, type: 'number' });
          available.splice(numIdx, 1);
        }
      }
    }
  }
  return result;
};

// Smaller op color styling for showdown grid
const opColorMini = (op) => {
  switch (op) {
    case '+': return 'bg-emerald-700 text-white';
    case '-': return 'bg-rose-700 text-white';
    case '÷': return 'bg-sky-700 text-white';
    case '×': return 'bg-amber-600 text-black';
    default: return 'bg-slate-600 text-white';
  }
};

// Color coding for operations to make them visually distinct
const opStyle = (op) => {
  switch (op) {
    case '+': return 'bg-emerald-700 border-emerald-500 text-white';
    case '-': return 'bg-rose-700 border-rose-500 text-white';
    case '÷': return 'bg-sky-700 border-sky-500 text-white';
    case '×': return 'bg-amber-600 border-amber-400 text-black';
    default: return 'bg-slate-600 border-slate-400 text-white';
  }
};

const action = (type) => {
    if (type === 'fold') {
        me.value.folded = true;
        gameStore.communityMsg = "You Folded.";
        gameStore.nextTurn();
    } else if (type === 'call') {
        if (toCall.value === 0) {
            gameStore.communityMsg = "You Checked.";
            gameStore.nextTurn();
        } else {
            gameStore.placeBet(me.value, toCall.value);
            gameStore.nextTurn();
        }
    } else if (type === 'raise') {
        gameStore.placeBet(me.value, toCall.value + raiseAmount.value);
        gameStore.lastAggressorIndex = 0;
        gameStore.nextTurn();
    }
};
</script>

<style>
body {
  margin: 0;
  overflow: hidden;
}
</style>
