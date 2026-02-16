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
         <div class="text-xl font-bold mb-1">{{ gameStore.phase }}</div>
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
         <div v-if="gameStore.winnerMsg && gameStore.showdownResults" class="bg-black/90 text-white p-6 rounded-xl border-2 border-gold max-w-lg mx-auto">
             <h3 class="text-gold text-lg font-bold mb-4 tracking-wider">🏆 SHOWDOWN RESULTS</h3>
             <div class="space-y-3">
               <div 
                 v-for="(r, i) in gameStore.showdownResults" :key="i"
                 class="flex items-center justify-between bg-slate-800/80 rounded-lg px-4 py-3 border"
                 :class="r.isLowWinner || r.isHighWinner ? 'border-gold' : 'border-slate-700'"
               >
                 <div class="text-left flex-1">
                   <div class="font-bold text-sm" :class="r.isLowWinner || r.isHighWinner ? 'text-gold' : 'text-slate-300'">
                     {{ r.name }}
                     <span v-if="r.isLowWinner" class="ml-1 text-xs bg-blue-600 px-2 py-0.5 rounded text-white">LOW 🏆</span>
                     <span v-if="r.isHighWinner" class="ml-1 text-xs bg-red-600 px-2 py-0.5 rounded text-white">HIGH 🏆</span>
                   </div>
                   <div class="text-xs text-slate-400 font-mono mt-1">{{ r.equation }}</div>
                 </div>
                 <div class="text-right ml-4">
                   <div class="text-xs text-slate-400 uppercase">{{ r.declaration }}</div>
                   <div class="font-mono font-bold text-lg" :class="r.isLowWinner || r.isHighWinner ? 'text-gold' : 'text-slate-300'">
                     = {{ typeof r.result === 'number' ? r.result.toFixed(2) : r.result }}
                   </div>
                 </div>
               </div>
             </div>
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
