import { Tabs } from "@base-ui/react/tabs";
import { useTranslation } from "react-i18next";
import { ColorField } from "../ColorField/ColorField";
import { FormFieldset } from "../FormFieldset/FormFieldset";
import { GradientAngleControl } from "../GradientAngleControl/GradientAngleControl";
import { NumberSliderField } from "../NumberSliderField/NumberSliderField";
import { svgSizeMinimum, svgSizeSliderMaximum } from "../settings";
import type { QrColorMode, QrColorSettings } from "../types";
import styles from "./QrAppearanceControls.module.scss";

interface Props {
  color: QrColorSettings;
  size: number;
  onColorChange: (color: QrColorSettings) => void;
  onSizeChange: (size: number) => void;
}

export function QrAppearanceControls({ color, size, onColorChange, onSizeChange }: Props) {
  const { t } = useTranslation();

  function updateColor(patch: Partial<QrColorSettings>) {
    onColorChange({ ...color, ...patch });
  }

  return (
    <FormFieldset legend={t("appearance")} isLegendVisuallyHidden>
      <NumberSliderField
        name="size"
        sliderName="sizeSlider"
        label={t("svgSize")}
        value={size}
        min={svgSizeMinimum}
        max={svgSizeSliderMaximum}
        step={4}
        suffix="px"
        onChange={onSizeChange}
      />
      <FormFieldset legend={t("qrColor")}>
        <Tabs.Root
          className={styles.tabsRoot}
          value={color.mode}
          onValueChange={(value) => updateColor({ mode: value as QrColorMode })}
        >
          <Tabs.List className={styles.tabs} aria-label={t("qrColor")}>
            <Tabs.Tab className={styles.tab} value="solid">
              {t("solidColor")}
            </Tabs.Tab>
            <Tabs.Tab className={styles.tab} value="gradient">
              {t("gradient")}
            </Tabs.Tab>
            <Tabs.Indicator className={styles.tabIndicator} />
          </Tabs.List>
          <Tabs.Panel value="solid">
            <ColorField
              name="solidColor"
              label={t("qrColor")}
              value={color.solid}
              onChange={(solid) => updateColor({ solid })}
            />
          </Tabs.Panel>
          <Tabs.Panel className={styles.gradientControls} value="gradient">
            <div className={styles.gradientColors}>
              <ColorField
                name="gradientStart"
                label={t("gradientStartColor")}
                value={color.gradientStart}
                onChange={(gradientStart) => updateColor({ gradientStart })}
              />
              <ColorField
                name="gradientEnd"
                label={t("gradientEndColor")}
                value={color.gradientEnd}
                onChange={(gradientEnd) => updateColor({ gradientEnd })}
              />
            </div>
            <GradientAngleControl
              value={color.gradientAngle}
              startColor={color.gradientStart}
              endColor={color.gradientEnd}
              label={t("gradientDirection")}
              dialLabel={t("gradientDirectionDial")}
              onChange={(gradientAngle) => updateColor({ gradientAngle })}
            />
          </Tabs.Panel>
        </Tabs.Root>
      </FormFieldset>
    </FormFieldset>
  );
}
