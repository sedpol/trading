import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { colors, fonts } from '../styles/theme';

type TradeComposerProps = {
  busyAction: 'buy' | 'sell' | null;
  onQuantityChange: (quantity: number) => void;
  onTrade: (side: 'buy' | 'sell') => void;
  quantity: number;
  symbol: string;
};

export function TradeComposer({ busyAction, onQuantityChange, onTrade, quantity, symbol }: TradeComposerProps) {
  const [draftQuantity, setDraftQuantity] = useState(String(quantity));

  useEffect(() => {
    setDraftQuantity(String(quantity));
  }, [quantity]);

  const syncQuantity = () => {
    const parsed = Number.parseInt(draftQuantity, 10);
    const nextQuantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    setDraftQuantity(String(nextQuantity));
    onQuantityChange(nextQuantity);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trade {symbol}</Text>
      <View style={styles.row}>
        <View style={styles.inputWrap}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            accessibilityLabel={`Trade quantity for ${symbol}`}
            keyboardType="number-pad"
            onBlur={syncQuantity}
            onChangeText={(value) => {
              const sanitized = value.replace(/[^0-9]/g, '');
              setDraftQuantity(sanitized || '');
            }}
            placeholder="1"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            testID={`trade-quantity-${symbol}`}
            value={draftQuantity}
          />
        </View>
        <ActionButton
          accessibilityLabel={`Buy ${symbol}`}
          label={busyAction === 'buy' ? 'Buying...' : 'Buy'}
          onPress={() => {
            syncQuantity();
            onTrade('buy');
          }}
          style={styles.action}
          testID={`trade-buy-${symbol}`}
        />
        <ActionButton
          accessibilityLabel={`Sell ${symbol}`}
          kind="secondary"
          label={busyAction === 'sell' ? 'Selling...' : 'Sell'}
          onPress={() => {
            syncQuantity();
            onTrade('sell');
          }}
          style={styles.action}
          testID={`trade-sell-${symbol}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    padding: 14,
  },
  heading: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputWrap: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginBottom: 6,
  },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
  },
});