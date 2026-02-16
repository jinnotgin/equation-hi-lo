<template>
  <div v-if="logs.length" class="absolute bottom-4 left-4 z-20 flex flex-col items-start transition-all duration-300">
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
      <div v-for="(log, i) in logs" :key="i" class="mb-1 text-slate-300 border-b border-white/5 pb-0.5 last:border-0">
        <span class="opacity-40 mr-1 text-[10px]">{{ log.time }}</span>
        <span v-html="log.msg"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, watch, ref } from 'vue';
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();
const logs = computed(() => gameStore.actionLog);
const logContainer = ref(null);
const isCollapsed = ref(true);

watch(logs, async () => {
    await nextTick();
    if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
}, { deep: true });
</script>

<style scoped>
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.3); 
}
::-webkit-scrollbar-thumb {
  background: #555; 
  border-radius: 2px;
}
</style>
