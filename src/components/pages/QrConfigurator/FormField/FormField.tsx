import { Field } from "@base-ui/react/field";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import styles from "./FormField.module.scss";

export function FormField({ className, ...rest }: ComponentProps<typeof Field.Root>) {
  return (
    <Field.Root
      className={(state) =>
        cn(styles.root, typeof className === "function" ? className(state) : className)
      }
      {...rest}
    />
  );
}

export function FormFieldLabel({ className, ...rest }: ComponentProps<typeof Field.Label>) {
  return (
    <Field.Label
      className={(state) =>
        cn(styles.label, typeof className === "function" ? className(state) : className)
      }
      {...rest}
    />
  );
}
