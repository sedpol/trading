import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../styles/theme';

type BannerProps = {
  text: string;
  tone: 'error' | 'success' | 'info';
};

const toneStyles = {
  error: {
    backgroundColor: '#f7e1de',
    borderColor: '#d58f87',
    textColor: colors.danger,
  },
  info: {
    backgroundColor: '#e4edf6',
    borderColor: '#90aeca',
    textColor: colors.accent,
  },
  success: {
    backgroundColor: '#deefe6',
    borderColor: '#82b99d',
    textColor: colors.success,
  },
};

export function Banner({ text, tone }: BannerProps) {
  const palette = toneStyles[tone];

  return (
    <View style={[styles.container, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}> 
      <Text style={[styles.text, { color: palette.textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
});