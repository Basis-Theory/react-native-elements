import { renderHook } from '@testing-library/react-native';
import { useCleanupStateBeforeUnmount } from '../../src/components/shared/useCleanStateOnUnmount';
import { _elementErrors, _elementValues, networkErrorKey, binLookupPendingKey } from '../../src/ElementValues';

describe('useCleanupStateBeforeUnmount', () => {
  const testId = 'test-element-id';

  beforeEach(() => {
    // Reset state before each test
    Object.keys(_elementValues).forEach((key) => delete _elementValues[key]);
    Object.keys(_elementErrors).forEach((key) => delete _elementErrors[key]);
  });

  afterAll(() => {
    Object.keys(_elementValues).forEach((key) => delete _elementValues[key]);
    Object.keys(_elementErrors).forEach((key) => delete _elementErrors[key]);
  });

  test('cleans up element value on unmount', () => {
    _elementValues[testId] = 'test-value';

    const { unmount } = renderHook(() => useCleanupStateBeforeUnmount(testId));

    expect(_elementValues[testId]).toBe('test-value');

    unmount();

    expect(_elementValues[testId]).toBeUndefined();
  });

  test('cleans up element error on unmount', () => {
    _elementErrors[testId] = 'some-error';

    const { unmount } = renderHook(() => useCleanupStateBeforeUnmount(testId));

    expect(_elementErrors[testId]).toBe('some-error');

    unmount();

    expect(_elementErrors[testId]).toBeUndefined();
  });

  test('cleans up network error on unmount', () => {
    const netErrorKey = networkErrorKey(testId);
    _elementErrors[netErrorKey] = 'network_not_selected';

    const { unmount } = renderHook(() => useCleanupStateBeforeUnmount(testId));

    expect(_elementErrors[netErrorKey]).toBe('network_not_selected');

    unmount();

    expect(_elementErrors[netErrorKey]).toBeUndefined();
  });

  test('cleans up bin lookup pending error on unmount', () => {
    const pendingKey = binLookupPendingKey(testId);
    _elementErrors[pendingKey] = 'bin_lookup_pending';

    const { unmount } = renderHook(() => useCleanupStateBeforeUnmount(testId));

    expect(_elementErrors[pendingKey]).toBe('bin_lookup_pending');

    unmount();

    expect(_elementErrors[pendingKey]).toBeUndefined();
  });

  test('cleans up all error types on unmount', () => {
    const netErrorKey = networkErrorKey(testId);
    const pendingKey = binLookupPendingKey(testId);

    _elementValues[testId] = 'test-value';
    _elementErrors[testId] = 'validation-error';
    _elementErrors[netErrorKey] = 'network_not_selected';
    _elementErrors[pendingKey] = 'bin_lookup_pending';

    const { unmount } = renderHook(() => useCleanupStateBeforeUnmount(testId));

    // All should exist before unmount
    expect(_elementValues[testId]).toBe('test-value');
    expect(_elementErrors[testId]).toBe('validation-error');
    expect(_elementErrors[netErrorKey]).toBe('network_not_selected');
    expect(_elementErrors[pendingKey]).toBe('bin_lookup_pending');

    unmount();

    // All should be cleaned up after unmount
    expect(_elementValues[testId]).toBeUndefined();
    expect(_elementErrors[testId]).toBeUndefined();
    expect(_elementErrors[netErrorKey]).toBeUndefined();
    expect(_elementErrors[pendingKey]).toBeUndefined();
  });

  test('does not affect other element IDs on unmount', () => {
    const otherId = 'other-element-id';
    _elementValues[testId] = 'test-value';
    _elementValues[otherId] = 'other-value';
    _elementErrors[otherId] = 'other-error';

    const { unmount } = renderHook(() => useCleanupStateBeforeUnmount(testId));

    unmount();

    // testId should be cleaned up
    expect(_elementValues[testId]).toBeUndefined();

    // otherId should remain
    expect(_elementValues[otherId]).toBe('other-value');
    expect(_elementErrors[otherId]).toBe('other-error');
  });
});
