import { Field } from "@base-ui/react/field";
import { useState } from "react";
import { FormField, FormFieldLabel } from "../FormField/FormField";
import { RangeControl } from "../RangeControl/RangeControl";
import styles from "./NumberSliderField.module.scss";

interface Props {
  name: string;
  sliderName: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function NumberSliderField({
  name,
  sliderName,
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: Props) {
  const [inputValue, setInputValue] = useState(String(value));

  function setNumberInput(nextInputValue: string) {
    setInputValue(nextInputValue);
    const nextValue = Number(nextInputValue);

    if (Number.isInteger(nextValue) && nextValue >= min && nextValue <= max) {
      onChange(nextValue);
    }
  }

  function setSliderValue(nextValue: number) {
    setInputValue(String(nextValue));
    onChange(nextValue);
  }

  return (
    <div className={styles.root}>
      <FormField name={name}>
        <div className={styles.labelRow}>
          <FormFieldLabel>{label}:</FormFieldLabel>
          <span className={styles.inputControl}>
            <Field.Control
              type="number"
              min={min}
              max={max}
              step={1}
              value={inputValue}
              onValueChange={setNumberInput}
              onBlur={() => setInputValue(String(value))}
            />
            {suffix ? <span>{suffix}</span> : null}
          </span>
        </div>
      </FormField>
      <RangeControl
        name={sliderName}
        label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        isLabelVisuallyHidden
        onChange={setSliderValue}
      />
    </div>
  );
}
