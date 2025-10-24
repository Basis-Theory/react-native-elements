import type { CreateEvent } from '../../BaseElementTypes';
import { ElementType } from '../../BaseElementTypes';
import { useElementValidation } from './useElementValidation';
import { has, isEmpty } from 'ramda';
import { useMemo } from 'react';
import { useCardMetadata } from './useCardMetadata';
import { extractDigits, isNilOrEmpty } from '../../utils/shared';
import { _elementErrors } from '../../ElementValues';
import { ValidatorOptions } from '../../utils/validation';
import { BinInfo } from '../../CardElementTypes';
import { CardBrand } from '../../CardElementTypes';

type UseElementEventProps = {
  type: ElementType;
  id: string;
  validatorOptions?: ValidatorOptions;
  binInfo?: BinInfo;
  selectedNetwork?: CardBrand;
  binLookup?: boolean;
  coBadgedSupport?: CardBrand[];
  brandOptionsCount?: number;
};

export const useElementEvent = ({
  type,
  id,
  validatorOptions,
  binInfo,
  selectedNetwork,
  binLookup,
  coBadgedSupport,
  brandOptionsCount,
}: UseElementEventProps): CreateEvent => {
  const { getValidationStrategy } = useElementValidation();
  const { getMetadataFromCardNumber: _getMetadataFromCardNumber } =
    useCardMetadata();

  const validator = useMemo(() => getValidationStrategy(type), [type]);

  const validate = (value: string) => {
    const error = validator(value, validatorOptions);

    if (error && isNilOrEmpty(_elementErrors[id])) _elementErrors[id] = error;

    if (!error && has(id, _elementErrors)) delete _elementErrors[id];

    return error
      ? [
          {
            targetId: type,
            type: error,
          },
        ]
      : undefined;
  };

  const getMetadataFromCardNumber = (value: string) => {
    if (type !== ElementType.CARD_NUMBER) return undefined;

    const { cvcLength, cardBin, cardLast4, brand, lengths } =
      _getMetadataFromCardNumber(value);

    return {
      card: {
        cvcLength,
        cardBin,
        cardLast4,
        brand,
      },
      lengths,
    };
  };

  return (value: string) => {
    const metadata = getMetadataFromCardNumber(value);
    const empty = isEmpty(value);
    let errors = validate(value);
    
    // Check if selectedNetwork is required but not set
    const requiresNetworkSelection = !isNilOrEmpty(coBadgedSupport) && (brandOptionsCount ?? 0) > 1;
    const networkNotSelected = requiresNetworkSelection && !selectedNetwork;
    
    // Add network selection error if required but not selected
    if (networkNotSelected && !empty) {
      const networkError = {
        targetId: type,
        type: 'network_not_selected' as const,
      };
      errors = errors ? [...errors, networkError] : [networkError];
    }
    
    const valid = !empty && !errors && !networkNotSelected;

    const mask = validatorOptions?.mask ?? [];
    const maskSatisfied = mask
      ? (metadata?.lengths?.includes(extractDigits(value)?.length ?? 0) ??
        mask.length === value.length)
      : true;

    const complete = !errors && maskSatisfied && !networkNotSelected;

    return {
      empty,
      errors,
      valid,
      maskSatisfied,
      complete,
      ...metadata?.card,
      ...(binLookup ? { binInfo } : {}),
      ...(requiresNetworkSelection ? { selectedNetwork } : {}),
    };
  };
};
