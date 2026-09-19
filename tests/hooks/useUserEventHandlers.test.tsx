import { renderHook } from '@testing-library/react-native';
import { useUserEventHandlers } from '../../src/components/shared/useUserEventHandlers';
import { ElementType } from '../../src/BaseElementTypes';

describe('useUserEventHandlers', () => {
  // A transform makes the stored value differ from what the user typed, which
  // is the only way the change and submit events can disagree.
  const renderTransformed = (consumers: {
    onChange: jest.Mock;
    onSubmitEditing: jest.Mock;
  }) =>
    renderHook(() =>
      useUserEventHandlers({
        setElementValue: jest.fn(),
        element: {
          id: 'transformed-element',
          type: ElementType.TEXT,
          validatorOptions: { mask: [/\d/, /\d/, ' ', /\d/, /\d/] },
        },
        transform: [' ', ''],
        ...consumers,
      })
    );

  test('reports the same event to onSubmitEditing as to onChange', () => {
    const onChange = jest.fn();
    const onSubmitEditing = jest.fn();

    const { result } = renderTransformed({ onChange, onSubmitEditing });

    result.current._onChange('12 34');
    result.current._onSubmitEditing({} as never);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onSubmitEditing).toHaveBeenCalledWith(onChange.mock.lastCall?.[0]);
  });

  test('reports a satisfied mask on submit for a value the user completed', () => {
    const onChange = jest.fn();
    const onSubmitEditing = jest.fn();

    const { result } = renderTransformed({ onChange, onSubmitEditing });

    result.current._onChange('12 34');
    result.current._onSubmitEditing({} as never);

    expect(onSubmitEditing).toHaveBeenCalledWith(
      expect.objectContaining({ complete: true, maskSatisfied: true })
    );
  });
});
