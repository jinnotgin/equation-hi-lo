const DEFAULT_FULL_STYLE = 'bg-slate-600 border-slate-400 text-white'
const DEFAULT_MINI_STYLE = 'bg-slate-600 text-white'

const FULL_STYLE_BY_OPERATOR = {
  '+': 'bg-emerald-700 border-emerald-500 text-white',
  '-': 'bg-rose-700 border-rose-500 text-white',
  '÷': 'bg-sky-700 border-sky-500 text-white',
  '×': 'bg-amber-600 border-amber-400 text-black',
}

const MINI_STYLE_BY_OPERATOR = {
  '+': 'bg-emerald-700 text-white',
  '-': 'bg-rose-700 text-white',
  '÷': 'bg-sky-700 text-white',
  '×': 'bg-amber-600 text-black',
}

export const getOperatorStyle = (op) => FULL_STYLE_BY_OPERATOR[op] || DEFAULT_FULL_STYLE

export const getOperatorMiniStyle = (op) => MINI_STYLE_BY_OPERATOR[op] || DEFAULT_MINI_STYLE
