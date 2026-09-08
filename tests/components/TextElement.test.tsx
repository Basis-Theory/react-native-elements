/**
 * @format
 */

import 'react-native';
import React from 'react';

import {
  render,
  fireEvent,
  screen,
  userEvent,
} from '@testing-library/react-native';
import { TextElement } from '../../src';

describe('TextElement', () => {
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

  describe('Events', () => {
    describe('OnChange w/ mask', () => {
      test.each([
        [
          'should error',
          '1',
          {
            complete: false,
            empty: false,
            errors: [{ targetId: 'text', type: 'incomplete' }],
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
          '1234567890',
          {
            complete: true,
            maskSatisfied: true,
            valid: true,
            empty: false,
          },
          '123-45-6789',
        ],
      ])('input: %s', (_, inputValue, expectedEvent, expectedValue) => {
        const onChange = jest.fn();

        render(
          <TextElement
            btRef={mockedRef}
            placeholder="SSN"
            mask={[
              /\d/u,
              /\d/u,
              /\d/u,
              '-',
              /\d/u,
              /\d/u,
              '-',
              /\d/u,
              /\d/u,
              /\d/u,
              /\d/u,
            ]}
            style={{}}
            onChange={onChange}
          />
        );

        const el = screen.getByPlaceholderText('SSN');

        fireEvent.changeText(el, inputValue);

        expect(el.props.value).toStrictEqual(expectedValue);
        expect(onChange).toHaveBeenCalledWith(expectedEvent);
      });
    });
  });

  test('forwards keyboard behavior props', () => {
    render(
      <TextElement
        autoComplete="name"
        btRef={mockedRef}
        enterKeyHint="done"
        inputAccessoryViewID="text-input-accessory"
        placeholder="Name"
        returnKeyType="done"
        style={{}}
      />
    );

    const el = screen.getByPlaceholderText('Name');

    expect(el).toHaveProp('autoComplete', 'name');
    expect(el).toHaveProp('enterKeyHint', 'done');
    expect(el).toHaveProp('inputAccessoryViewID', 'text-input-accessory');
    expect(el).toHaveProp('returnKeyType', 'done');
  });

  describe('OnBlur', () => {
    test('triggers event', () => {
      const onBlur = jest.fn();

      render(
        <TextElement
          btRef={mockedRef}
          placeholder="SSN"
          mask={[
            /\d/u,
            /\d/u,
            /\d/u,
            '-',
            /\d/u,
            /\d/u,
            '-',
            /\d/u,
            /\d/u,
            /\d/u,
            /\d/u,
          ]}
          style={{}}
          onBlur={onBlur}
        />
      );

      const el = screen.getByPlaceholderText('SSN');

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
        <TextElement
          btRef={mockedRef}
          placeholder="SSN"
          mask={[
            /\d/u,
            /\d/u,
            /\d/u,
            '-',
            /\d/u,
            /\d/u,
            '-',
            /\d/u,
            /\d/u,
            /\d/u,
            /\d/u,
          ]}
          style={{}}
          onFocus={onFocus}
        />
      );

      const el = screen.getByPlaceholderText('SSN');

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
        <TextElement
          btRef={mockedRef}
          placeholder="Name"
          style={{}}
          onSubmitEditing={onSubmitEditing}
        />
      );

      const el = screen.getByPlaceholderText('Name');

      fireEvent(el, 'submitEditing');

      expect(onSubmitEditing).toHaveBeenCalledWith({
        complete: true,
        empty: true,
        errors: undefined,
        maskSatisfied: true,
        valid: false,
      });
    });

    test('does not hand the native event payload to the consumer', () => {
      const onSubmitEditing = jest.fn();

      render(
        <TextElement
          btRef={mockedRef}
          placeholder="Name"
          style={{}}
          onSubmitEditing={onSubmitEditing}
        />
      );

      const el = screen.getByPlaceholderText('Name');

      fireEvent.changeText(el, 'Jane Roe');
      fireEvent(el, 'submitEditing', { nativeEvent: { text: 'Jane Roe' } });

      const event = onSubmitEditing.mock.calls[0][0];

      expect(event).not.toHaveProperty('nativeEvent');
      expect(JSON.stringify(event)).not.toContain('Jane Roe');
    });
  });
});
