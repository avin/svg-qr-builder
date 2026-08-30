import { useTranslation } from "react-i18next";
import { ColorField } from "../ColorField/ColorField";
import { FormFieldset } from "../FormFieldset/FormFieldset";
import { NumberSliderField } from "../NumberSliderField/NumberSliderField";
import { svgSizeMinimum, svgSizeSliderMaximum } from "../settings";

interface Props {
  fill: string;
  size: number;
  onFillChange: (fill: string) => void;
  onSizeChange: (size: number) => void;
}

export function QrAppearanceControls({ fill, size, onFillChange, onSizeChange }: Props) {
  const { t } = useTranslation();

  return (
    <FormFieldset legend={t("appearance")} isLegendVisuallyHidden>
      <ColorField name="fill" label={t("qrColor")} value={fill} onChange={onFillChange} />
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
    </FormFieldset>
  );
}
