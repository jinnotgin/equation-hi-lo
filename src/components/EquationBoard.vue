<template>
  <div
    class="w-full max-w-4xl mx-auto mt-4 rounded-xl border border-slate-700 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-sm"
  >
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-gold text-xl font-bold tracking-wider uppercase">Build Your Equation</h2>
      <button
        v-if="hasAnySlotFilled"
        @click="resetSlots()"
        class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-rose-900/80 text-slate-300 hover:text-rose-100 border border-slate-600 hover:border-rose-500 transition-all"
      >
        <span class="text-sm">✕</span> Clear All
      </button>
    </div>

    <!-- Drop Zone -->
    <div class="mb-2 flex items-center justify-between px-1">
      <p class="text-emerald-200 text-xs font-bold uppercase tracking-[0.16em]">
        Drop Equation Here
      </p>
    </div>
    <div
      class="flex items-center gap-2 p-4 bg-felt-dark/70 border-2 border-emerald-800/70 rounded-xl min-h-[120px] justify-center flex-wrap shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]"
    >
      <div
        v-for="(slot, index) in slots"
        :key="index"
        class="w-16 h-24 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center relative bg-slate-800/80 group transition-colors hover:border-gold/60"
        @dragover.prevent
        @drop="onDrop($event, index)"
      >
        <span v-if="!slot.item" class="text-slate-500 text-xs font-medium"
          >Slot {{ index + 1 }}</span
        >

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
          class="absolute -top-2 -right-2 bg-rose-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:bg-rose-600 border border-rose-400/70"
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Result Preview & Validation Feedback -->
    <div class="text-center mt-3 font-mono h-6 transition-colors duration-300 relative">
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
      <div v-else class="text-amber-300">
        Place all cards ({{ availableCards.length }} left) and operators ({{ availableOps.length }}
        left)
      </div>
    </div>

    <!-- Hand (Source) -->
    <div class="mt-4 mb-2 px-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
      Your Hand
    </div>
    <div
      class="flex gap-2 justify-center flex-wrap min-h-[6rem] p-4 rounded-xl bg-slate-900/50 border-2 border-dashed border-slate-700 transition-colors"
      :class="{ 'items-center content-center': isHandEmpty }"
      @dragover.prevent
      @drop="onHandDrop($event)"
    >
      <div
        v-if="isHandEmpty"
        class="w-full text-center text-sm font-semibold tracking-wide text-slate-500"
      >
        Hand empty. All cards are in play.
      </div>
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
        class="w-16 h-24 rounded-lg flex items-center justify-center cursor-move text-2xl font-bold border-2 hover:-translate-y-1 transition-transform shadow-md"
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
      class="text-center mt-3 text-lg font-bold tracking-wide"
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
          class="bg-blue-700 hover:bg-blue-600 text-white px-6 py-2.5 rounded-full border border-blue-400/70 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
        >
          Target 1 (Low)
        </button>
        <button
          @click="declare('HIGH')"
          :disabled="!isReadyToSubmit"
          class="bg-rose-700 hover:bg-rose-600 text-white px-6 py-2.5 rounded-full border border-rose-400/70 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
        >
          Target 20 (High)
        </button>
        <button
          @click="startSwing()"
          class="bg-gold hover:bg-yellow-400 text-black px-6 py-2.5 rounded-full border border-yellow-300 font-bold shadow-[0_0_16px_rgba(255,215,0,0.35)] transition-all hover:scale-105"
        >
          🎯 Swing
        </button>
      </template>
      <template v-else-if="swingPhase === 'low'">
        <button
          @click="confirmSwingLow()"
          :disabled="!isReadyToSubmit"
          class="bg-blue-700 hover:bg-blue-600 text-white px-6 py-2.5 rounded-full border border-blue-400/70 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
        >
          Confirm Low Equation →
        </button>
        <button
          @click="cancelSwing()"
          class="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-full border border-slate-500 transition-colors"
        >
          Cancel
        </button>
      </template>
      <template v-else-if="swingPhase === 'high'">
        <button
          @click="confirmSwingHigh()"
          :disabled="!isReadyToSubmit"
          class="bg-rose-700 hover:bg-rose-600 text-white px-6 py-2.5 rounded-full border border-rose-400/70 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
        >
          Submit Swing!
        </button>
        <button
          @click="cancelSwing()"
          class="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-full border border-slate-500 transition-colors"
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
import { evaluateEquation } from '../utils/equationEvaluator'
import { getOperatorStyle } from '../utils/operatorStyle'

const opColor = getOperatorStyle

const game = useGameStore()
const player = computed(() => game.players[0])

// Track available items locally to handle the drag-drop state
const availableCards = ref([])
const availableOps = ref([])

// Slots are dynamically sized to match cards + operators
const slots = ref([])

const hasAnySlotFilled = computed(() => slots.value.some((s) => s.item !== null))

onMounted(() => {
  if (player.value) {
    // Filter out special cards (multiply/sqrt) — they modify ops/numbers, not placed in equation
    availableCards.value = player.value.hand.filter((c) => c.type === 'number' || c.type === 'sqrt')
    availableOps.value = [...player.value.ops]
    // Total slots = number of playable cards + number of operators
    const totalSlots = availableCards.value.length + availableOps.value.length
    slots.value = Array.from({ length: totalSlots }, () => ({ item: null }))
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
  // Find the leftmost empty slot
  const targetIndex = slots.value.findIndex((s) => !s.item)

  // If we found a valid slot
  if (targetIndex !== -1) {
    // Remove from hand source
    if (type === 'card') {
      availableCards.value.splice(index, 1)
      slots.value[targetIndex] = { item: item }
    } else {
      availableOps.value.splice(index, 1)
      const opItem = { type: 'op', value: item }
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
    const val = evt.dataTransfer.getData('val')

    // Create temp object for op to fit in card slot structure
    const opItem = { type: 'op', value: val }

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
const isHandEmpty = computed(() => isValid.value)

const divisionByZeroError = ref(false)

const buildEquationTokens = () => {
  const tokens = []

  slots.value.forEach((slot) => {
    if (!slot.item) return
    if (slot.item.type === 'number') {
      tokens.push({ type: 'number', value: slot.item.value })
    } else if (slot.item.type === 'sqrt') {
      tokens.push({ type: 'sqrt' })
    } else if (slot.item.type === 'op') {
      tokens.push({ type: 'op', value: slot.item.value })
    }
  })

  return tokens
}

const calculateResult = () => {
  divisionByZeroError.value = false
  const tokens = buildEquationTokens()
  if (tokens.length === 0) return null

  const evaluation = evaluateEquation(tokens)
  if (!evaluation.valid) {
    divisionByZeroError.value = evaluation.error === 'DIV_ZERO'
    return null
  }

  return evaluation.result
}

const previewResult = computed(() => calculateResult())
const isReadyToSubmit = computed(
  () => isValid.value && previewResult.value !== null && !divisionByZeroError.value,
)

const buildEquationString = () => {
  let eqStr = ''
  slots.value.forEach((slot) => {
    if (!slot.item) return
    if (slot.item.type === 'number') eqStr += slot.item.value
    else if (slot.item.type === 'sqrt') eqStr += '√'
    else if (slot.item.type === 'op') eqStr += ` ${slot.item.value} `
  })
  return eqStr.trim()
}

const declare = (target) => {
  if (!isReadyToSubmit.value) return
  const res = previewResult.value

  player.value.equationStr = buildEquationString()
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

  savedLowResult.value = res
  savedLowEqStr.value = buildEquationString()
  swingPhase.value = 'high'
  resetSlots()
}

const confirmSwingHigh = () => {
  if (!isReadyToSubmit.value) return
  const res = previewResult.value

  const eqStr = buildEquationString()
  player.value.lowEqStr = savedLowEqStr.value
  player.value.highEqStr = eqStr
  player.value.equationStr = `L: ${savedLowEqStr.value} | H: ${eqStr}`
  game.submitEquation(0, 'SWING', savedLowResult.value, res)
}

const resetSlots = () => {
  // Restore all cards and ops from the player's hand
  if (player.value) {
    availableCards.value = player.value.hand.filter((c) => c.type === 'number' || c.type === 'sqrt')
    availableOps.value = [...player.value.ops]
    const totalSlots = availableCards.value.length + availableOps.value.length
    slots.value = Array.from({ length: totalSlots }, () => ({ item: null }))
  }
}
</script>
