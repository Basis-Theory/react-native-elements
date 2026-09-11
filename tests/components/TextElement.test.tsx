/**
 * @format
 */

import 'react-native';
import React from 'react';

import {
  act,
  render,
  fireEvent,
  screen,
  userEvent,
} from '@testing-library/react-native';
import { TextElement } from '../../src';
import type { BTRef } from '../../src';

describe('TextElement', () => {
  describe('clear', () => {
    test('emits an onChange event so consumers can reset derived state', () => {
      const onChange = jest.fn();
      const btRef = React.createRef<BTRef>();

      render(
        <TextElement
          btRef={btRef}
          onChange={onChange}
          placeholder="Name"
          style={{}}
        />
      );

      fireEvent.changeText(screen.getByPlaceholderText('Name'), 'John Doe');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ empty: false })
      );

      onChange.mockClear();

      act(() => {
        btRef.current?.clear();
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ empty: true })
      );
    });

    test('emits the change event to the latest onChange callback', () => {
      const firstOnChange = jest.fn();
      const latestOnChange = jest.fn();
      const btRef = React.createRef<BTRef>();
      const { rerender } = render(
        <TextElement
          btRef={btRef}
          onChange={firstOnChange}
          placeholder="Name"
          style={{}}
        />
      );

      rerender(
        <TextElement
          btRef={btRef}
          onChange={latestOnChange}
          placeholder="Name"
          style={{}}
        />
      );

      act(() => {
        btRef.current?.clear();
      });

      expect(firstOnChange).not.toHaveBeenCalled();
      expect(latestOnChange).toHaveBeenCalledTimes(1);
    });

    test('publishes the ref once to a stable callback ref', () => {
      const published: unknown[] = [];

      const Harness = () => {
        const [, setBtRef] = React.useState<BTRef | null>(null);
        const [, forceRender] = React.useState(0);
        const btRef = React.useCallback((value: BTRef) => {
          published.push(value);
          setBtRef(value);
        }, []);

        return (
          <>
            <TextElement
              btRef={btRef}
              onChange={() => forceRender((count) => count + 1)}
              placeholder="Name"
              style={{}}
            />
          </>
        );
      };

      render(<Harness />);

      expect(published).toHaveLength(1);
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
