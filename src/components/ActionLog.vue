<template>
  <div
    v-if="logs.length"
    class="flex flex-col items-start transition-all duration-300 pointer-events-auto"
  >
    <!-- Header / Toggle -->
    <button
      @click="isCollapsed = !isCollapsed"
      class="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-t-lg px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
      :class="isCollapsed ? 'rounded-lg border-b' : 'border-b-0'"
    >
      <span>📜 Action Log</span>
      <span class="text-[10px]">{{ isCollapsed ? '▲' : '▼' }}</span>
    </button>

    <!-- Log Content -->
    <div
      v-show="!isCollapsed"
      class="w-80 h-48 bg-black/80 border border-slate-600 rounded-b-lg rounded-tr-lg p-2 overflow-y-auto text-xs font-mono shadow-xl backdrop-blur-sm"
      ref="logContainer"
    >
      <div
        v-for="(log, i) in logs"
        :key="i"
        class="mb-1 text-slate-300 border-b border-white/5 pb-0.5 last:border-0"
      >
        <span class="opacity-40 mr-1 text-[10px]">{{ log.time }}</span>
        <span :class="logMessageClass(log)">{{ renderMessage(log) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, watch, ref } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()
const logs = computed(() => gameStore.actionLog)
const logContainer = ref(null)
const isCollapsed = ref(true)

const renderMessage = (log) => {
  if (!log) return ''

  if (log.type === 'ROUND_START') return `Round ${log.round}`
  if (log.type === 'PLAYER_ACTION') {
    if (!log.actorName) return log.text || ''
    if (log.action === 'raise') return `${log.actorName} raised $${log.amount}.`
    if (log.action === 'call') return `${log.actorName} called $${log.amount}.`
    if (log.action === 'check') return `${log.actorName} checked.`
    if (log.action === 'fold') return `${log.actorName} folded.`
  }

  return log.text || ''
}

const logMessageClass = (log) => {
  if (log?.type === 'ROUND_START') return 'font-bold text-gold'
  if (log?.type === 'ROUND_RESULT') return 'font-semibold text-amber-300'
  return ''
}

watch(
  logs,
  async () => {
    await nextTick()
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  },
  { deep: true },
)

watch(isCollapsed, async (val) => {
  if (!val) {
    await nextTick()
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  }
})
</script>

<style scoped>
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}
::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 2px;
}
</style>
