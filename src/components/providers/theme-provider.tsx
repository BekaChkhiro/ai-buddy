"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps as NextThemesProviderProps } from "next-themes";

/**
 * Theme Provider component using next-themes
 * Wraps the application to provide theme switching functionality
 *
 * @param children - React children components
 * @param props - Additional theme provider props from next-themes
 */
export function ThemeProvider({
  children,
  ...props
}: NextThemesProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
