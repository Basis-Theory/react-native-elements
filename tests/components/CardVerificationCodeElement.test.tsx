/**
 * @format
 */

import 'react-native';
import React from 'react';
import { CardVerificationCodeElement } from '../../src/components/CardVerificationCodeElement';

import { act, render, fireEvent, screen } from '@testing-library/react-native';
import type { BTRef } from '../../src';

describe('CardVerificationCodeElement', () => {
  describe('clear', () => {
    test('emits an onChange event so consumers can reset derived state', () => {
      const onChange = jest.fn();
      const btRef = React.createRef<BTRef>();

      render(
        <CardVerificationCodeElement
          btRef={btRef}
          onChange={onChange}
          placeholder="CVC"
          style={{}}
        />
      );

      fireEvent.changeText(screen.getByPlaceholderText('CVC'), '123');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ complete: true, empty: false })
      );

      onChange.mockClear();

      act(() => {
        btRef.current?.clear();
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ complete: false, empty: true })
      );
    });
  });

  const mockedRef = {
    current: {
      id: '123',
      format: () => '',
      clear: () => {},
      setValue: () => {},
      focus: () => {},
      blur: () => {},
    },
  };

  describe('mask', () => {
    test.each([3, 4])(
      'applies mask correctly with cvcLength = %d',
      (cvcLength) => {
        render(
          <CardVerificationCodeElement
            btRef={mockedRef}
            placeholder="CVC"
            cvcLength={cvcLength}
            style={{}}
          />
        );

        const el = screen.getByPlaceholderText('CVC');

        fireEvent.changeText(el, '12345');

        const expectedValue = cvcLength === 3 ? '123' : '1234';

        expect(el.props.value).toStrictEqual(expectedValue);
      }
    );
  });

  test('forwards keyboard behavior props', () => {
    render(
      <CardVerificationCodeElement
        autoComplete="cc-csc"
        btRef={mockedRef}
        cvcLength={3}
        enterKeyHint="done"
        inputAccessoryViewID="card-input-accessory"
        placeholder="CVC"
        returnKeyType="done"
        style={{}}
        textContentType="creditCardSecurityCode"
      />
    );

    const el = screen.getByPlaceholderText('CVC');

    expect(el).toHaveProp('autoComplete', 'cc-csc');
    expect(el).toHaveProp('enterKeyHint', 'done');
    expect(el).toHaveProp('inputAccessoryViewID', 'card-input-accessory');
    expect(el).toHaveProp('returnKeyType', 'done');
    expect(el).toHaveProp('textContentType', 'creditCardSecurityCode');
  });

  describe('Validation and Change Events', () => {
    test.each([
      [
        'should error: incomplete',
        '1',
        {
          complete: false,
          empty: false,
          errors: [{ targetId: 'cvc', type: 'incomplete' }],
          maskSatisfied: false,
          valid: false,
        },
        '1',
      ],
      [
        'prevents addition of chars that do not belong to the mask',
        '#####',
        {
          complete: false,
          empty: true,
          maskSatisfied: false,
          valid: false,
        },
        '',
      ],
      [
        `shouldn't error`,
        '123',
        {
          complete: true,
          maskSatisfied: true,
          valid: true,
          empty: false,
        },
        '123',
      ],
    ])('input: %s', (_, inputValue, expectedEvent, expectedValue) => {
      const onChange = jest.fn();

      render(
        <CardVerificationCodeElement
          btRef={mockedRef}
          placeholder="CVC"
          cvcLength={3}
          style={{}}
          onChange={onChange}
        />
      );

      const el = screen.getByPlaceholderText('CVC');

      fireEvent.changeText(el, inputValue);

      expect(el.props.value).toStrictEqual(expectedValue);
      expect(onChange).toHaveBeenCalledWith(expectedEvent);
    });
  });

  describe('OnBlur', () => {
    test('triggers event', () => {
      const onBlur = jest.fn();

      render(
        <CardVerificationCodeElement
          btRef={mockedRef}
          placeholder="CVC"
          cvcLength={3}
          style={{}}
          onBlur={onBlur}
        />
      );

      const el = screen.getByPlaceholderText('CVC');

      fireEvent(el, 'blur');

      expect(onBlur).toHaveBeenCalledWith({
        complete: false,
        empty: true,
        errors: undefined,
        maskSatisfied: false,
        valid: false,
      });
    });
  });

  describe('OnFocus', () => {
    test('triggers event', () => {
      const onFocus = jest.fn();

      render(
        <CardVerificationCodeElement
          btRef={mockedRef}
          placeholder="CVC"
          cvcLength={3}
          style={{}}
          onFocus={onFocus}
        />
      );

      const el = screen.getByPlaceholderText('CVC');

      fireEvent(el, 'focus');

      expect(onFocus).toHaveBeenCalledWith({
        complete: false,
        empty: true,
        errors: undefined,
        maskSatisfied: false,
        valid: false,
      });
    });
  });

  describe('OnSubmitEditing', () => {
    test('triggers event', () => {
      const onSubmitEditing = jest.fn();

      render(
        <CardVerificationCodeElement
          btRef={mockedRef}
          placeholder="CVC"
          cvcLength={3}
          style={{}}
          onSubmitEditing={onSubmitEditing}
        />
      );

      const el = screen.getByPlaceholderText('CVC');

      fireEvent(el, 'submitEditing');

      expect(onSubmitEditing).toHaveBeenCalledWith({
        complete: false,
        empty: true,
        errors: undefined,
        maskSatisfied: false,
        valid: false,
      });
    });

    test('does not hand the native event payload to the consumer', () => {
      const onSubmitEditing = jest.fn();

      render(
        <CardVerificationCodeElement
          btRef={mockedRef}
          placeholder="CVC"
          cvcLength={3}
          style={{}}
          onSubmitEditing={onSubmitEditing}
        />
      );

      const el = screen.getByPlaceholderText('CVC');

      fireEvent.changeText(el, '123');
      fireEvent(el, 'submitEditing', { nativeEvent: { text: '123' } });

      const event = onSubmitEditing.mock.calls[0][0];

      expect(event).not.toHaveProperty('nativeEvent');
      expect(event).toStrictEqual({
        complete: true,
        empty: false,
        errors: undefined,
        maskSatisfied: true,
        valid: true,
      });
    });
  });
});
