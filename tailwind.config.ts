import type { Config } from 'tailwindcss'

const variants = ['hover', 'focus', 'focus-within', 'focus-visible', 'active', 'disabled', 'checked', 'group-hover', 'group-focus', 'peer-checked', 'dark', 'sm', 'md', 'lg', 'xl', '2xl', 'motion-safe', 'motion-reduce', 'print', 'portrait', 'landscape']

export default {
  content: ['./src/**/*.{html,vue,tsx,jsx}'],
  safelist: [
    { pattern: /^(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/, variants },
    { pattern: /^(bg|text|border)/, variants },
    { pattern: /^(p|m|px|py|mx|my|pt|pr|pb|pl|mt|mr|mb|ml)-/, variants },
    { pattern: /^(gap|space-[xy])-/, variants },
    { pattern: /^(w|h|min-w|min-h|max-w|max-h)-/, variants },
    { pattern: /^(flex|grid|basis|order|col|row)-/, variants },
    { pattern: /^(justify|items|content|self)-(start|end|center|between|around|evenly|stretch|baseline|auto|normal)/, variants },
    { pattern: /^(text|font|leading|tracking|indent|align)-(left|center|right|justify|start|end|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/, variants },
    { pattern: /^(rounded|shadow|opacity|blur|backdrop-blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|drop-shadow|backdrop-brightness|backdrop-contrast|backdrop-grayscale|backdrop-hue-rotate|backdrop-invert|backdrop-saturate|backdrop-sepia)/, variants },
    { pattern: /^(transition|duration|ease|delay|animate|scale|rotate|translate|skew|origin)/, variants },
    { pattern: /^(cursor|select|pointer-events|resize|scroll|overflow|z|divide|outline|ring|appearance|whitespace|break|truncate|line-clamp|list|decoration|underline|line-through|no-underline|uppercase|lowercase|capitalize|normal-case|italic|not-italic|antialiased|subpixel-antialiased)/, variants },
    { pattern: /^(absolute|relative|fixed|sticky|static|visible|invisible|object|float|clear|block|inline|inline-block|inline-flex|table|table-cell|table-row|hidden)/, variants },
  ],
} satisfies Config
