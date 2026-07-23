import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const generateReceipt = async (transaction: any) => {
  const isFunding = transaction.type === 'WALLET_FUNDING';
  const amountStr = Number(transaction.amount).toLocaleString();
  const dateObj = new Date(transaction.date || transaction.createdAt || new Date());
  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let detailsHtml = '';

  detailsHtml += `
        <div class="row">
            <span class="label">Date</span>
            <span class="value">${formattedDate}</span>
        </div>
        <div class="row">
            <span class="label">Reference</span>
            <span class="value">${transaction.reference || transaction.id || 'No Reference'}</span>
        </div>
        <div class="row">
            <span class="label">Description</span>
            <span class="value">${transaction.type.replace('_', ' ')}</span>
        </div>
    `;

  const userPhone = transaction.data?.user?.phoneNumber || transaction.user?.phoneNumber || transaction.user?.phonenumber;
  if (userPhone) {
    detailsHtml += `
            <div class="row">
                <span class="label">Customer Phone</span>
                <span class="value">${userPhone}</span>
            </div>
        `;
  }
  const addressStr = transaction.address || transaction.metadata?.address;
  if (addressStr) {
    detailsHtml += `
            <div class="row">
                <span class="label">Address</span>
                <span class="value" style="font-size: 13px; line-height: 1.4; word-break: break-word;">${addressStr}</span>
            </div>
        `;
  }

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

  if (transaction.metadata?.phoneNumber || transaction.metadata?.recipient || transaction.metadata?.user?.phoneNumber || transaction.user?.phoneNumber) {
    const phoneToDisplay = transaction.metadata?.phoneNumber || transaction.metadata?.recipient || transaction.metadata?.user?.phoneNumber || transaction.user?.phoneNumber;
    const isAirtimeOrData = transaction.type === 'AIRTIME' || transaction.type === 'DATA';
    const labelToDisplay = isAirtimeOrData ? 'Phone Number' : 'Beneficiary';
    detailsHtml += `
            <div class="row">
                <span class="label">${labelToDisplay}</span>
                <span class="value">${phoneToDisplay}</span>
            </div>
        `;
  }



  let base64Logo = '';
  try {
    const asset = Asset.fromModule(require('../../assets/images/splash-screen.png'));
    await asset.downloadAsync();
    const localUri = asset.localUri || asset.uri;
    if (localUri) {
      base64Logo = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
    }
  } catch (e) {
    console.warn('Could not load logo for receipt', e);
  }

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            padding: 20px; 
            background-color: #F8FAFC; 
            color: #111827; 
          }
          .receipt-container { 
            max-width: 480px; 
            margin: 0 auto; 
            background-color: #FFFFFF; 
            border-radius: 16px; 
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); 
            overflow: hidden;
          }
          .top-section {
            background: linear-gradient(135deg, #2A2568 0%, #6D28D9 100%);
            padding: 32px;
            color: #FFFFFF;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
          }
          .logo-img {
            height: 32px;
            object-fit: contain;
          }
          .receipt-id-area {
            text-align: right;
          }
          .receipt-label {
            font-size: 11px;
            color: rgba(255,255,255,0.6);
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 4px;
            font-weight: 600;
          }
          .receipt-id {
            font-size: 11px;
            color: rgba(255,255,255,0.5);
            font-family: monospace;
          }
          .amount-label {
            font-size: 11px;
            color: rgba(255,255,255,0.6);
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .amount-value {
            font-size: 42px;
            font-weight: 800;
            color: #FFFFFF;
            letter-spacing: -1px;
            margin-bottom: 24px;
          }
          .badges-row {
            display: flex;
            gap: 12px;
            align-items: center;
          }
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background-color: #FEF3C7;
            color: #D97706;
            padding: 6px 16px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .status-badge.success { background-color: #FFFFFF; color: #10B981; }
          .status-badge.failed { background-color: #FFFFFF; color: #EF4444; }
          .status-badge.pending { background-color: #FFFFFF; color: #D97706; }
          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 3px;
            background-color: currentColor;
          }
          .type-badge {
            background-color: rgba(255,255,255,0.15);
            color: #FFFFFF;
            padding: 6px 16px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
          }
          
          .bottom-section {
            padding: 32px;
            background-color: #FFFFFF;
          }
          .section-title {
            font-size: 11px;
            font-weight: 800;
            color: #9CA3AF;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 20px;
          }
          .details-list {
            display: flex;
            flex-direction: column;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 16px 0;
            border-bottom: 1px solid #F3F4F6;
          }
          .label {
            color: #9CA3AF;
            font-size: 13px;
            font-weight: 500;
          }
          .value {
            color: #111827;
            font-size: 13px;
            font-weight: 700;
            text-align: right;
            max-width: 65%;
            word-break: break-all;
          }
          .divider {
            border-top: 1px dashed #E5E7EB;
            margin: 24px 0;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .footer-brand-title {
            font-size: 13px;
            font-weight: 800;
            color: #1E1B4B;
            margin-bottom: 4px;
          }
          .footer-brand-sub {
            font-size: 11px;
            color: #9CA3AF;
          }
          .footer-date {
            font-size: 11px;
            color: #D1D5DB;
            text-align: right;
            margin-bottom: 4px;
          }
          .footer-note {
            font-size: 11px;
            color: #E5E7EB;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Top Section -->
          <div class="top-section">
            <div class="header-row">
              ${base64Logo ? '<img src="data:image/png;base64,' + base64Logo + '" class="logo-img" />' : '<div><span style="font-weight:800;font-size:18px;">MuftiPay</span></div>'}
              <div class="receipt-id-area">
                <div class="receipt-label">RECEIPT</div>
                <div class="receipt-id">#${(transaction.reference || transaction.id || '').toString().slice(-12).toUpperCase()}</div>
              </div>
            </div>

            <div class="amount-label">TOTAL AMOUNT</div>
            <div class="amount-value">${isFunding ? '+' : '-'}₦${amountStr}</div>
            
            <div class="badges-row">
              <div class="status-badge ${transaction.status?.toLowerCase() || 'success'}">
                <span class="status-dot"></span>
                ${(transaction.status || 'SUCCESS').toUpperCase()}
              </div>
              <div class="type-badge">${transaction.type.replace('_', ' ')}</div>
            </div>
          </div>

          <!-- Bottom Section -->
          <div class="bottom-section">
            <div class="section-title">TRANSACTION DETAILS</div>
            <div class="details-list">
              ${detailsHtml}
            </div>

            <div class="divider"></div>

            <div class="footer">
              <div>
                <div class="footer-brand-title">MuftiPay</div>
                <div class="footer-brand-sub">Secure · Fast · Reliable</div>
              </div>
              <div style="text-align: right;">
                <div class="footer-date">Generated ${formattedDate}</div>
                <div class="footer-note">This is an automated receipt</div>
              </div>
            </div>
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
