<template>
  <div class="bg-slate-800 p-4 rounded-lg shadow-xl w-full max-w-4xl mx-auto mt-4">
    <h2 class="text-white text-lg mb-4">Build Your Equation</h2>

    <!-- Drop Zone -->
    <div
      class="flex items-center gap-2 p-4 bg-slate-900 rounded-lg min-h-[120px] justify-center flex-wrap"
    >
      <div
        v-for="(slot, index) in slots"
        :key="index"
        class="w-16 h-24 border-2 border-dashed border-slate-600 rounded flex items-center justify-center relative bg-slate-800 group"
        @dragover.prevent
        @drop="onDrop($event, index)"
      >
        <span v-if="!slot.item" class="text-slate-600 text-xs">Slot {{ index + 1 }}</span>

        <!-- Operator in slot -->
        <div
          v-else-if="slot.item.type === 'op'"
          class="w-16 h-24 rounded flex items-center justify-center cursor-move text-2xl font-bold border-2 relative"
          :class="opColor(slot.item.value)"
          draggable="true"
          @dragstart="onDragStart($event, index, 'board')"
        >
          {{ slot.item.value }}
        </div>

        <!-- Card in slot -->
        <div
          v-else
          class="cursor-move relative"
          draggable="true"
          @dragstart="onDragStart($event, index, 'board')"
        >
          <Card :card="slot.item" :isFaceDown="false" />
        </div>

        <!-- Remove Button (X) -->
        <button
          v-if="slot.item"
          @click.stop="removeSlotItem(index)"
          class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:bg-red-500"
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Result Preview & Validation Feedback -->
    <div class="text-center mt-2 font-mono h-6 transition-colors duration-300 relative">
      <div v-if="divisionByZeroError" class="text-red-400 font-bold">
        ❌ Division by zero is not allowed!
      </div>
      <div v-else-if="isValid">
        <span v-if="previewResult !== null" class="text-emerald-400 font-bold">
          <span class="text-emerald-400 text-sm font-bold animate-pulse">
            ✅ All used — choose target!
          </span>
        </span>
        <span v-else class="text-red-400 font-bold"> ❌ Invalid Equation (Check syntax) </span>
      </div>
      <div v-else class="text-gold">
        Place all cards ({{ availableCards.length }} left) and operators ({{ availableOps.length }}
        left)
      </div>
    </div>

    <!-- Hand (Source) -->
    <div
      class="flex gap-2 mt-4 justify-center flex-wrap min-h-[6rem] p-4 rounded-lg bg-slate-800/50 border-2 border-dashed border-slate-700 transition-colors"
      @dragover.prevent
      @drop="onHandDrop($event)"
    >
      <div
        v-for="(card, i) in availableCards"
        :key="card.id"
        class="cursor-move hover:-translate-y-1 transition-transform"
        @click="addFromHand(card, 'card', i)"
      >
        <Card
          :card="card"
          :isFaceDown="false"
          draggable="true"
          @dragstart="onDragStart($event, i, 'hand')"
        />
      </div>
      <!-- Operators -->
      <div
        v-for="(op, i) in availableOps"
        :key="'op' + i"
        class="w-16 h-24 rounded flex items-center justify-center cursor-move text-2xl font-bold border-2 hover:-translate-y-1 transition-transform"
        :class="opColor(op)"
        draggable="true"
        @dragstart="onOpDragStart($event, op, i)"
        @click="addFromHand(op, 'op', i)"
      >
        {{ op }}
      </div>
    </div>

    <!-- Swing Phase Label -->
    <div
      v-if="swingPhase"
      class="text-center mt-2 text-lg font-bold"
      :class="swingPhase === 'low' ? 'text-blue-400' : 'text-red-400'"
    >
      🎯 SWING — Build your
      {{ swingPhase === 'low' ? 'LOW (target 1)' : 'HIGH (target 20)' }} equation
    </div>

    <!-- Controls -->
    <div class="flex justify-center gap-4 mt-6">
      <template v-if="!swingPhase">
        <button
          @click="declare('LOW')"
          :disabled="!isReadyToSubmit"
          class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Target 1 (Low)
        </button>
        <button
          @click="declare('HIGH')"
          :disabled="!isReadyToSubmit"
          class="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Target 20 (High)
        </button>
        <button
          @click="startSwing()"
          class="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded border border-purple-400"
        >
          🎯 Swing
        </button>
      </template>
      <template v-else-if="swingPhase === 'low'">
        <button
          @click="confirmSwingLow()"
          :disabled="!isReadyToSubmit"
          class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Low Equation →
        </button>
        <button
          @click="cancelSwing()"
          class="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      </template>
      <template v-else-if="swingPhase === 'high'">
        <button
          @click="confirmSwingHigh()"
          :disabled="!isReadyToSubmit"
          class="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Swing!
        </button>
        <button
          @click="cancelSwing()"
          class="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Card from './Card.vue'
import { useGameStore } from '../stores/game'

// Per-operator color classes (matches App.vue opStyle)
const opColor = (op) => {
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

const game = useGameStore()
const player = computed(() => game.players[0])

// Initialize slots. We usually need 7 slots (4 nums + 3 ops).
// Sqrts are attached to numbers, effectively making them a unit, but visually separate.
// Simplified for UI: Linear slots. Logic parses them.
const slots = ref(Array(9).fill({ item: null }))

// Track available items locally to handle the drag-drop state
const availableCards = ref([])
const availableOps = ref([])

onMounted(() => {
  if (player.value) {
    // Filter out special cards (multiply/sqrt) — they modify ops/numbers, not placed in equation
    availableCards.value = player.value.hand.filter((c) => c.type === 'number' || c.type === 'sqrt')
    availableOps.value = [...player.value.ops]
  }
})

const onDragStart = (evt, index, source) => {
  evt.dataTransfer.setData('type', 'card')
  evt.dataTransfer.setData('index', index)
  evt.dataTransfer.setData('source', source)
}

const onOpDragStart = (evt, op, index) => {
  evt.dataTransfer.setData('type', 'op')
  evt.dataTransfer.setData('val', op)
  evt.dataTransfer.setData('index', index)
}

// Helper: Return an item to the correct available list
const returnItemToHand = (item) => {
  if (!item) return
  if (item.type === 'op') {
    availableOps.value.push(item.value)
  } else {
    availableCards.value.push(item)
  }
}

const removeSlotItem = (index) => {
  const item = slots.value[index].item
  if (item) {
    returnItemToHand(item)
    slots.value[index] = { item: null }
  }
}

// Click to Add Logic
const addFromHand = (item, type, index) => {
  // Find target slot
  let targetIndex = -1

  // 1. Find the right-most filled slot
  let rightMostFilledIndex = -1
  for (let i = slots.value.length - 1; i >= 0; i--) {
    if (slots.value[i].item) {
      rightMostFilledIndex = i
      break
    }
  }

  if (rightMostFilledIndex === -1) {
    // No slots filled, go to first (0)
    targetIndex = 0
  } else {
    // Try next slot
    const nextSlot = rightMostFilledIndex + 1
    if (nextSlot < slots.value.length) {
      targetIndex = nextSlot
    } else {
      // Logic: "fill whichever empty slot there is from the left"
      targetIndex = slots.value.findIndex((s) => !s.item)
    }
  }

  // If we found a valid slot
  if (targetIndex !== -1) {
    // Remove from hand source
    if (type === 'card') {
      availableCards.value.splice(index, 1)
      slots.value[targetIndex] = { item: item }
    } else {
      availableOps.value.splice(index, 1)
      const opItem = { type: 'op', value: item, id: `op-${Math.random()}` }
      slots.value[targetIndex] = { item: opItem }
    }
  }
}

const onHandDrop = (evt) => {
  const source = evt.dataTransfer.getData('source')
  // Only handle items coming from the board slots
  if (source === 'board') {
    const index = evt.dataTransfer.getData('index')
    const item = slots.value[index].item
    if (item) {
      returnItemToHand(item)
      slots.value[index] = { item: null }
    }
  }
}

const onDrop = (evt, slotIndex) => {
  const type = evt.dataTransfer.getData('type')

  if (type === 'card') {
    const sourceIndex = evt.dataTransfer.getData('index')
    const source = evt.dataTransfer.getData('source')

    let card
    if (source === 'hand') {
      card = availableCards.value[sourceIndex]
      availableCards.value.splice(sourceIndex, 1)
    } else {
      // Moving from another slot
      card = slots.value[sourceIndex].item
      slots.value[sourceIndex] = { item: null }
    }

    // Swap if occupied
    if (slots.value[slotIndex].item) {
      returnItemToHand(slots.value[slotIndex].item)
    }
    slots.value[slotIndex] = { item: card }
  } else if (type === 'op') {
    const index = evt.dataTransfer.getData('index')
    const val = evt.dataTransfer.getData('val')

    // Create temp object for op to fit in card slot structure
    const opItem = { type: 'op', value: val, id: `op-${Math.random()}` }

    if (availableOps.value.includes(val)) {
      const idx = availableOps.value.indexOf(val)
      availableOps.value.splice(idx, 1)
    }

    if (slots.value[slotIndex].item) {
      // Return existing to pile
      returnItemToHand(slots.value[slotIndex].item)
    }

    slots.value[slotIndex] = { item: opItem }
  }
}

// Validation: ALL cards and ALL operators must be used.
const isValid = computed(() => {
  return availableCards.value.length === 0 && availableOps.value.length === 0
})

const divisionByZeroError = ref(false)

const calculateResult = () => {
  divisionByZeroError.value = false
  try {
    let str = ''
    let pendingSqrt = false

    slots.value.forEach((s) => {
      if (!s.item) return
      if (s.item.type === 'sqrt') pendingSqrt = true
      else if (s.item.type === 'number') {
        let val = s.item.value
        if (pendingSqrt) {
          val = Math.sqrt(val)
          pendingSqrt = false
        }
        str += val.toString()
      } else if (s.item.type === 'op') {
        const op = s.item.value === '×' ? '*' : s.item.value === '÷' ? '/' : s.item.value
        str += ` ${op} `
      }
    })

    if (!str.trim()) return null

    // Check for trailing operator or partial equation issues implicitly by catch
    // But specific check for division by zero before eval if possible?
    // Actually, eval/Function will return Infinity for 1/0

    const result = new Function('return ' + str)()

    if (!isFinite(result) || isNaN(result)) {
      // Check if it's explicitly division by zero or just bad syntax (like "1 +")
      // Simple heuristic: if we have full equation but result is NaN/Inf
      if (!isFinite(result)) divisionByZeroError.value = true
      return null
    }
    return result
  } catch (e) {
    return null
  }
}

const previewResult = computed(() => calculateResult())
const isReadyToSubmit = computed(
  () => isValid.value && previewResult.value !== null && !divisionByZeroError.value,
)

const declare = (target) => {
  if (!isReadyToSubmit.value) return
  const res = previewResult.value

  // Build a human-readable equation string from the slots
  let eqStr = ''
  slots.value.forEach((s) => {
    if (!s.item) return
    if (s.item.type === 'number') eqStr += s.item.value
    else if (s.item.type === 'sqrt') eqStr += '√'
    else if (s.item.type === 'op') eqStr += ` ${s.item.value} `
  })
  player.value.equationStr = eqStr.trim()
  game.submitEquation(0, target, res)
}

// §11: Swing bet flow
const swingPhase = ref(null) // null | 'low' | 'high'
const savedLowResult = ref(null)
const savedLowEqStr = ref('')

const startSwing = () => {
  swingPhase.value = 'low'
}

const cancelSwing = () => {
  swingPhase.value = null
  savedLowResult.value = null
  savedLowEqStr.value = ''
  resetSlots()
}

const confirmSwingLow = () => {
  if (!isReadyToSubmit.value) return
  const res = previewResult.value

  let eqStr = ''
  slots.value.forEach((s) => {
    if (!s.item) return
    if (s.item.type === 'number') eqStr += s.item.value
    else if (s.item.type === 'sqrt') eqStr += '√'
    else if (s.item.type === 'op') eqStr += ` ${s.item.value} `
  })
  savedLowResult.value = res
  savedLowEqStr.value = eqStr.trim()
  swingPhase.value = 'high'
  resetSlots()
}

const confirmSwingHigh = () => {
  if (!isReadyToSubmit.value) return
  const res = previewResult.value

  let eqStr = ''
  slots.value.forEach((s) => {
    if (!s.item) return
    if (s.item.type === 'number') eqStr += s.item.value
    else if (s.item.type === 'sqrt') eqStr += '√'
    else if (s.item.type === 'op') eqStr += ` ${s.item.value} `
  })
  player.value.lowEqStr = savedLowEqStr.value
  player.value.highEqStr = eqStr.trim()
  player.value.equationStr = `L: ${savedLowEqStr.value} | H: ${eqStr.trim()}`
  game.submitEquation(0, 'SWING', savedLowResult.value, res)
}

const resetSlots = () => {
  slots.value = Array(9)
    .fill(null)
    .map(() => ({ item: null }))
  // Restore all cards and ops from the player's hand
  if (player.value) {
    availableCards.value = player.value.hand.filter((c) => c.type === 'number' || c.type === 'sqrt')
    availableOps.value = [...player.value.ops]
  }
}
</script>
