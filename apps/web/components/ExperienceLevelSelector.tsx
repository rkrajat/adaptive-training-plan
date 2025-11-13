import type { ExperienceLevel } from '@adaptive-training-plan/types';
import { cn } from '@/lib/utils';

export interface ExperienceLevelSelectorProps {
  value?: ExperienceLevel;
  onChange: (value: ExperienceLevel) => void;
  disabled?: boolean;
  required?: boolean;
}

const EXPERIENCE_LEVELS: Array<{
  value: ExperienceLevel;
  label: string;
  description: string;
}> = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to running or training plans',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Some running experience with structured training',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Experienced runner with multiple races',
  },
];

export const ExperienceLevelSelector = ({
  value,
  onChange,
  disabled = false,
  required = false,
}: ExperienceLevelSelectorProps) => {
  return (
    <div className="space-y-2" role="radiogroup" aria-required={required}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${level.label}: ${level.description}`}
              disabled={disabled}
              onClick={() => onChange(level.value)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-input bg-background'
              )}
            >
              <span className="font-medium">{level.label}</span>
              <span className="text-sm text-muted-foreground">
                {level.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
