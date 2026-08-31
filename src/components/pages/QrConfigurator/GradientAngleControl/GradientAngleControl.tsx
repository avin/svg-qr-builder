import { Field } from "@base-ui/react/field";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { FormField, FormFieldLabel } from "../FormField/FormField";
import styles from "./GradientAngleControl.module.scss";

interface Props {
  value: number;
  startColor: string;
  endColor: string;
  label: string;
  dialLabel: string;
  onChange: (value: number) => void;
}

function normalizeAngle(value: number) {
  return ((Math.round(value) % 360) + 360) % 360;
}

export function GradientAngleControl({
  value,
  startColor,
  endColor,
  label,
  dialLabel,
  onChange,
}: Props) {
  const angle = normalizeAngle(value);
  // Значения зависят от текущих цветов и угла, поэтому вычисляются при каждом отображении.
  // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const dialStyle: CSSProperties = {
    background: `linear-gradient(${angle}deg, ${startColor}, ${endColor})`,
  };
  // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const handStyle: CSSProperties = { transform: `rotate(${angle}deg)` };

  function setAngleFromPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - (bounds.left + bounds.width / 2);
    const y = event.clientY - (bounds.top + bounds.height / 2);
    onChange(normalizeAngle((Math.atan2(x, -y) * 180) / Math.PI));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setAngleFromPointer(event);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      setAngleFromPointer(event);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1;
    let nextAngle: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextAngle = angle + step;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextAngle = angle - step;
    }
    if (event.key === "Home") {
      nextAngle = 0;
    }
    if (event.key === "End") {
      nextAngle = 359;
    }

    if (nextAngle !== null) {
      event.preventDefault();
      onChange(normalizeAngle(nextAngle));
    }
  }

  return (
    <FormField name="gradientAngle">
      <div className={styles.labelRow}>
        <FormFieldLabel>{label}:</FormFieldLabel>
        <span className={styles.numberControl}>
          <Field.Control
            type="number"
            min={0}
            max={359}
            step={1}
            value={angle}
            onValueChange={(nextValue) => {
              const parsedValue = Number(nextValue);
              if (Number.isFinite(parsedValue)) {
                onChange(normalizeAngle(parsedValue));
              }
            }}
          />
          <span>°</span>
        </span>
      </div>
      <div
        className={styles.dial}
        // Для радиального управления нет подходящего нативного HTML-контрола.
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="slider"
        tabIndex={0}
        aria-label={dialLabel}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={angle}
        aria-valuetext={`${angle}°`}
        style={dialStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.ticks} aria-hidden="true" />
        <span className={styles.hand} style={handStyle} aria-hidden="true">
          <span className={styles.arrow} />
        </span>
        <span className={styles.center} aria-hidden="true" />
      </div>
    </FormField>
  );
}
