import { Fieldset } from "@base-ui/react/fieldset";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./FormFieldset.module.scss";

interface Props extends Omit<ComponentProps<typeof Fieldset.Root>, "children"> {
  children: ReactNode;
  legend: ReactNode;
  isCompact?: boolean;
  isLegendVisuallyHidden?: boolean;
}

export function FormFieldset({
  children,
  className,
  legend,
  isCompact = false,
  isLegendVisuallyHidden = false,
  ...rest
}: Props) {
  return (
    <Fieldset.Root
      className={(state) =>
        cn(styles.root, typeof className === "function" ? className(state) : className, {
          [styles.isCompact]: isCompact,
        })
      }
      {...rest}
    >
      <Fieldset.Legend
        className={cn(styles.legend, {
          [styles.visuallyHidden]: isLegendVisuallyHidden,
        })}
      >
        {legend}
      </Fieldset.Legend>
      {children}
    </Fieldset.Root>
  );
}
