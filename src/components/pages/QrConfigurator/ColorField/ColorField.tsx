import { Field } from "@base-ui/react/field";
import type { ReactNode } from "react";
import { FormField, FormFieldLabel } from "../FormField/FormField";
import styles from "./ColorField.module.scss";

interface Props {
  name: string;
  label: string;
  value: string;
  isDisabled?: boolean;
  labelEnd?: ReactNode;
  onChange: (value: string) => void;
}

export function ColorField({ name, label, value, isDisabled = false, labelEnd, onChange }: Props) {
  return (
    <FormField name={name} disabled={isDisabled}>
      <div className={styles.labelRow}>
        <FormFieldLabel>{label}</FormFieldLabel>
        {labelEnd}
      </div>
      <span className={styles.control}>
        <Field.Control type="color" value={value} onValueChange={onChange} />
        <output dir="ltr">{value}</output>
      </span>
    </FormField>
  );
}
