import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { HtmlTemp } from '../(provider)/components/HtmlTemp';
import { Platform } from 'react-native';

const generatePDF = async ({ pins, batches }: { pins?: any[], batches?: any[] }) => {
    const html = HtmlTemp({
        pins,
        batches,
        currency: '₦'
    });

    const { uri } = await Print.printToFileAsync({
        html,
        width: 595,
        height: 842,
    });

    if (Platform.OS !== 'android') {
        alert('Direct Downloads saving is only supported on Android.');
        return;
    }

    try {
        // Ask user to pick Downloads folder
        const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
            alert('Permission denied');
            return;
        }

        const fileName = `MUFTI_PAY_Vouchers_${Date.now()}.pdf`;

        // Read the generated PDF as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Create file in selected directory
        const newFileUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                'application/pdf'
            );

        // Write file
        await FileSystem.writeAsStringAsync(newFileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
        });

        alert('Saved to Downloads successfully');
    } catch (error) {
        console.error(error);
    }
};

export default generatePDF;