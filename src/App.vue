<template>
  <div class="min-h-screen bg-felt-green flex flex-col items-center justify-center p-4 font-sans text-slate-100">
    
    <!-- Top HUD -->
    <div class="w-full max-w-6xl flex justify-between items-center mb-4 bg-felt-dark p-4 rounded-lg shadow-lg">
      <div>
        <h1 class="text-2xl font-bold text-gold tracking-widest">EQUATION HI-LO</h1>
        <p class="text-sm opacity-75">Pot: <span class="text-gold font-mono text-xl">${{ gameStore.pot }}</span></p>
      </div>
      <div class="text-center">
         <div class="text-xl font-bold mb-1">{{ gameStore.phase }}</div>
         <div class="bg-black/40 px-4 py-1 rounded text-yellow-300 animate-pulse">{{ gameStore.communityMsg }}</div>
      </div>
      <button v-if="gameStore.phase === 'LOBBY' || gameStore.phase === 'END'" 
        @click="gameStore.initGame()" 
        class="bg-gold text-black font-bold px-6 py-2 rounded hover:bg-yellow-400">
        {{ gameStore.phase === 'END' ? 'Next Round' : 'Start Game' }}
      </button>
    </div>

    <!-- Main Table -->
    <div v-if="gameStore.phase !== 'LOBBY'" class="relative w-full max-w-6xl aspect-[16/9] bg-felt-dark rounded-full border-[20px] border-slate-800 shadow-2xl flex items-center justify-center">
      
      <!-- Opponents (Top) -->
      <div class="absolute top-10 flex gap-20">
        <div v-for="p in opponents" :key="p.id" class="flex flex-col items-center transition-opacity duration-300" :class="{'opacity-50': p.folded, 'scale-110': gameStore.currentTurnIndex === p.id}">
          <div class="w-16 h-16 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center text-2xl relative">
            🤖
            <div v-if="p.role" class="absolute -top-2 -right-2 bg-white text-black w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">{{p.role}}</div>
          </div>
          <span class="font-bold mt-1">{{ p.name }}</span>
          <span class="text-gold font-mono">${{ p.chips }}</span>
          <!-- Cards -->
          <div class="flex -space-x-4 mt-2">
            <Card v-for="(c, i) in p.hand" :key="i" :card="c" :isFaceDown="c.faceDown" class="scale-50 origin-top-left" />
          </div>
          <div v-if="p.currentBet > 0" class="mt-2 bg-black/50 px-2 rounded text-sm">Bet: {{p.currentBet}}</div>
        </div>
      </div>

      <!-- Center Pot/Community -->
      <div class="text-center z-10">
         <div v-if="gameStore.winnerMsg" class="bg-black/80 text-white p-6 rounded-xl border-2 border-gold mb-4 max-w-md mx-auto">
             {{ gameStore.winnerMsg }}
         </div>
      </div>

      <!-- Player (Bottom) -->
      <div class="absolute bottom-10 flex flex-col items-center w-full" :class="{'opacity-50': me.folded}">
         <div class="flex gap-8 items-end">
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
            
            <!-- Operations -->
            <div class="flex flex-col gap-1 mb-4">
               <div v-for="(op, i) in me.ops" :key="i" class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold shadow">{{op}}</div>
            </div>
         </div>

         <!-- Actions -->
         <div v-if="isMyTurn && gameStore.phase !== 'SHOWDOWN'" class="flex gap-4 mt-6">
            <button @click="action('fold')" class="bg-red-900 hover:bg-red-700 px-6 py-3 rounded font-bold uppercase tracking-wider border border-red-500">Fold</button>
            <button @click="action('call')" class="bg-slate-600 hover:bg-slate-500 px-6 py-3 rounded font-bold uppercase tracking-wider border border-slate-400">
               {{ toCall === 0 ? 'Check' : `Call ${toCall}` }}
            </button>
            <button v-if="canRaise" @click="action('raise')" class="bg-gold text-black hover:bg-yellow-400 px-6 py-3 rounded font-bold uppercase tracking-wider border border-yellow-600">
               Raise 20
            </button>
         </div>
         <div v-if="me.currentBet > 0" class="mt-2 bg-black/50 px-4 py-1 rounded">Current Bet: {{me.currentBet}}</div>
      </div>
    </div>

    <!-- Equation Builder Overlay -->
    <div v-if="gameStore.phase === 'SHOWDOWN' && !me.folded && !me.declaration" class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
       <EquationBoard />
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore } from './stores/game';
import Card from './components/Card.vue';
import EquationBoard from './components/EquationBoard.vue';

const gameStore = useGameStore();

const me = computed(() => gameStore.players[0] || { hand: [], ops: [], chips: 0 });
const opponents = computed(() => gameStore.players.slice(1));
const isMyTurn = computed(() => gameStore.currentTurnIndex === 0);

const maxBetOnTable = computed(() => Math.max(...gameStore.players.map(p => p.currentBet), 0));
const toCall = computed(() => maxBetOnTable.value - (me.value.currentBet || 0));
const canRaise = computed(() => (maxBetOnTable.value + 20) <= gameStore.maxBetCap && (me.value.chips || 0) >= (toCall.value + 20));

const action = (type) => {
    if (type === 'fold') {
        me.value.folded = true;
        gameStore.communityMsg = "You Folded.";
        gameStore.nextTurn();
    } else if (type === 'call') {
        // If checks
        if (toCall.value === 0) {
            gameStore.communityMsg = "You Checked.";
            gameStore.nextTurn();
        } else {
            gameStore.placeBet(me.value, toCall.value);
            gameStore.nextTurn();
        }
    } else if (type === 'raise') {
        gameStore.placeBet(me.value, toCall.value + 20);
        gameStore.nextTurn();
    }
};
</script>

<style>
/* Global styles for the app */
body {
  margin: 0;
  overflow: hidden;
}
</style>
