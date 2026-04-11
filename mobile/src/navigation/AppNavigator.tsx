import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SummaryProvider } from '../context/SummaryContext';
import { useAuth } from '../context/AuthContext';
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MarketsScreen } from '../screens/MarketsScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { colors, fonts, navigationTheme } from '../styles/theme';
import type { ProtectedRouteName } from '../types';

export type PublicStackParamList = {
  Landing: undefined;
  Login: undefined;
};

export type PrivateTabParamList = {
  Markets: undefined;
  Portfolio: undefined;
};

const PublicStack = createNativeStackNavigator<PublicStackParamList>();
const PrivateTabs = createBottomTabNavigator<PrivateTabParamList>();

function LoadingScreen() {
  return (
    <View style={styles.loadingShell}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingTitle}>Checking your session...</Text>
      <Text style={styles.loadingCopy}>We only unlock portfolio data after the backend confirms access.</Text>
    </View>
  );
}

function PublicNavigator() {
  const { pendingRoute } = useAuth();

  return (
    <PublicStack.Navigator
      initialRouteName={pendingRoute ? 'Login' : 'Landing'}
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    >
      <PublicStack.Screen name="Landing" component={LandingScreen} />
      <PublicStack.Screen name="Login" component={LoginScreen} />
    </PublicStack.Navigator>
  );
}

function PrivateNavigator() {
  const { clearPendingAuth, pendingRoute } = useAuth();
  const initialRouteName: ProtectedRouteName = pendingRoute ?? 'Markets';

  return (
    <SummaryProvider>
      <PrivateTabs.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontFamily: fonts.body,
            fontSize: 12,
            fontWeight: '700',
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 72,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
        screenListeners={{
          state: () => {
            if (pendingRoute) {
              clearPendingAuth();
            }
          },
        }}
      >
        <PrivateTabs.Screen name="Markets" component={MarketsScreen} />
        <PrivateTabs.Screen name="Portfolio" component={PortfolioScreen} />
      </PrivateTabs.Navigator>
    </SummaryProvider>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isAuthResolved } = useAuth();

  return (
    <NavigationContainer theme={navigationTheme}>
      {!isAuthResolved ? <LoadingScreen /> : isAuthenticated ? <PrivateNavigator /> : <PublicNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingCopy: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 280,
    textAlign: 'center',
  },
  loadingShell: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    marginTop: 10,
  },
});