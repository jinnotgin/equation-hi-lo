<template>
  <div class="bg-slate-800 p-4 rounded-lg shadow-xl w-full max-w-4xl mx-auto mt-4">
    <h2 class="text-white text-lg mb-4">Build Your Equation</h2>
    
    <!-- Drop Zone -->
    <div class="flex items-center gap-2 p-4 bg-slate-900 rounded-lg min-h-[120px] justify-center flex-wrap">
      <div 
        v-for="(slot, index) in slots" 
        :key="index"
        class="w-16 h-24 border-2 border-dashed border-slate-600 rounded flex items-center justify-center relative bg-slate-800"
        @dragover.prevent
        @drop="onDrop($event, index)"
      >
        <span v-if="!slot.item" class="text-slate-600 text-xs">Slot {{index+1}}</span>
        <!-- Operator in slot: render with color -->
        <div v-else-if="slot.item.type === 'op'" 
          class="w-16 h-24 rounded flex items-center justify-center cursor-grab text-2xl font-bold border-2"
          :class="opColor(slot.item.value)"
          draggable="true" @dragstart="onDragStart($event, index, 'board')"
        >{{ slot.item.value }}</div>
        <!-- Card in slot -->
        <Card v-else :card="slot.item" :isFaceDown="false" draggable="true" @dragstart="onDragStart($event, index, 'board')" />
      </div>
    </div>

    <!-- Result Preview -->
    <div class="text-center mt-2 text-gold font-mono h-6">
       {{ divisionByZeroError ? '❌ Division by zero is not allowed!' : isValid ? '✅ All cards & operators used — choose your target!' : `Place all cards (${availableCards.length} left) and operators (${availableOps.length} left)` }}
    </div>

    <!-- Hand (Source) -->
    <div class="flex gap-2 mt-4 justify-center flex-wrap">
      <div v-for="(card, i) in availableCards" :key="card.id" class="cursor-grab">
         <Card 
           :card="card" 
           :isFaceDown="false" 
           draggable="true" 
           @dragstart="onDragStart($event, i, 'hand')" 
         />
      </div>
       <!-- Operators (with per-op colors) -->
       <div v-for="(op, i) in availableOps" :key="'op'+i" 
        class="w-16 h-24 rounded flex items-center justify-center cursor-grab text-2xl font-bold border-2"
        :class="opColor(op)"
        draggable="true" 
        @dragstart="onOpDragStart($event, op, i)"
       >
         {{ op }}
       </div>
    </div>

    <!-- Swing Phase Label -->
    <div v-if="swingPhase" class="text-center mt-2 text-lg font-bold" :class="swingPhase === 'low' ? 'text-blue-400' : 'text-red-400'">
      🎯 SWING — Build your {{ swingPhase === 'low' ? 'LOW (target 1)' : 'HIGH (target 20)' }} equation
    </div>

    <!-- Controls -->
    <div class="flex justify-center gap-4 mt-6">
      <template v-if="!swingPhase">
        <button @click="declare('LOW')" :disabled="!isValid || divisionByZeroError" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50">Target 1 (Low)</button>
        <button @click="declare('HIGH')" :disabled="!isValid || divisionByZeroError" class="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded disabled:opacity-50">Target 20 (High)</button>
        <button @click="startSwing()" class="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded border border-purple-400">🎯 Swing</button>
      </template>
      <template v-else-if="swingPhase === 'low'">
        <button @click="confirmSwingLow()" :disabled="!isValid || divisionByZeroError" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50">Confirm Low Equation →</button>
        <button @click="cancelSwing()" class="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded">Cancel</button>
      </template>
      <template v-else-if="swingPhase === 'high'">
        <button @click="confirmSwingHigh()" :disabled="!isValid || divisionByZeroError" class="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded disabled:opacity-50">Submit Swing!</button>
        <button @click="cancelSwing()" class="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded">Cancel</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Card from './Card.vue';
import { useGameStore } from '../stores/game';

// Per-operator color classes (matches App.vue opStyle)
const opColor = (op) => {
  switch (op) {
    case '+': return 'bg-emerald-700 border-emerald-500 text-white';
    case '-': return 'bg-rose-700 border-rose-500 text-white';
    case '÷': return 'bg-sky-700 border-sky-500 text-white';
    case '×': return 'bg-amber-600 border-amber-400 text-black';
    default: return 'bg-slate-600 border-slate-400 text-white';
  }
};

const game = useGameStore();
const player = computed(() => game.players[0]);

// Initialize slots. We usually need 7 slots (4 nums + 3 ops). 
// Sqrts are attached to numbers, effectively making them a unit, but visually separate.
// Simplified for UI: Linear slots. Logic parses them.
const slots = ref(Array(9).fill({ item: null })); 

// Track available items locally to handle the drag-drop state
const availableCards = ref([]);
const availableOps = ref([]);

onMounted(() => {
  if (player.value) {
    // Filter out special cards (multiply/sqrt) — they modify ops/numbers, not placed in equation
    availableCards.value = player.value.hand.filter(c => c.type === 'number' || c.type === 'sqrt');
    availableOps.value = [...player.value.ops];
  }
});

const onDragStart = (evt, index, source) => {
  evt.dataTransfer.setData('type', 'card');
  evt.dataTransfer.setData('index', index);
  evt.dataTransfer.setData('source', source);
};

const onOpDragStart = (evt, op, index) => {
  evt.dataTransfer.setData('type', 'op');
  evt.dataTransfer.setData('val', op);
  evt.dataTransfer.setData('index', index);
};

const onDrop = (evt, slotIndex) => {
  const type = evt.dataTransfer.getData('type');
  
  if (type === 'card') {
    const sourceIndex = evt.dataTransfer.getData('index');
    const source = evt.dataTransfer.getData('source');
    
    let card;
    if (source === 'hand') {
      card = availableCards.value[sourceIndex];
      availableCards.value.splice(sourceIndex, 1);
    } else {
      // Moving from another slot
      card = slots.value[sourceIndex].item;
      slots.value[sourceIndex] = { item: null };
    }
    
    // Swap if occupied
    if (slots.value[slotIndex].item) {
      availableCards.value.push(slots.value[slotIndex].item);
    }
    slots.value[slotIndex] = { item: card };
  } 
  else if (type === 'op') {
    const index = evt.dataTransfer.getData('index');
    const val = evt.dataTransfer.getData('val');
    
    // Create temp object for op to fit in card slot structure
    const opItem = { type: 'op', value: val, id: `op-${Math.random()}` };
    
    if (availableOps.value.includes(val)) {
       const idx = availableOps.value.indexOf(val);
       availableOps.value.splice(idx, 1);
    }
    
    if (slots.value[slotIndex].item) {
        // Return existing to pile
        const existing = slots.value[slotIndex].item;
        if(existing.type === 'op') availableOps.value.push(existing.value);
        else availableCards.value.push(existing);
    }
    
    slots.value[slotIndex] = { item: opItem };
  }
};

// Validation: ALL cards and ALL operators must be used.
const isValid = computed(() => {
    return availableCards.value.length === 0 && availableOps.value.length === 0;
});

const divisionByZeroError = ref(false);

const calculateResult = () => {
    divisionByZeroError.value = false;
    try {
        let str = "";
        let pendingSqrt = false;
        
        slots.value.forEach(s => {
            if(!s.item) return;
            if(s.item.type === 'sqrt') pendingSqrt = true;
            else if (s.item.type === 'number') {
                let val = s.item.value;
                if(pendingSqrt) { val = Math.sqrt(val); pendingSqrt = false; }
                str += val;
            } else if (s.item.type === 'op') {
                const op = s.item.value === '×' ? '*' : (s.item.value === '÷' ? '/' : s.item.value);
                str += ` ${op} `;
            }
        });
        
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + str)();
        if (!isFinite(result) || isNaN(result)) {
            divisionByZeroError.value = true;
            return null;
        }
        return result;
    } catch(e) {
        return null;
    }
};

const declare = (target) => {
    const res = calculateResult();
    if (res === null) return; // division by zero or parse error
    // Build a human-readable equation string from the slots
    let eqStr = '';
    slots.value.forEach(s => {
        if (!s.item) return;
        if (s.item.type === 'number') eqStr += s.item.value;
        else if (s.item.type === 'sqrt') eqStr += '√';
        else if (s.item.type === 'op') eqStr += ` ${s.item.value} `;
    });
    player.value.equationStr = eqStr.trim();
    game.submitEquation(0, target, res);
};

// §11: Swing bet flow
const swingPhase = ref(null); // null | 'low' | 'high'
const savedLowResult = ref(null);
const savedLowEqStr = ref('');

const startSwing = () => {
    swingPhase.value = 'low';
};

const cancelSwing = () => {
    swingPhase.value = null;
    savedLowResult.value = null;
    savedLowEqStr.value = '';
    resetSlots();
};

const confirmSwingLow = () => {
    const res = calculateResult();
    if (res === null) return;
    let eqStr = '';
    slots.value.forEach(s => {
        if (!s.item) return;
        if (s.item.type === 'number') eqStr += s.item.value;
        else if (s.item.type === 'sqrt') eqStr += '√';
        else if (s.item.type === 'op') eqStr += ` ${s.item.value} `;
    });
    savedLowResult.value = res;
    savedLowEqStr.value = eqStr.trim();
    swingPhase.value = 'high';
    resetSlots();
};

const confirmSwingHigh = () => {
    const res = calculateResult();
    if (res === null) return;
    let eqStr = '';
    slots.value.forEach(s => {
        if (!s.item) return;
        if (s.item.type === 'number') eqStr += s.item.value;
        else if (s.item.type === 'sqrt') eqStr += '√';
        else if (s.item.type === 'op') eqStr += ` ${s.item.value} `;
    });
    player.value.equationStr = `L: ${savedLowEqStr.value} | H: ${eqStr.trim()}`;
    game.submitEquation(0, 'SWING', savedLowResult.value, res);
};

const resetSlots = () => {
    slots.value.forEach(s => s.item = null);
};
</script>
