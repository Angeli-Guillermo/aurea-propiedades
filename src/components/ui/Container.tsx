import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  /** `wide` para composiciones editoriales, `narrow` para bloques de texto. */
  size?: 'narrow' | 'default' | 'wide';
  as?: ElementType;
}

const SIZES: Record<NonNullable<ContainerProps['size']>, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-[86rem]',
};

/** Ancho máximo y gutters consistentes en toda la página. */
export function Container({
  children,
  className,
  size = 'default',
  as: Tag = 'div',
}: ContainerProps) {
  return (
    <Tag className={cn('mx-auto w-full px-5 sm:px-8 lg:px-12', SIZES[size], className)}>
      {children}
    </Tag>
  );
}
