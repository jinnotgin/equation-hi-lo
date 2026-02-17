<template>
  <div
    class="w-full mx-auto rounded-xl border border-slate-700 bg-slate-900/90 shadow-2xl backdrop-blur-sm"
    :class="mobile ? 'max-w-5xl p-3 sm:p-4' : 'max-w-4xl mt-4 p-5'"
  >
    <div class="flex items-center justify-between mb-3" :class="mobile ? 'gap-2' : ''">
      <h2
        class="text-gold font-bold tracking-wider uppercase"
        :class="mobile ? 'text-base' : 'text-xl'"
      >
        Build Your Equation
      </h2>
      <button
        v-if="hasAnySlotFilled"
        @click="resetSlots()"
        class="flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 hover:bg-rose-900/80 text-slate-300 hover:text-rose-100 border border-slate-600 hover:border-rose-500 transition-all"
        :class="mobile ? 'px-3 py-2 text-[11px]' : 'px-3 py-1 text-xs'"
      >
        <span class="text-sm">✕</span> Clear All
      </button>
    </div>

    <div class="mb-2 flex items-center justify-between px-1">
      <p class="text-emerald-200 text-xs font-bold uppercase tracking-[0.16em]">
        {{ mobile ? 'Tap cards to fill equation' : 'Drop Equation Here' }}
      </p>
      <p
        v-if="mobile && selectedItem"
        class="text-[10px] uppercase tracking-wide text-gold font-bold text-right"
      >
        {{ selectedItemHint }}
      </p>
    </div>

    <div
      class="p-3 bg-felt-dark/70 border-2 border-emerald-800/70 rounded-xl shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]"
      :class="mobile ? 'overflow-x-auto min-h-[88px]' : 'min-h-[120px]'"
    >
      <div :class="mobile ? 'flex gap-2 min-w-max' : 'flex items-center gap-2 justify-center flex-wrap'">
        <div
          v-for="(slot, index) in slots"
          :key="index"
          class="border-2 border-dashed rounded-lg flex items-center justify-center relative bg-slate-800/80 group transition-colors"
          :class="[
            mobile ? 'w-12 h-16 shrink-0' : 'w-16 h-24',
            isSlotSelected(index) ? 'border-gold ring-2 ring-gold/40' : 'border-slate-400 hover:border-gold/60',
          ]"
          @click="handleSlotTap(index)"
          @dragover.prevent="onSlotDragOver"
          @drop="onDrop($event, index)"
        >
          <span v-if="!slot.item" class="text-slate-500 font-medium" :class="mobile ? 'text-[10px]' : 'text-xs'"
            >{{ mobile ? index + 1 : `Slot ${index + 1}` }}</span
          >

          <div
            v-else-if="slot.item.type === 'op'"
            class="rounded flex items-center justify-center cursor-move font-bold border-2 relative"
            :class="[mobile ? 'w-12 h-16 text-xl' : 'w-16 h-24 text-2xl', opColor(slot.item.value)]"
            :draggable="!mobile"
            @dragstart="onDragStart($event, index, 'board')"
          >
            {{ slot.item.value }}
          </div>

          <div
            v-else
            class="cursor-move relative"
            :draggable="!mobile"
            @dragstart="onDragStart($event, index, 'board')"
          >
            <Card :card="slot.item" :isFaceDown="false" :compact="mobile" />
          </div>

          <button
            v-if="slot.item"
            @click.stop="removeSlotItem(index)"
            class="absolute -top-2 -right-2 bg-rose-700 text-white rounded-full flex items-center justify-center font-bold transition-opacity shadow-md z-10 hover:bg-rose-600 border border-rose-400/70"
            :class="[
              mobile ? 'w-6 h-6 text-sm opacity-100' : 'w-5 h-5 text-xs opacity-0 group-hover:opacity-100',
            ]"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div class="text-center mt-3 font-mono min-h-6 transition-colors duration-300 relative">
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
      <div v-else class="text-amber-300 text-sm">
        Place all cards ({{ availableCards.length }} left) and operators ({{ availableOps.length }}
        left)
      </div>
    </div>

    <div class="mt-4 mb-2 px-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
      Your Hand
    </div>
    <div
      class="min-h-[6rem] p-3 rounded-xl bg-slate-900/50 border-2 border-dashed border-slate-700 transition-colors"
      :class="mobile ? 'overflow-x-auto' : ''"
      @dragover.prevent="onHandDragOver"
      @drop="onHandDrop($event)"
    >
      <div
        v-if="isHandEmpty"
        class="w-full text-center text-sm font-semibold tracking-wide text-slate-500 flex items-center justify-center min-h-[4rem]"
      >
        Hand empty. All cards are in play.
      </div>

      <div
        v-else
        :class="
          mobile
            ? 'flex gap-2 min-w-max items-center'
            : 'flex gap-2 justify-center flex-wrap items-start w-full'
        "
      >
        <div
          v-for="(card, i) in availableCards"
          :key="card.id"
          class="cursor-move transition-transform"
          :class="[
            mobile ? '' : 'hover:-translate-y-1',
          ]"
          @click="onHandItemTap('card', i, card)"
        >
          <Card
            :card="card"
            :isFaceDown="false"
            :compact="mobile"
            :draggable="!mobile"
            @dragstart="onDragStart($event, i, 'hand')"
          />
        </div>

        <div
          v-for="(op, i) in availableOps"
          :key="'op' + i"
          class="rounded-lg flex items-center justify-center cursor-move font-bold border-2 transition-transform shadow-md"
          :class="[
            mobile ? 'w-12 h-16 text-xl' : 'w-16 h-24 text-2xl hover:-translate-y-1',
            opColor(op),
          ]"
          :draggable="!mobile"
          @dragstart="onOpDragStart($event, op, i)"
          @click="onHandItemTap('op', i, op)"
        >
          {{ op }}
        </div>
      </div>
    </div>

    <div
      v-if="swingPhase"
      class="text-center mt-3 font-bold tracking-wide"
      :class="[mobile ? 'text-base' : 'text-lg', swingPhase === 'low' ? 'text-blue-400' : 'text-red-400']"
    >
      🎯 SWING — Build your
      {{ swingPhase === 'low' ? 'LOW (target 1)' : 'HIGH (target 20)' }} equation
    </div>

    <div
      class="mt-4"
      :class="mobile ? 'grid grid-cols-1 gap-2' : 'flex justify-center gap-4 mt-6'"
    >
      <template v-if="!swingPhase">
        <button
          @click="startSwing()"
          class="bg-gold hover:bg-yellow-400 text-black border border-yellow-300 font-bold shadow-[0_0_16px_rgba(255,215,0,0.35)] transition-all"
          :class="mobile ? 'w-full min-h-11 px-4 py-2.5 rounded-lg' : 'px-6 py-2.5 rounded-full hover:scale-105'"
        >
          🎯 Swing
        </button>
        <button
          @click="declare('HIGH')"
          :disabled="!isReadyToSubmit"
          class="bg-rose-700 hover:bg-rose-600 text-white border border-rose-400/70 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          :class="mobile ? 'w-full min-h-11 px-4 py-2.5 rounded-lg font-semibold' : 'px-6 py-2.5 rounded-full hover:scale-105'"
        >
          Target 20 (High)
        </button>
        <button
          @click="declare('LOW')"
          :disabled="!isReadyToSubmit"
          class="bg-blue-700 hover:bg-blue-600 text-white border border-blue-400/70 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          :class="mobile ? 'w-full min-h-11 px-4 py-2.5 rounded-lg font-semibold' : 'px-6 py-2.5 rounded-full hover:scale-105'"
        >
          Target 1 (Low)
        </button>
      </template>
      <template v-else-if="swingPhase === 'low'">
        <button
          @click="confirmSwingLow()"
          :disabled="!isReadyToSubmit"
          class="bg-blue-700 hover:bg-blue-600 text-white border border-blue-400/70 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          :class="mobile ? 'w-full min-h-11 px-4 py-2.5 rounded-lg font-semibold' : 'px-6 py-2.5 rounded-full hover:scale-105'"
        >
          Confirm Low Equation →
        </button>
        <button
          @click="cancelSwing()"
          class="bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 transition-colors"
          :class="mobile ? 'w-full min-h-11 px-4 py-2.5 rounded-lg font-semibold' : 'px-5 py-2.5 rounded-full'"
        >
          Cancel
        </button>
      </template>
      <template v-else-if="swingPhase === 'high'">
        <button
          @click="confirmSwingHigh()"
          :disabled="!isReadyToSubmit"
          class="bg-rose-700 hover:bg-rose-600 text-white border border-rose-400/70 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          :class="mobile ? 'w-full min-h-11 px-4 py-2.5 rounded-lg font-semibold' : 'px-6 py-2.5 rounded-full hover:scale-105'"
        >
          Submit Swing!
        </button>
        <button
          @click="cancelSwing()"
          class="bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 transition-colors"
          :class="mobile ? 'w-full min-h-11 px-4 py-2.5 rounded-lg font-semibold' : 'px-5 py-2.5 rounded-full'"
        >
          Cancel
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Card from './Card.vue'
import { useGameStore } from '../stores/game'

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false,
  },
})

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

const availableCards = ref([])
const availableOps = ref([])
const slots = ref([])
const selectedItem = ref(null)

const hasAnySlotFilled = computed(() => slots.value.some((s) => s.item !== null))
const selectedItemHint = computed(() => {
  if (!selectedItem.value) return ''
  return selectedItem.value.source === 'board' ? 'Slot selected' : ''
})

onMounted(() => {
  resetSlots()
})

watch(
  () => props.mobile,
  () => {
    clearSelection()
  },
)

const clearSelection = () => {
  selectedItem.value = null
}

const createOpItem = (op) => ({ type: 'op', value: op, id: `op-${Math.random()}` })

const resetSlots = () => {
  if (player.value) {
    availableCards.value = player.value.hand.filter((c) => c.type === 'number' || c.type === 'sqrt')
    availableOps.value = [...player.value.ops]
    const totalSlots = availableCards.value.length + availableOps.value.length
    slots.value = Array.from({ length: totalSlots }, () => ({ item: null }))
    clearSelection()
  }
}

const isSlotSelected = (index) => {
  if (!props.mobile || !selectedItem.value) return false
  return selectedItem.value.source === 'board' && selectedItem.value.index === index
}

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
  if (!item) return
  if (selectedItem.value?.source === 'board' && selectedItem.value.index === index) {
    clearSelection()
  }
  returnItemToHand(item)
  slots.value[index] = { item: null }
}

const addFromHand = (item, type, index) => {
  const targetIndex = slots.value.findIndex((s) => !s.item)
  if (targetIndex === -1) return

  if (type === 'card') {
    availableCards.value.splice(index, 1)
    slots.value[targetIndex] = { item }
    return
  }

  availableOps.value.splice(index, 1)
  slots.value[targetIndex] = { item: createOpItem(item) }
}

const onHandItemTap = (kind, index, item) => {
  addFromHand(item, kind, index)
  if (props.mobile) clearSelection()
}

const handleSlotTap = (slotIndex) => {
  if (!props.mobile) return

  const targetItem = slots.value[slotIndex].item

  if (!selectedItem.value) {
    if (!targetItem) return
    selectedItem.value = {
      source: 'board',
      kind: targetItem.type === 'op' ? 'op' : 'card',
      index: slotIndex,
    }
    return
  }

  if (selectedItem.value.source !== 'board') {
    clearSelection()
    return
  }

  const sourceIndex = selectedItem.value.index
  if (sourceIndex === slotIndex) {
    clearSelection()
    return
  }

  const movingItem = slots.value[sourceIndex].item
  if (!movingItem) {
    clearSelection()
    return
  }

  slots.value[sourceIndex] = { item: targetItem || null }
  slots.value[slotIndex] = { item: movingItem }
  clearSelection()
}

const onDragStart = (evt, index, source) => {
  if (props.mobile) return
  evt.dataTransfer.setData('type', 'card')
  evt.dataTransfer.setData('index', index)
  evt.dataTransfer.setData('source', source)
}

const onOpDragStart = (evt, op, index) => {
  if (props.mobile) return
  evt.dataTransfer.setData('type', 'op')
  evt.dataTransfer.setData('val', op)
  evt.dataTransfer.setData('index', index)
}

const onSlotDragOver = () => {
  if (props.mobile) return
}

const onHandDragOver = () => {
  if (props.mobile) return
}

const onHandDrop = (evt) => {
  if (props.mobile) return
  const source = evt.dataTransfer.getData('source')
  if (source !== 'board') return
  const index = Number(evt.dataTransfer.getData('index'))
  const item = slots.value[index]?.item
  if (!item) return
  returnItemToHand(item)
  slots.value[index] = { item: null }
}

const onDrop = (evt, slotIndex) => {
  if (props.mobile) return
  const type = evt.dataTransfer.getData('type')

  if (type === 'card') {
    const sourceIndex = Number(evt.dataTransfer.getData('index'))
    const source = evt.dataTransfer.getData('source')

    let card
    if (source === 'hand') {
      card = availableCards.value[sourceIndex]
      availableCards.value.splice(sourceIndex, 1)
    } else {
      card = slots.value[sourceIndex].item
      slots.value[sourceIndex] = { item: null }
    }

    if (slots.value[slotIndex].item) {
      returnItemToHand(slots.value[slotIndex].item)
    }
    slots.value[slotIndex] = { item: card }
    return
  }

  if (type === 'op') {
    const val = evt.dataTransfer.getData('val')
    const opItem = createOpItem(val)
    const idx = availableOps.value.indexOf(val)
    if (idx > -1) {
      availableOps.value.splice(idx, 1)
    }
    if (slots.value[slotIndex].item) {
      returnItemToHand(slots.value[slotIndex].item)
    }
    slots.value[slotIndex] = { item: opItem }
  }
}

const isValid = computed(() => availableCards.value.length === 0 && availableOps.value.length === 0)
const isHandEmpty = computed(() => isValid.value)

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

    const result = new Function('return ' + str)()
    if (!isFinite(result) || isNaN(result)) {
      if (!isFinite(result)) divisionByZeroError.value = true
      return null
    }
    return result
  } catch {
    return null
  }
}

const previewResult = computed(() => calculateResult())
const isReadyToSubmit = computed(
  () => isValid.value && previewResult.value !== null && !divisionByZeroError.value,
)

const buildEquationString = () => {
  let eqStr = ''
  slots.value.forEach((s) => {
    if (!s.item) return
    if (s.item.type === 'number') eqStr += s.item.value
    else if (s.item.type === 'sqrt') eqStr += '√'
    else if (s.item.type === 'op') eqStr += ` ${s.item.value} `
  })
  return eqStr.trim()
}

const declare = (target) => {
  if (!isReadyToSubmit.value) return
  const res = previewResult.value
  player.value.equationStr = buildEquationString()
  game.submitEquation(0, target, res)
}

const swingPhase = ref(null)
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
  savedLowResult.value = previewResult.value
  savedLowEqStr.value = buildEquationString()
  swingPhase.value = 'high'
  resetSlots()
}

const confirmSwingHigh = () => {
  if (!isReadyToSubmit.value) return
  const highResult = previewResult.value
  const highEq = buildEquationString()
  player.value.lowEqStr = savedLowEqStr.value
  player.value.highEqStr = highEq
  player.value.equationStr = `L: ${savedLowEqStr.value} | H: ${highEq}`
  game.submitEquation(0, 'SWING', savedLowResult.value, highResult)
}
</script>
