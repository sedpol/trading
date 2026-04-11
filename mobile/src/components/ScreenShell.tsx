import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../styles/theme';

type ScreenShellProps = {
  children: ReactNode;
  eyebrow?: string;
  footer?: ReactNode;
  subtitle: string;
  title: string;
};

export function ScreenShell({ children, eyebrow, footer, subtitle, title }: ScreenShellProps) {
  return (
    <SafeAreaView edges={[ 'top' ]} style={styles.safeArea}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {footer ? <View style={styles.heroFooter}>{footer}</View> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundOrbBottom: {
    backgroundColor: '#ead7bd',
    borderRadius: 220,
    bottom: -120,
    height: 240,
    position: 'absolute',
    right: -80,
    width: 240,
  },
  backgroundOrbTop: {
    backgroundColor: '#d7e2ee',
    borderRadius: 200,
    height: 220,
    left: -100,
    position: 'absolute',
    top: -70,
    width: 220,
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  heroCard: {
    backgroundColor: '#fff9f0',
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 18,
    padding: 22,
  },
  heroFooter: {
    marginTop: 18,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 12,
  },
});