import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NumberSliderField } from "./NumberSliderField";

function renderField(value = 480, onChange = vi.fn()) {
  return {
    onChange,
    ...render(
      <NumberSliderField
        name="size"
        sliderName="sizeSlider"
        label="Размер SVG"
        value={value}
        min={100}
        max={512}
        step={4}
        suffix="px"
        onChange={onChange}
      />,
    ),
  };
}

describe("числовое поле со слайдером", () => {
  afterEach(cleanup);

  it("передаёт допустимое целое значение", async () => {
    const user = userEvent.setup();
    const { onChange } = renderField();
    const input = screen.getByRole("spinbutton", { name: /Размер SVG/ });

    await user.clear(input);
    await user.type(input, "640");

    expect(onChange).toHaveBeenLastCalledWith(640);
  });

  it("не передаёт дробное значение или значение ниже минимума и восстанавливается при blur", async () => {
    const user = userEvent.setup();
    const { onChange } = renderField();
    const input = screen.getByRole("spinbutton", { name: /Размер SVG/ });

    await user.clear(input);
    await user.type(input, "99");
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue(480);
  });

  it("синхронизирует поле при внешнем изменении значения", () => {
    const { rerender } = renderField();

    rerender(
      <NumberSliderField
        name="size"
        sliderName="sizeSlider"
        label="Размер SVG"
        value={320}
        min={100}
        max={512}
        step={4}
        suffix="px"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: /Размер SVG/ })).toHaveValue(320);
  });

  it("синхронизирует числовое поле после управления слайдером", async () => {
    const user = userEvent.setup();
    renderField(100);

    const slider = document.querySelector<HTMLInputElement>('input[type="range"]')!;
    slider.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("spinbutton", { name: /Размер SVG/ })).toHaveValue(104);
  });
});
