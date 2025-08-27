import React, { useState, useMemo, useCallback } from 'react';
import { Text, View, TouchableOpacity, Modal, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { CardBrand } from '../CardElementTypes';
import { labelizeCardBrand } from '../utils/shared';

interface BrandPickerProps {
  brands: CardBrand[];
  selectedBrand: CardBrand | undefined;
  onBrandSelect: (brand: CardBrand | undefined) => void;
  style?: ViewStyle;
}

const defaultStyles = {
  container: {
    marginBottom: 10,
  },
  buttonText: {
    color: '#374151',
    fontSize: 16,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 250,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  modalTitle: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  scrollView: {
    maxHeight: 200,
  },
  optionButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: '#d1d5db',
  },
  selectedOption: {
    backgroundColor: '#f3f4f6',
  },
  optionText: {
    color: '#374151',
    fontSize: 16,
    textAlign: 'center' as const,
  },
};

const isTextStyle = (style: any): style is TextStyle => {
  return style && typeof style === 'object' && 'color' in style;
};

export const BrandPicker: React.FC<BrandPickerProps> = ({
  brands,
  selectedBrand,
  onBrandSelect,
  style,
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);

  const buttonTextStyle = useMemo(() => {
    if (isTextStyle(style) && style.color) {
      return { color: style.color };
    }
    return defaultStyles.buttonText;
  }, [style]);

  const displayText = useMemo(() => {
    return selectedBrand ? labelizeCardBrand(selectedBrand as CardBrand) : 'Select card brand';
  }, [selectedBrand]);

  const shouldRender = useMemo(() => brands.length > 0, [brands]);

  const handleShowPicker = useCallback(() => {
    setPickerVisible(true);
  }, []);

  const handleHidePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const handleBrandSelect = useCallback((brand: any) => {
    onBrandSelect(brand);
    setPickerVisible(false);
  }, [onBrandSelect]);


  if (!shouldRender) {
    return null;
  }

  return (
    <View style={defaultStyles.container}>
      <TouchableOpacity
        onPress={handleShowPicker}
        style={[style]}
      >
        <Text style={buttonTextStyle}>
          {displayText}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleHidePicker}
      >
        <TouchableOpacity
          style={defaultStyles.modalOverlay}
          onPress={handleHidePicker}
        >
          <View style={defaultStyles.modalContainer}>
            <Text style={defaultStyles.modalTitle}>
              Select Card Brand
            </Text>
            <ScrollView style={defaultStyles.scrollView}>
              {brands.map((brand, index) => (
                <TouchableOpacity
                  key={brand}
                  onPress={() => handleBrandSelect(brand)}
                  style={[
                    defaultStyles.optionButton,
                    {
                      borderBottomWidth: index === brands.length - 1 ? 0 : 1,
                    },
                    selectedBrand === brand && defaultStyles.selectedOption,
                  ]}
                >
                  <Text style={defaultStyles.optionText}>
                    {labelizeCardBrand(brand)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
