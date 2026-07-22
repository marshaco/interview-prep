import { StackPushPopFigure } from './StackPushPopFigure';
import type { InteractiveFigureBinding } from '../../../content/types';

interface InteractiveFigureProps {
  binding: InteractiveFigureBinding;
}

/** Renderer selector for lesson interactive figures — see InteractiveFigureBinding. */
export function InteractiveFigure({ binding }: InteractiveFigureProps) {
  switch (binding.kind) {
    case 'stack_push_pop':
      return <StackPushPopFigure />;
  }
}
