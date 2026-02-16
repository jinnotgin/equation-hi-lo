<template>
  <div
    class="relative inline-flex items-center"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="toggle"
    v-click-outside="close"
  >
    <slot></slot>

    <div
      v-if="isVisible"
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap z-50 pointer-events-none"
    >
      {{ text }}
      <!-- Little triangle arrow -->
      <div
        class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameTooltip',
}
</script>

<script setup>
import { ref, computed } from 'vue'

defineProps({
  text: {
    type: String,
    required: true,
  },
})

const isHovered = ref(false)
const isClicked = ref(false)

const isVisible = computed(() => isHovered.value || isClicked.value)

function toggle() {
  isClicked.value = !isClicked.value
}

function close() {
  isClicked.value = false
}

// Simple click-outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function (event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event, el)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  },
}
</script>
