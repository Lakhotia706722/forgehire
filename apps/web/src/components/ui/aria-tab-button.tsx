'use client';

import * as React from 'react';

type AriaNavButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  current: boolean;
};

/** Nav section button with literal aria-current for static accessibility analyzers. */
export const AriaNavButton = React.forwardRef<HTMLButtonElement, AriaNavButtonProps>(
  function AriaNavButton({ current, className, children, ...props }, ref) {
    if (current) {
      return (
        <button type="button" ref={ref} aria-current="page" className={className} {...props}>
          {children}
        </button>
      );
    }

    return (
      <button type="button" ref={ref} className={className} {...props}>
        {children}
      </button>
    );
  },
);

type AriaSwitchProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role' | 'aria-checked'> & {
  checked: boolean;
};

/** Switch with literal aria-checked for static accessibility analyzers. */
export function AriaSwitch({ checked, className, children, ...props }: AriaSwitchProps) {
  if (checked) {
    return (
      <button type="button" role="switch" aria-checked="true" className={className} {...props}>
        {children}
      </button>
    );
  }

  return (
    <button type="button" role="switch" aria-checked="false" className={className} {...props}>
      {children}
    </button>
  );
}

type AriaToggleButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed: boolean;
};

/** Toggle button with literal aria-pressed for static accessibility analyzers. */
export function AriaToggleButton({ pressed, className, children, ...props }: AriaToggleButtonProps) {
  if (pressed) {
    return (
      <button type="button" aria-pressed="true" className={className} {...props}>
        {children}
      </button>
    );
  }

  return (
    <button type="button" aria-pressed="false" className={className} {...props}>
      {children}
    </button>
  );
}

type AriaDisclosureButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-expanded' | 'aria-controls'
> & {
  expanded: boolean;
};

/** Disclosure toggle with literal aria-expanded (no aria-controls — set on a fixed-id variant if needed). */
export function AriaDisclosureButton({
  expanded,
  className,
  children,
  ...props
}: AriaDisclosureButtonProps) {
  if (expanded) {
    return (
      <button type="button" aria-expanded="true" className={className} {...props}>
        {children}
      </button>
    );
  }

  return (
    <button type="button" aria-expanded="false" className={className} {...props}>
      {children}
    </button>
  );
}

type AriaRadioProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role' | 'aria-checked'> & {
  checked: boolean;
};

/** Radio button with literal aria-checked for static accessibility analyzers. */
export function AriaRadio({ checked, className, children, ...props }: AriaRadioProps) {
  if (checked) {
    return (
      <button type="button" role="radio" aria-checked="true" className={className} {...props}>
        {children}
      </button>
    );
  }

  return (
    <button type="button" role="radio" aria-checked="false" className={className} {...props}>
      {children}
    </button>
  );
}

type AriaCheckboxProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role' | 'aria-checked'> & {
  checked: boolean;
};

/** Checkbox button with literal aria-checked for static accessibility analyzers. */
export function AriaCheckbox({ checked, className, children, ...props }: AriaCheckboxProps) {
  if (checked) {
    return (
      <button type="button" role="checkbox" aria-checked="true" className={className} {...props}>
        {children}
      </button>
    );
  }

  return (
    <button type="button" role="checkbox" aria-checked="false" className={className} {...props}>
      {children}
    </button>
  );
}

type FilterSidebarToggleProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-expanded'
> & {
  expanded: boolean;
};

/** Mobile filter toggle for engineer bounties (pairs with #filter-sidebar via proximity). */
export function FilterSidebarToggle({
  expanded,
  className,
  children,
  ...props
}: FilterSidebarToggleProps) {
  if (expanded) {
    return (
      <button type="button" aria-expanded="true" className={className} {...props}>
        {children}
      </button>
    );
  }

  return (
    <button type="button" aria-expanded="false" className={className} {...props}>
      {children}
    </button>
  );
}
