import { StyleSheet } from 'react-native';

const spacing = {
  marginLeft: 6,
  marginRight: 6,
  marginTop: 12,
  padding: 10,
};

const buttonSpacing = {
  margin: 6,
  paddingBottom: 2,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 2,
};

export const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    borderColor: '#00d2ef',
    borderRadius: 4,
    borderWidth: 1,
    color: '#00d2ef',
    width: 150,
    paddingHorizontal: '5%',
    ...buttonSpacing,
  },
  buttonDisabled: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    width: 150,
    ...buttonSpacing,
  },
  buttonText: {
    color: '#00d2ef',
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  elements: {
    backgroundColor: 'transparent',
    borderColor: '#d1d7ff26',
    borderRadius: 4,
    borderWidth: 1,
    color: '#99a0bf',
    height: 40,
    ...spacing,
  },
  brandSelect: {
    borderColor: '#d1d7ff26',
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 6,
    marginRight: 6,
    marginTop: 12,
    padding: 10,
  },
  brandSelectText: {
    color: '#99a0bf',
    fontSize: 16,
  },
  brandModalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    justifyContent: 'center',
  },
  brandModalCard: {
    backgroundColor: '#121324',
    borderColor: '#d1d7ff26',
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 420,
    minWidth: 260,
  },
  brandModalTitle: {
    borderBottomColor: '#d1d7ff26',
    borderBottomWidth: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 14,
    textAlign: 'center',
  },
  brandOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandOptionSelected: {
    backgroundColor: '#00d2ef1a',
  },
  brandOptionText: {
    color: '#99a0bf',
    fontSize: 15,
    textAlign: 'center',
  },
  divider: {
    ...buttonSpacing,
    margin: 5,
    borderBottomColor: '#d1d7ff26',
    borderBottomWidth: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
  viewContainer: {
    height: '100%',
  },
});
