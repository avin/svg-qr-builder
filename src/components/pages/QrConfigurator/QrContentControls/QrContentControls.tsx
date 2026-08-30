import { Field } from "@base-ui/react/field";
import { useTranslation } from "react-i18next";
import { ErrorCorrectionSlider } from "../ErrorCorrectionSlider/ErrorCorrectionSlider";
import { FormField, FormFieldLabel } from "../FormField/FormField";
import { FormFieldset } from "../FormFieldset/FormFieldset";
import type { ErrorCorrectionLevel } from "../types";
import styles from "./QrContentControls.module.scss";

interface Props {
  content: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  onContentChange: (content: string) => void;
  onErrorCorrectionLevelChange: (level: ErrorCorrectionLevel) => void;
}

export function QrContentControls({
  content,
  errorCorrectionLevel,
  onContentChange,
  onErrorCorrectionLevelChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <FormFieldset legend={t("content")} isLegendVisuallyHidden>
      <FormField name="content">
        <FormFieldLabel>{t("payload")}</FormFieldLabel>
        <Field.Control
          className={styles.textarea}
          render={<textarea rows={2} dir="auto" />}
          value={content}
          onValueChange={onContentChange}
        />
      </FormField>

      <ErrorCorrectionSlider value={errorCorrectionLevel} onChange={onErrorCorrectionLevelChange} />
    </FormFieldset>
  );
}
