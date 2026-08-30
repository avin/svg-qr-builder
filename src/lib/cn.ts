type ClassValue = string | false | null | undefined | Record<string, boolean | undefined>;

export function cn(...values: ClassValue[]) {
  return values
    .flatMap((value) => {
      if (!value) {
        return [];
      }

      if (typeof value === "string") {
        return value;
      }

      return Object.entries(value)
        .filter(([, isIncluded]) => isIncluded)
        .map(([className]) => className);
    })
    .join(" ");
}
