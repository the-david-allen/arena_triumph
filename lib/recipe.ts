import { cn } from "@/lib/cn";

type VariantMap = Record<string, Record<string, string>>;
type CompoundVariant = {
  [key: string]: string | undefined;
  class: string;
};

export interface RecipeConfig<V extends VariantMap> {
  base: string;
  variants?: V;
  defaultVariants?: { [K in keyof V]?: keyof V[K] };
  compoundVariants?: CompoundVariant[];
}

/**
 * Builds a variant recipe function. Returns a function that accepts
 * variant props and optional className, and returns the merged class string.
 */
export function recipe<V extends VariantMap>(config: RecipeConfig<V>) {
  const { base, variants = {} as V, defaultVariants = {}, compoundVariants = [] } = config;

  return function recipeFn(
    props: { className?: string } & { [K in keyof V]?: keyof V[K] } = {}
  ): string {
    const { className, ...variantProps } = props;
    const resolved = { ...defaultVariants, ...variantProps } as unknown as {
      [K in keyof V]: keyof V[K];
    };

    const variantClasses = (Object.keys(variants) as (keyof V)[]).map((key) => {
      const value = resolved[key];
      if (value == null) return "";
      const map = variants[key];
      return map[value as string] ?? "";
    });

    const compoundClasses = compoundVariants
      .filter((compound) => {
        return (Object.keys(compound) as string[])
          .filter((k) => k !== "class")
          .every((k) => (resolved as Record<string, unknown>)[k] === compound[k]);
      })
      .map((c) => c.class);

    return cn(base, ...variantClasses, ...compoundClasses, className);
  };
}
