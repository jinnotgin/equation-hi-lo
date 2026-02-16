<template>
  <div
    class="rounded-lg border-2 flex items-center justify-center shadow-md select-none relative overflow-hidden transition-all duration-300"
    :class="[
      compact ? 'w-10 h-14' : 'w-16 h-24',
      isFaceDown ? 'card-back border-gold' : 'bg-slate-100 border-slate-300',
      type === 'sqrt' ? 'text-purple-700' : '',
      type === 'multiply' ? 'text-blue-700' : '',
    ]"
  >
    <!-- Back of Card -->
    <div v-if="isFaceDown" class="w-full h-full flex items-center justify-center relative">
      <div class="card-back-pattern absolute inset-0 opacity-50"></div>
      <div
        :class="compact ? 'text-xl' : 'text-3xl'"
        class="text-gold font-bold relative z-10 drop-shadow-lg"
      >
        ?
      </div>
    </div>

    <!-- Front of Card -->
    <div v-else class="flex flex-col items-center">
      <span
        :class="[suitColor, compact ? 'text-xl leading-none' : 'text-xl font-bold font-mono']"
        class="font-bold"
      >
        {{ displayValue }}
      </span>
      <span
        v-if="type === 'number' && !compact"
        class="text-xs uppercase font-bold opacity-60"
        :class="suitColor"
      >
        {{ suit }}
      </span>
      <!-- Compact Suit Indicator (Small Dot/Icon) -->
      <span
        v-if="type === 'number' && compact"
        :class="suitColor"
        class="text-[8px] leading-none opacity-80"
      >
        {{ suit ? suit.charAt(0).toUpperCase() : '' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: Object,
  isFaceDown: Boolean,
  compact: Boolean,
})

const type = computed(() => props.card?.type)
const displayValue = computed(() => props.card?.value)
const suit = computed(() => props.card?.suit)

const suitColor = computed(() => {
  if (suit.value === 'gold') return 'text-yellow-600'
  if (suit.value === 'silver') return 'text-gray-500'
  if (suit.value === 'bronze') return 'text-orange-700'
  return 'text-black'
})
</script>

<style scoped>
.card-back {
  background: linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%);
}
.card-back-pattern {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(255, 215, 0, 0.12) 4px,
    rgba(255, 215, 0, 0.12) 5px
  );
}
</style>
