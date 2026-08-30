import { Slider } from "@base-ui/react/slider";
import { useTranslation } from "react-i18next";
import { FormField } from "../FormField/FormField";
import { SliderControl } from "../SliderControl/SliderControl";
import styles from "./ErrorCorrectionSlider.module.scss";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

interface Props {
  value: ErrorCorrectionLevel;
  onChange: (value: ErrorCorrectionLevel) => void;
}

const levels: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
const labelKeys = { L: "low", M: "medium", Q: "quartile", H: "high" } as const;
const sliderMaximum = levels.length * 2;

function getSliderValue(levelIndex: number) {
  return levelIndex * 2 + 1;
}

function getLevelIndex(nextValue: number, currentIndex: number, reason: string) {
  if (reason === "keyboard") {
    if (nextValue === 0 || nextValue === sliderMaximum) {
      return nextValue === 0 ? 0 : levels.length - 1;
    }

    return Math.max(
      0,
      Math.min(
        levels.length - 1,
        currentIndex + Math.sign(nextValue - getSliderValue(currentIndex)),
      ),
    );
  }

  return Math.max(0, Math.min(levels.length - 1, Math.floor(nextValue / 2)));
}

export function ErrorCorrectionSlider({ value, onChange }: Props) {
  const { t } = useTranslation();
  const valueIndex = levels.indexOf(value);

  return (
    <FormField name="errorCorrectionLevel">
      <Slider.Root
        className={styles.slider}
        value={getSliderValue(valueIndex)}
        min={0}
        max={sliderMaximum}
        step={1}
        thumbAlignment="center"
        onValueChange={(nextValue, details) =>
          onChange(levels[getLevelIndex(nextValue as number, valueIndex, details.reason)])
        }
      >
        <div className={styles.label}>
          <Slider.Label>{t("errorCorrectionLevel")}:</Slider.Label>{" "}
          <Slider.Value>{() => `${value} — ${t(labelKeys[value])}`}</Slider.Value>
        </div>
        <SliderControl variant="discrete" ariaValueText={`${value} — ${t(labelKeys[value])}`}>
          <div className={styles.markers} aria-hidden="true">
            {levels.map((level) => (
              <span className={styles.marker} key={level} />
            ))}
          </div>
        </SliderControl>
      </Slider.Root>
      <div className={styles.positions} aria-hidden="true">
        {levels.map((level, index) => (
          <span data-selected={index === valueIndex ? "" : undefined} key={level}>
            {level}
          </span>
        ))}
      </div>
    </FormField>
  );
}
