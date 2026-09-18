/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-console */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { BTRef, BTDateRef, ElementEvent, Token, TokenizeData } from '../src';
import {
  CardExpirationDateElement,
  CardNumberElement,
  CardVerificationCodeElement,
  useBasisTheory,
} from '../src';
import { styles } from './styles';
import type { ElementEvents } from '../App';
import { EncryptedToken, EncryptToken } from '../src/model/EncryptTokenData';
import { BasisTheoryProvider } from '../src/BasisTheoryProvider';
import { CoBadgedSupport } from '../src/CardElementTypes';

const Divider = () => <View style={styles.divider} />;

/** Sample numbers for exercising card brand detection and the brand icon. */
const BRAND_SAMPLES: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Visa', value: '4242424242424242' },
  { label: 'Mastercard', value: '5555555555554444' },
  { label: 'American Express', value: '378282246310005' },
  { label: 'Discover', value: '6011111111111117' },
  { label: 'Diners Club', value: '30569309025904' },
  { label: 'JCB', value: '3530111333300000' },
  { label: 'UnionPay', value: '6250947000000000' },
  { label: 'Maestro', value: '6759649826438453' },
  { label: 'Elo', value: '6362970000457013' },
  { label: 'Hipercard', value: '6062826786276634' },
  { label: 'Hiper', value: '6370950000000005' },
  { label: 'MIR', value: '2200000000000004' },
];

export const Collect = () => {
  const [token, setToken] = useState<Token | undefined>();
  const [tokenizedData, setTokenizedData] = useState<
    TokenizeData | undefined
  >();
  const [encryptedToken, setEncryptedToken] = useState<EncryptedToken | undefined>();

  const [tokenId, setTokenId] = useState('');
  const [sampleBrand, setSampleBrand] = useState<string>();
  const [samplePickerOpen, setSamplePickerOpen] = useState(false);

  const [elementsEvents, setElementsEvents] = useState<ElementEvents>({
    cardExpirationDate: undefined,
    cvc: undefined,
    cardNumber: undefined,
  });

  const cardNumberRef = useRef<BTRef>(null);
  const cardExpirationDateRef = useRef<BTDateRef>(null);
  const cardVerificationCodeRef = useRef<BTRef>(null);

  const { bt, error } = useBasisTheory('<API_KEY>');

  const [cvcLength, setCvcLength] = useState<number>();

  useEffect(() => {
    if (error) {
      console.log(error);
    }
  }, [error]);

  const updateElementsEvents =
    (eventSource: 'cardExpirationDate' | 'cardNumber' | 'cvc') =>
    (event: ElementEvent) => {
      if (event.cvcLength) {
        setCvcLength(event.cvcLength);
      }

      setElementsEvents((prev) => ({
        ...prev,
        [eventSource]: event,
      }));
    };

  const allFieldsComplete =
    Boolean(elementsEvents.cardNumber?.complete) &&
    Boolean(elementsEvents.cardExpirationDate?.complete) &&
    Boolean(elementsEvents.cvc?.complete);

  const createTokenWithTokenize = async () => {
    try {
      const _token = await bt?.tokens.tokenize({
        type: 'card',
        data: {
          number: cardNumberRef.current,
          expiration_month: cardExpirationDateRef.current?.month(),
          expiration_year: cardExpirationDateRef.current?.year(),
          cvc: cardVerificationCodeRef.current,
        },
      });

      setTokenizedData(_token);
    } catch (error) {
      console.error(error);
    }
  };

  const createToken = async () => {
    try {
      const _token = await bt?.tokens.create({
        type: 'card',
        data: {
          number: cardNumberRef.current,
          expiration_month: cardExpirationDateRef.current?.month(),
          expiration_year: cardExpirationDateRef.current?.year(),
          cvc: cardVerificationCodeRef.current,
        },
      });

      if (_token?.id) setTokenId(_token?.id);

      setToken(_token);
    } catch (error) {
      console.error(error);
    }
  };

  const updateToken = async () => {
    try {
      if (token?.id || tokenId) {
        const _token = await bt?.tokens.update(token?.id || tokenId, {
          data: {
            number: cardNumberRef.current,
            expiration_month: cardExpirationDateRef.current?.month(),
            expiration_year: cardExpirationDateRef.current?.year(),
          },
        });

        setToken(_token);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteToken = async () => {
    try {
      if (token?.id || tokenId) {
        await bt?.tokens.delete(token?.id || tokenId);

        Alert.alert(
          `Token Deleted`,
          `Token with ID ${token?.id || tokenId} has been deleted`,
          [{ text: 'OK' }]
        );

        setToken(undefined);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const encryptToken = async () => {
    try {
      const encryptRequest: EncryptToken = {
        tokenRequests: {
          type: 'card',
          data: {
            number: cardNumberRef.current,
            expiration_month: cardExpirationDateRef.current?.month(),
            expiration_year: cardExpirationDateRef.current?.year(),
            cvc: cardVerificationCodeRef.current,
          },
        },
        // public key from dev environment
        publicKeyPEM: '-----BEGIN PUBLIC KEY-----\noCXqWBAnKV24Xt1/lCVzN3fg1w8INuCRcp8B0EwmbxA=\n-----END PUBLIC KEY-----',
        keyId: '1c6e6249-9c55-47a1-a8c4-73c0b3d60a64'
      };

      const encrypted = await bt?.tokens.encrypt(encryptRequest);
      setEncryptedToken(encrypted);
    } catch (error) {
      console.error(error);
    }
  };

  const clearToken = () => {
    cardExpirationDateRef.current?.clear();
    cardNumberRef.current?.clear();
    cardVerificationCodeRef.current?.clear();

    setTokenId('');
    setToken(undefined);
    setTokenizedData(undefined);
    setEncryptedToken(undefined);
  };

  return (
     <View>
      <StatusBar />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <BasisTheoryProvider bt={bt}>
          <View style={styles.viewContainer}>
            <TextInput
              placeholder="Token ID*"
              style={styles.elements}
              onChangeText={setTokenId}
              placeholderTextColor="#99a0bf"
              value={tokenId}
            />

            <CardNumberElement
              autoComplete="cc-number"
              btRef={cardNumberRef}
              coBadgedSupport={[CoBadgedSupport.CartesBancaires]}
              binLookup={true}
              keyboardType="numeric"
              enterKeyHint="next"
              iconPosition="right"
              onChange={updateElementsEvents('cardNumber')}
              onSubmitEditing={() => cardExpirationDateRef.current?.focus()}
              placeholder="Card Number"
              placeholderTextColor="#99a0bf"
              style={styles.elements}
              textContentType="creditCardNumber"
            />
            <CardExpirationDateElement
              autoComplete="cc-exp"
              btRef={cardExpirationDateRef}
              enterKeyHint="next"
              keyboardType="numeric"
              onChange={updateElementsEvents('cardExpirationDate')}
              onSubmitEditing={() => cardVerificationCodeRef.current?.focus()}
              placeholder="Card Expiration Date"
              placeholderTextColor="#99a0bf"
              style={styles.elements}
              textContentType="creditCardExpiration"
            />
            <CardVerificationCodeElement
              autoComplete="cc-csc"
              btRef={cardVerificationCodeRef}
              cvcLength={cvcLength}
              enterKeyHint="done"
              keyboardType="numeric"
              onChange={updateElementsEvents('cvc')}
              onSubmitEditing={() => cardVerificationCodeRef.current?.blur()}
              placeholder={'Security code'}
              placeholderTextColor="#99a0bf"
              style={styles.elements}
              textContentType="creditCardSecurityCode"
            />

            <Pressable
              disabled={!allFieldsComplete}
              onPress={createToken}
              style={{
                marginTop: 24,
                ...styles.button,
                opacity: allFieldsComplete ? 1 : 0.4,
              }}
            >
              <Text style={styles.buttonText}>{'Create token'}</Text>
            </Pressable>

            <Pressable
              onPress={updateToken}
              style={{
                ...styles.button,
              }}
            >
              <Text style={styles.buttonText}>{'Update Token'}</Text>
            </Pressable>

            <Pressable
              onPress={deleteToken}
              style={{
                ...styles.button,
              }}
            >
              <Text style={styles.buttonText}>{'Delete Token'}</Text>
            </Pressable>

            <Divider />

            <Pressable
              disabled={!allFieldsComplete}
              onPress={createTokenWithTokenize}
              style={{
                ...styles.button,
                opacity: allFieldsComplete ? 1 : 0.4,
              }}
            >
              <Text style={styles.buttonText}>{'Tokenize Data'}</Text>
            </Pressable>

            <Pressable
              disabled={!allFieldsComplete}
              onPress={encryptToken}
              style={{
                ...styles.button,
                opacity: allFieldsComplete ? 1 : 0.4,
              }}
            >
              <Text style={styles.buttonText}>{'Encrypt Token'}</Text>
            </Pressable>

            <Divider />

            <Pressable onPress={clearToken} style={styles.button}>
              <Text style={styles.buttonText}>{'Clear'}</Text>
            </Pressable>

            <Pressable
              onPress={() => setSamplePickerOpen(true)}
              style={styles.brandSelect}
            >
              <Text style={styles.brandSelectText}>
                {sampleBrand ?? 'Select a test card brand'}
              </Text>
            </Pressable>

            <Modal
              animationType="fade"
              onRequestClose={() => setSamplePickerOpen(false)}
              transparent
              visible={samplePickerOpen}
            >
              <Pressable
                onPress={() => setSamplePickerOpen(false)}
                style={styles.brandModalOverlay}
              >
                <View style={styles.brandModalCard}>
                  <Text style={styles.brandModalTitle}>Test card brand</Text>
                  <ScrollView>
                    {BRAND_SAMPLES.map((sample) => (
                      <Pressable
                        key={sample.label}
                        onPress={() => {
                          setSampleBrand(sample.label);
                          setSamplePickerOpen(false);
                          cardNumberRef.current?.setValue({
                            id: 'brand-sample',
                            format: () => sample.value,
                          });
                        }}
                        style={[
                          styles.brandOption,
                          sampleBrand === sample.label &&
                            styles.brandOptionSelected,
                        ]}
                      >
                        <Text style={styles.brandOptionText}>
                          {sample.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>

            {token && (
              <>
                <Divider />
                <Text style={styles.text}>TOKEN: </Text>

                <Text style={styles.text}>
                  {JSON.stringify(token, undefined, 2)}
                </Text>
              </>
            )}

            {tokenizedData && (
              <>
                <Divider />
                <Text style={styles.text}>TOKENIZED DATA: </Text>
                <Text style={styles.text}>
                  {JSON.stringify(tokenizedData, undefined, 2)}
                </Text>
              </>
            )}

            {encryptedToken && (
              <>
                <Divider />
                <Text style={styles.text}>ENCRYPTED TOKEN: </Text>
                <Text style={styles.text}>
                  {JSON.stringify(encryptedToken, undefined, 2)}
                </Text>
              </>
            )}
          </View>
        </BasisTheoryProvider>
      </ScrollView>
    </View>
  );
};
