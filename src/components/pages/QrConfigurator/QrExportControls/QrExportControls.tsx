import { Button } from "@base-ui/react/button";
import { Checkbox } from "@base-ui/react/checkbox";
import { Field } from "@base-ui/react/field";
import { IconCheck, IconTrash, IconUpload } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ColorField } from "../ColorField/ColorField";
import { readEmbeddedImage } from "../file-actions";
import { FormField, FormFieldLabel } from "../FormField/FormField";
import { FormFieldset } from "../FormFieldset/FormFieldset";
import { PercentControl } from "../RangeControl/RangeControl";
import type { ExportSettings } from "../types";
import styles from "./QrExportControls.module.scss";

interface Props {
  settings: ExportSettings;
  onChange: (settings: Partial<ExportSettings>) => void;
}

export function QrExportControls({ settings, onChange }: Props) {
  const { t } = useTranslation();
  const { background, isBackgroundEnabled, padding, embeddedImage, imagePadding, imageSize } =
    settings;

  return (
    <FormFieldset
      className={styles.exportPanel}
      legend={t("exportSettings")}
      isLegendVisuallyHidden
    >
      <div className={styles.exportControls}>
        <FormFieldset legend={t("canvas")} isCompact>
          <FormField name="isBackgroundEnabled">
            <FormFieldLabel className={styles.checkboxLabel}>
              <Checkbox.Root
                className={styles.checkbox}
                checked={isBackgroundEnabled}
                onCheckedChange={(value) => onChange({ isBackgroundEnabled: value })}
              >
                <Checkbox.Indicator className={styles.checkboxIndicator}>
                  <IconCheck size={12} stroke={2.5} />
                </Checkbox.Indicator>
              </Checkbox.Root>
              {t("enabled")}
            </FormFieldLabel>
          </FormField>
          <ColorField
            name="background"
            label={t("backgroundColor")}
            value={background}
            isDisabled={!isBackgroundEnabled}
            onChange={(value) => onChange({ background: value })}
          />
          <PercentControl
            name="padding"
            label={t("qrPadding")}
            value={padding}
            max={20}
            onChange={(value) => onChange({ padding: value })}
          />
        </FormFieldset>

        <FormFieldset legend={t("centerImage")} isCompact>
          <FormField name="embeddedImage">
            <div className={styles.imageActions}>
              <FormFieldLabel className={styles.fileButton}>
                <IconUpload size={17} stroke={1.8} />
                <span>{embeddedImage ? embeddedImage.name : t("uploadImage")}</span>
                <Field.Control
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    void readEmbeddedImage(event.currentTarget.files?.[0], (image) =>
                      onChange({ embeddedImage: image }),
                    )
                  }
                />
              </FormFieldLabel>
              {embeddedImage ? (
                <Button
                  className={styles.iconButton}
                  type="button"
                  aria-label={t("removeImage")}
                  onClick={() => onChange({ embeddedImage: null })}
                >
                  <IconTrash size={17} stroke={1.8} />
                </Button>
              ) : null}
            </div>
          </FormField>
          <PercentControl
            name="imageSize"
            label={t("imageSize")}
            value={imageSize}
            min={8}
            max={50}
            onChange={(value) => onChange({ imageSize: value })}
          />
          <PercentControl
            name="imagePadding"
            label={t("imagePadding")}
            value={imagePadding}
            max={20}
            onChange={(value) => onChange({ imagePadding: value })}
          />
        </FormFieldset>
      </div>
    </FormFieldset>
  );
}
