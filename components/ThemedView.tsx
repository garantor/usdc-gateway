import { Layout, LayoutProps } from '@ui-kitten/components';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = LayoutProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <Layout style={[{ backgroundColor }, style]} {...otherProps} />;
}
