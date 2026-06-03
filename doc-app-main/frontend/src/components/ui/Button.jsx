import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-medical-gradient text-white shadow-medical hover:shadow-medical-lg hover:-translate-y-0.5',
  secondary: 'bg-white text-medical-600 border-2 border-medical-200 hover:border-medical-400 hover:bg-medical-50',
  ghost: 'text-medical-600 hover:bg-medical-50',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-medical',
  lg: 'px-7 py-3 text-base rounded-medical-lg',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  type = 'button',
  onClick,
  ...props
}) => (
  <motion.button
    type={type}
    whileTap={{ scale: 0.98 }}
    whileHover={disabled ? {} : { scale: 1.02 }}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant],
      sizes[size],
      className
    )}
    disabled={disabled}
    onClick={onClick}
    {...props}
  >
    {children}
  </motion.button>
);

export default Button;
