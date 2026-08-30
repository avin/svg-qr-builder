import { Slider } from "@base-ui/react/slider";
import { cn } from "@/lib/cn";
import { FormField } from "../FormField/FormField";
import { formatRoundedValue } from "../settings";
import { SliderControl } from "../SliderControl/SliderControl";
import styles from "./RangeControl.module.scss";

interface Props {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
  isLabelVisuallyHidden?: boolean;
  onChange: (value: number) => void;
}

export function RangeControl({
  name,
  label,
  value,
  min,
  max,
  step,
  formatValue = formatRoundedValue,
  isLabelVisuallyHidden = false,
  onChange,
}: Props) {
  return (
    <FormField name={name}>
      <Slider.Root
        className={styles.slider}
        value={value}
        min={min}
        max={max}
        step={step}
        thumbAlignment="edge"
        onValueChange={(nextValue) => onChange(nextValue as number)}
      >
        <div className={cn(styles.labelRow, { [styles.visuallyHidden]: isLabelVisuallyHidden })}>
          <Slider.Label>{label}</Slider.Label>
          {isLabelVisuallyHidden ? null : (
            <Slider.Value>{(_, values) => formatValue(values[0])}</Slider.Value>
          )}
        </div>
        <SliderControl hasIndicator />
      </Slider.Root>
    </FormField>
  );
}

interface RadiusControlProps {
  name: string;
  label: string;
  value: number;
  max: number;
  min?: number;
  step?: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

export function RadiusControl({
  name,
  label,
  value,
  max,
  min = 0,
  step = 0.1,
  formatValue = formatRoundedValue,
  onChange,
}: RadiusControlProps) {
  return (
    <RangeControl
      name={name}
      label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      formatValue={formatValue}
      onChange={onChange}
    />
  );
}

interface PercentControlProps {
  name: string;
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export function PercentControl({
  name,
  label,
  value,
  min = 0,
  max,
  onChange,
}: PercentControlProps) {
  return (
    <RadiusControl
      name={name}
      label={label}
      value={value}
      min={min}
      max={max}
      step={1}
      formatValue={(nextValue) => `${nextValue}%`}
      onChange={onChange}
    />
  );
}
