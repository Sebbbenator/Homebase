import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-orange-600 hover:bg-orange-500 text-white focus:ring-orange-500': variant === 'primary',
            'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 focus:ring-neutral-500': variant === 'secondary',
            'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 focus:ring-neutral-500': variant === 'ghost',
            'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 focus:ring-red-500': variant === 'danger',
          },
          {
            'text-xs px-3 py-1.5 gap-1.5': size === 'sm',
            'text-sm px-4 py-2.5 gap-2': size === 'md',
            'text-base px-5 py-3 gap-2': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
