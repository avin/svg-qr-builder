import { Select } from "@base-ui/react/select";
import { Tabs } from "@base-ui/react/tabs";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormField } from "../FormField/FormField";
import { FormFieldset } from "../FormFieldset/FormFieldset";
import { RadiusControl } from "../RangeControl/RangeControl";
import {
  cornerRadiusMaximums,
  getLinkedCornerRounding,
  getLinkedDataRounding,
  getPresetSettings,
  roundToTenths,
} from "../settings";
import type { PresetName, RoundingMode, RoundingSettings } from "../types";
import styles from "./QrRoundingControls.module.scss";

const presetNames: PresetName[] = ["rounded", "square", "custom"];
const presetLabelKeys = {
  square: "square",
  rounded: "rounded",
  custom: "custom",
} as const;

interface Props {
  presetName: PresetName;
  rounding: RoundingSettings;
  onChange: (presetName: PresetName, rounding: RoundingSettings) => void;
}

export function QrRoundingControls({ presetName, rounding, onChange }: Props) {
  const { t } = useTranslation();
  const [dataRoundingMode, setDataRoundingMode] = useState<RoundingMode>("linked");
  const [cornerRoundingMode, setCornerRoundingMode] = useState<RoundingMode>("linked");

  function selectPreset(nextPresetName: PresetName) {
    onChange(
      nextPresetName,
      nextPresetName === "custom" ? rounding : getPresetSettings(nextPresetName),
    );
  }

  function setRoundingValue(key: keyof RoundingSettings, value: number) {
    onChange("custom", { ...rounding, [key]: roundToTenths(value) });
  }

  function setLinkedCornerRounding(value: number) {
    onChange("custom", {
      ...rounding,
      cornerRingOuter: roundToTenths(value * cornerRadiusMaximums.ringOuter),
      cornerRingInner: roundToTenths(value * cornerRadiusMaximums.ringInner),
      cornerCenterOuter: roundToTenths(value * cornerRadiusMaximums.centerOuter),
    });
  }

  function setLinkedDataRounding(value: number) {
    const roundedValue = roundToTenths(value);
    onChange("custom", { ...rounding, dataOuter: roundedValue, dataInner: roundedValue });
  }

  return (
    <FormFieldset legend={t("rounding")} isLegendVisuallyHidden>
      <FormField name="presetName">
        <Select.Root
          value={presetName}
          onValueChange={(value) => selectPreset(value as PresetName)}
        >
          <div className={styles.selectField}>
            <Select.Label>{t("roundingProfile")}</Select.Label>
            <Select.Trigger className={styles.selectTrigger}>
              <Select.Value>{(value: PresetName) => t(presetLabelKeys[value])}</Select.Value>
              <Select.Icon className={styles.selectIcon}>
                <IconChevronDown size={16} stroke={1.75} />
              </Select.Icon>
            </Select.Trigger>
          </div>
          <Select.Portal>
            <Select.Positioner
              className={styles.selectPositioner}
              alignItemWithTrigger={false}
              sideOffset={6}
            >
              <Select.Popup className={styles.selectPopup}>
                {presetNames.map((preset) => (
                  <Select.Item className={styles.selectItem} key={preset} value={preset}>
                    <Select.ItemIndicator className={styles.selectItemIndicator}>
                      <IconCheck size={14} stroke={2} />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.selectItemText}>
                      {t(presetLabelKeys[preset])}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </FormField>

      <FormFieldset legend={t("roundingDataCells")}>
        <Tabs.Root
          className={styles.tabsRoot}
          value={dataRoundingMode}
          onValueChange={(value) => setDataRoundingMode(value as RoundingMode)}
        >
          <Tabs.List className={styles.tabs} aria-label={t("roundingDataCells")}>
            <Tabs.Tab className={styles.tab} value="linked">
              {t("simple")}
            </Tabs.Tab>
            <Tabs.Tab className={styles.tab} value="manual">
              {t("advanced")}
            </Tabs.Tab>
            <Tabs.Indicator className={styles.tabIndicator} />
          </Tabs.List>
          <Tabs.Panel value="linked">
            <RadiusControl
              name="dataRounding"
              label={t("dataCornerRounding")}
              value={getLinkedDataRounding(rounding)}
              max={2}
              onChange={setLinkedDataRounding}
            />
          </Tabs.Panel>
          <Tabs.Panel className={styles.manualControls} value="manual">
            <RadiusControl
              name="dataOuter"
              label={t("dataConvexCorners")}
              value={rounding.dataOuter}
              max={2}
              onChange={(value) => setRoundingValue("dataOuter", value)}
            />
            <RadiusControl
              name="dataInner"
              label={t("dataConcaveCorners")}
              value={rounding.dataInner}
              max={2}
              onChange={(value) => setRoundingValue("dataInner", value)}
            />
          </Tabs.Panel>
        </Tabs.Root>
      </FormFieldset>

      <FormFieldset legend={t("roundingCornerCells")}>
        <Tabs.Root
          className={styles.tabsRoot}
          value={cornerRoundingMode}
          onValueChange={(value) => setCornerRoundingMode(value as RoundingMode)}
        >
          <Tabs.List className={styles.tabs} aria-label={t("roundingCornerCells")}>
            <Tabs.Tab className={styles.tab} value="linked">
              {t("simple")}
            </Tabs.Tab>
            <Tabs.Tab className={styles.tab} value="manual">
              {t("advanced")}
            </Tabs.Tab>
            <Tabs.Indicator className={styles.tabIndicator} />
          </Tabs.List>
          <Tabs.Panel value="linked">
            <RadiusControl
              name="cornerRounding"
              label={t("cornerRounding")}
              value={getLinkedCornerRounding(rounding)}
              max={1}
              step={0.1}
              formatValue={(value) => `${Math.round(value * 100)}%`}
              onChange={setLinkedCornerRounding}
            />
          </Tabs.Panel>
          <Tabs.Panel className={styles.manualControls} value="manual">
            <RadiusControl
              name="cornerRingOuter"
              label={t("cornerRingConvexCorners")}
              value={rounding.cornerRingOuter}
              max={cornerRadiusMaximums.ringOuter}
              onChange={(value) => setRoundingValue("cornerRingOuter", value)}
            />
            <RadiusControl
              name="cornerRingInner"
              label={t("cornerRingConcaveCorners")}
              value={rounding.cornerRingInner}
              max={cornerRadiusMaximums.ringInner}
              onChange={(value) => setRoundingValue("cornerRingInner", value)}
            />
            <RadiusControl
              name="cornerCenterOuter"
              label={t("cornerCenterConvexCorners")}
              value={rounding.cornerCenterOuter}
              max={cornerRadiusMaximums.centerOuter}
              onChange={(value) => setRoundingValue("cornerCenterOuter", value)}
            />
          </Tabs.Panel>
        </Tabs.Root>
      </FormFieldset>
    </FormFieldset>
  );
}
