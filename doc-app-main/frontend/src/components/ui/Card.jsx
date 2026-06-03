import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Card = ({ children, className, hover = true, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    whileHover={hover ? { y: -4, boxShadow: '0 10px 30px rgba(0, 105, 192, 0.14)' } : {}}
    className={cn(
      'bg-white rounded-medical-lg border border-slate-100 shadow-medical p-6',
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

export default Card;
