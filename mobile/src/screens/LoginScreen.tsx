import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Banner } from '../components/Banner';
import { ScreenShell } from '../components/ScreenShell';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../styles/theme';
import type { PublicStackParamList } from '../navigation/AppNavigator';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const { authMessage, clearPendingAuth, login, pendingRoute } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <ScreenShell
        eyebrow="Account Access"
        subtitle={`Your ${pendingRoute === 'Markets' ? 'markets workspace' : 'portfolio'} stays protected until the backend confirms your session.`}
        title="Sign in to continue."
      >
        {authMessage ? <Banner text={authMessage} tone="info" /> : null}
        {submitError ? <Banner text={submitError} tone="error" /> : null}

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Email or username</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setIdentifier}
            placeholder="trader"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            textContentType="username"
            value={identifier}
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={styles.input}
            textContentType="password"
            value={password}
          />

          <Text style={styles.helperText}>
            Local demo credentials are configured in <Text style={styles.helperEmphasis}>backend/.env</Text>.
          </Text>

          <View style={styles.buttonStack}>
            <ActionButton
              label={isSubmitting ? 'Signing in...' : 'Sign in'}
              onPress={async () => {
                setIsSubmitting(true);
                setSubmitError(null);
                const result = await login(identifier, password);

                if (!result.ok) {
                  setSubmitError(result.message ?? 'Unable to sign in.');
                  setIsSubmitting(false);
                }
              }}
            />
            <ActionButton
              kind="ghost"
              label="Back to landing"
              onPress={() => {
                clearPendingAuth();
                navigation.navigate('Landing');
              }}
            />
          </View>
        </View>
      </ScreenShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: 10,
    marginTop: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  helperEmphasis: {
    color: colors.text,
    fontFamily: fonts.body,
    fontWeight: '700',
  },
  helperText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fffef9',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  keyboard: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
