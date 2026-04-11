import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Banner } from '../components/Banner';
import { ScreenShell } from '../components/ScreenShell';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../styles/theme';
import type { PublicStackParamList } from '../navigation/AppNavigator';

const productHighlights = [
  'Monitor live market movement with server-refreshed pricing.',
  'Manage a backend-owned watchlist without drifting from web state.',
  'Review holdings P&L and place simple buy or sell orders quickly.',
];

export function LandingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const { authMessage, clearPendingAuth, requestSignIn } = useAuth();

  return (
    <ScreenShell
      eyebrow="Trading Mobile"
      subtitle="Monitor markets, protect your watchlist, and move from insight to trade action without relying on a desktop browser."
      title="Trade confidently from a phone-first workflow."
      footer={(
        <View style={styles.heroActions}>
          <ActionButton
            label="Sign in to access portfolio"
            onPress={() => {
              requestSignIn('Portfolio');
              navigation.navigate('Login');
            }}
          />
          <ActionButton
            kind="secondary"
            label="Open markets after sign-in"
            onPress={() => {
              requestSignIn('Markets');
              navigation.navigate('Login');
            }}
          />
        </View>
      )}
    >
      {authMessage ? <Banner text={authMessage} tone="info" /> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What this mobile MVP covers</Text>
        {productHighlights.map((item) => (
          <View key={item} style={styles.featureCard}>
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk warning</Text>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Trading involves risk of loss. Review your financial situation before placing orders,
            and do not treat recent price movement as a guarantee of future performance.
          </Text>
          <ActionButton kind="ghost" label="Dismiss" onPress={clearPendingAuth} style={styles.dismissButton} />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  dismissButton: {
    marginTop: 14,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
  },
  featureText: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  heroActions: {
    gap: 10,
  },
  noticeCard: {
    backgroundColor: '#f8eeda',
    borderColor: '#dcb876',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  noticeText: {
    color: colors.warning,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    marginBottom: 12,
  },
});