import React from 'react';
import { Star } from 'lucide-react';
import { cn } from './utils';

interface RatingStarsProps {
  /**
   * Calificación actual (1-5)
   */
  rating: number;
  
  /**
   * Modo de visualización
   * - 'readonly': Solo lectura (mostrar estrellas)
   * - 'editable': Permite seleccionar calificación
   */
  mode?: 'readonly' | 'editable';
  
  /**
   * Callback cuando se selecciona una calificación (solo en modo editable)
   */
  onChange?: (rating: number) => void;
  
  /**
   * Tamaño de las estrellas
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Clases CSS adicionales
   */
  className?: string;
  
  /**
   * Mostrar número al lado de las estrellas
   */
  showNumber?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  mode = 'readonly',
  onChange,
  size = 'md',
  className,
  showNumber = false
}) => {
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  
  const handleClick = (selectedRating: number) => {
    if (mode === 'editable' && onChange) {
      onChange(selectedRating);
    }
  };
  
  const handleMouseEnter = (star: number) => {
    if (mode === 'editable') {
      setHoverRating(star);
    }
  };
  
  const handleMouseLeave = () => {
    if (mode === 'editable') {
      setHoverRating(0);
    }
  };
  
  const displayRating = hoverRating || rating;
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating;
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={mode === 'readonly'}
            className={cn(
              'transition-all duration-150',
              mode === 'editable' && 'cursor-pointer hover:scale-110',
              mode === 'readonly' && 'cursor-default'
            )}
            aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300',
                mode === 'editable' && hoverRating > 0 && star <= hoverRating && 'fill-yellow-300 text-yellow-300'
              )}
            />
          </button>
        );
      })}
      
      {showNumber && (
        <span className="ml-1 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
