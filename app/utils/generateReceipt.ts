import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const generateReceipt = async (transaction: any) => {
    const isFunding = transaction.type === 'WALLET_FUNDING';
    const amountStr = Number(transaction.amount).toLocaleString();
    const formattedDate = new Date(transaction.date || transaction.createdAt || new Date()).toLocaleString();

    let detailsHtml = '';

    detailsHtml += `
        <div class="row">
            <span class="label">Type</span>
            <span class="value">${transaction.type.replace('_', ' ')}</span>
        </div>
        <div class="row">
            <span class="label">Date</span>
            <span class="value">${formattedDate}</span>
        </div>
        <div class="row">
            <span class="label">Reference</span>
            <span class="value">${transaction.reference || transaction.id || 'No Reference'}</span>
        </div>
    `;

    if (transaction.type === 'ELECTRICITY') {
        const token = transaction.token || transaction.metadata?.token || transaction.pin || transaction.metadata?.pin;
        const units = transaction.units || transaction.metadata?.units;
        const meterNumber = transaction.meterNumber || transaction.metadata?.meterNumber || transaction.metadata?.meterNo;

        if (token || units || meterNumber) {
            detailsHtml += `
                <div style="margin-top: 16px; margin-bottom: 16px; padding: 20px; background-color: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 16px;">
                    <div style="font-size: 12px; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">
                        DETAILS
                    </div>
            `;

            if (token) {
                detailsHtml += `
                    <div class="row" style="padding: 8px 0; border-bottom: none;">
                        <span class="label" style="color: #64748B;">Token</span>
                        <span class="value" style="font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 800; color: #0F172A; letter-spacing: 0.5px;">
                            ${token}
                        </span>
                    </div>
                `;
            }
            if (units) {
                detailsHtml += `
                    <div class="row" style="padding: 8px 0; border-bottom: none;">
                        <span class="label" style="color: #64748B;">Units</span>
                        <span class="value" style="font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 800; color: #0F172A;">
                            ${units}
                        </span>
                    </div>
                `;
            }
            if (meterNumber) {
                detailsHtml += `
                    <div class="row" style="padding: 8px 0; border-bottom: none;">
                        <span class="label" style="color: #64748B;">Meter No</span>
                        <span class="value" style="font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 800; color: #0F172A;">
                            ${meterNumber}
                        </span>
                    </div>
                `;
            }

            detailsHtml += `</div>`;
        }
    }

    if (transaction.metadata?.planName) {
        detailsHtml += `
            <div class="row">
                <span class="label">Plan</span>
                <span class="value">${transaction.metadata.planName}</span>
            </div>
        `;
    }

    if (transaction.metadata?.network) {
        detailsHtml += `
            <div class="row">
                <span class="label">Network</span>
                <span class="value">${transaction.metadata.network}</span>
            </div>
        `;
    }

    const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
          .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #111827; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          .amount-section { text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px; }
          .amount-label { font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; }
          .amount-value { font-size: 36px; font-weight: bold; color: ${isFunding ? '#059669' : '#111827'}; margin: 10px 0; }
          .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .status.success { background-color: #def7ec; color: #03543f; }
          .status.pending { background-color: #fef3c7; color: #92400e; }
          .status.failed { background-color: #fde8e8; color: #9b1c1c; }
          .details { margin-top: 20px; }
          .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
          .row:last-child { border-bottom: none; }
          .label { color: #6b7280; font-weight: 500; }
          .value { font-weight: 600; color: #111827; text-align: right; max-width: 60%; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>Transaction Receipt</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="amount-section">
            <div class="amount-label">Amount</div>
            <div class="amount-value">${isFunding ? '+' : '-'}₦${amountStr}</div>
            <div class="status ${transaction.status?.toLowerCase() || ''}">${transaction.status || 'UNKNOWN'}</div>
          </div>

          <div class="details">
            ${detailsHtml}
          </div>

          <div class="footer">
            <p>Thank you for using our service.</p>
          </div>
        </div>
      </body>
    </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({ html });

        if (Platform.OS === 'android') {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
                // Fallback to sharing if permission denied or user cancelled
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
                }
                return;
            }

            const fileName = `Receipt_${transaction.reference || transaction.id}_${Date.now()}.pdf`;
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

            const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                'application/pdf'
            );

            await FileSystem.writeAsStringAsync(newFileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
            alert('Receipt saved successfully!');
        } else {
            // iOS: use sharing dialogue to let user save to Files or share
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                alert('Sharing is not available on this device');
            }
        }
    } catch (error) {
        console.error('Error generating receipt:', error);
        alert('Failed to save receipt. Please try again.');
    }
};

export default generateReceipt;
