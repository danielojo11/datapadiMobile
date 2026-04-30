import * as Contacts from 'expo-contacts';
import { Alert } from 'react-native';

export const pickContactPhone = async (): Promise<string | null> => {
    try {
        const { status } = await Contacts.requestPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please allow MUFTI PAY to access your contacts to easily select beneficiaries.');
            return null;
        }

        const contact = await Contacts.presentContactPickerAsync();

        if (contact && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            let phone = contact.phoneNumbers[0].number || '';
            // Strip all non-digit characters
            phone = phone.replace(/\D/g, '');
            // If it starts with Nigerian country code '234'
            if (phone.startsWith('234') && phone.length >= 12) {
                phone = '0' + phone.slice(3);
            }
            return phone;
        }
    } catch (error) {
        console.error('Error picking contact', error);
    }
    return null;
};
