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
        <Card v-else :card="slot.item" :isFaceDown="false" draggable="true" @dragstart="onDragStart($event, index, 'board')" />
      </div>
    </div>

    <!-- Result Preview (No assistance allowed, but we show current syntax validity for debugging/sanity) -->
    <div class="text-center mt-2 text-gold font-mono h-6">
       <!-- Intentionally left blank or simple 'Valid/Invalid' per rule request -->
       {{ isValid ? 'Equation Formed' : 'Arrange: Num Op Num Op Num Op Num' }}
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
       <!-- Operators -->
       <div v-for="(op, i) in availableOps" :key="'op'+i" class="w-16 h-24 bg-blue-100 rounded flex items-center justify-center cursor-grab text-2xl font-bold text-blue-900 border-2 border-blue-300"
        draggable="true" 
        @dragstart="onOpDragStart($event, op, i)"
       >
         {{ op }}
       </div>
    </div>

    <!-- Controls -->
    <div class="flex justify-center gap-4 mt-6">
      <button @click="declare('LOW')" :disabled="!isValid" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50">Target 1 (Low)</button>
      <button @click="declare('HIGH')" :disabled="!isValid" class="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded disabled:opacity-50">Target 20 (High)</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Card from './Card.vue';
import { useGameStore } from '../stores/game';

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
    availableCards.value = [...player.value.hand];
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

// Basic validation: Must use all numbers.
const isValid = computed(() => {
    return availableCards.value.filter(c => c.type === 'number').length === 0;
});

const calculateResult = () => {
    // This is a naive parser. 
    // In real game, we need strict logic: Num Op Num Op Num.
    // We will just eval the string constructed by the visual order.
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
        return new Function('return ' + str)();
    } catch(e) {
        return -999;
    }
};

const declare = (target) => {
    const res = calculateResult();
    game.submitEquation(0, target, res);
};
</script>
