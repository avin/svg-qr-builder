import { Slider } from "@base-ui/react/slider";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./SliderControl.module.scss";

interface Props {
  children?: ReactNode;
  hasIndicator?: boolean;
  ariaValueText?: string;
  variant?: "default" | "discrete";
}

export function SliderControl({
  children,
  hasIndicator = false,
  ariaValueText,
  variant = "default",
}: Props) {
  return (
    <Slider.Control className={cn(styles.control, styles[variant])}>
      <Slider.Track className={styles.track}>
        {children}
        {hasIndicator ? <Slider.Indicator className={styles.indicator} /> : null}
        <Slider.Thumb className={styles.thumb} aria-valuetext={ariaValueText} />
      </Slider.Track>
    </Slider.Control>
  );
}
