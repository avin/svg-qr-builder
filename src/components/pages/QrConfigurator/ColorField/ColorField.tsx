import { Field } from "@base-ui/react/field";
import { FormField, FormFieldLabel } from "../FormField/FormField";
import styles from "./ColorField.module.scss";

interface Props {
  name: string;
  label: string;
  value: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
}

export function ColorField({ name, label, value, isDisabled = false, onChange }: Props) {
  return (
    <FormField name={name} disabled={isDisabled}>
      <FormFieldLabel>{label}</FormFieldLabel>
      <span className={styles.control}>
        <Field.Control type="color" value={value} onValueChange={onChange} />
        <output dir="ltr">{value}</output>
      </span>
    </FormField>
  );
}
