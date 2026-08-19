import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const val = (v: string | undefined | null) => (v && v.trim() && v.trim() !== '—' ? v.trim() : '—');

const getBase64Image = async (assetModule: any) => {
    try {
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        const localUri = asset.localUri || asset.uri;
        if (localUri) {
            return `data:image/jpeg;base64,${await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 })}`;
        }
    } catch (e) {
        console.warn('Could not load asset', e);
    }
    return '';
};

export const generateVerificationPDF = async (
    data: any,
    viewType: 'document' | 'slip' | 'card' = 'document',
    verificationType: 'NIN' | 'BVN' = 'NIN'
) => {
    try {
        let contentHtml = '';

        const photoSrc = data.photo || data.base64Image
            ? (data.photo || data.base64Image)?.startsWith('data:')
                ? (data.photo || data.base64Image)
                : `data:image/jpeg;base64,${data.photo || data.base64Image}`
            : null;

        const ninNumber = data.nin || '—';
        const refNumber = data.verificationRef || data.verification?.reference || `MFT-NIN-${Math.floor(100000 + Math.random() * 900000)}`;
        const ts = data.generatedAt || new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=H&margin=0&data=${encodeURIComponent(
            `${verificationType}:${ninNumber}|REF:${refNumber}|AUTH:MUFTIPAY`
        )}`;

        if (viewType === 'document') {
            const logoDataUrl = await getBase64Image(require('../../assets/images/splash-screen.png'));

            const surname = val(data.surname || data.lastname);
            const firstname = val(data.firstname);
            const middlename = val(data.middlename);
            const dob = data.birthdate || data.dateOfBirth || '—';
            const sex = (data.gender || '—').toUpperCase();
            const phone = val(data.telephoneno || data.phone);

            contentHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8"/>
              <style>
                @page { size: auto; margin: 10mm; }
                body { margin: 0; padding: 0; background: #ffffff !important; font-family: Arial, sans-serif; color: #1e293b; }
                .fmt-row { display: flex; width: 100%; border-bottom: 1px solid #e2e8f0; }
                .fmt-col { flex: 1; padding: 7px 12px; border-right: 1px solid #e2e8f0; }
                .fmt-col:last-child { border-right: none; }
                .lbl { display: block; font-size: 8px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 2px; }
                .val { font-size: 11.5px; font-weight: 500; color: #1e293b; }
              </style>
            </head>
            <body>
            <div style="width:100%; max-width:740px; margin: 0 auto; box-sizing:border-box;">
              <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:2px solid #1e293b;margin-bottom:20px;">
                ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:46px;object-fit:contain;" alt="Logo"/>` : '<div style="font-size:18px;font-weight:800;">MuftiPay</div>'}
                <div style="text-align:right;">
                  <div style="font-size:15px;font-weight:700;text-transform:uppercase;">Identity Verification Report</div>
                  <div style="font-size:10px;color:#64748b;margin-top:3px;">Issued by MuftiPay Identity & KYC Services</div>
                </div>
              </div>
              <div style="border:1px solid #1e293b;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;">${verificationType} Verification Certificate</div>
                  <div style="font-size:9px;color:#64748b;">Federal Republic of Nigeria · Identity Management</div>
                </div>
                <div style="text-align:right;border-left:1px solid #cbd5e1;padding-left:18px;">
                  <div class="lbl">Date Issued</div>
                  <div class="val">${ts}</div>
                  <div class="lbl" style="margin-top:5px;">Reference</div>
                  <div class="val" style="font-family:monospace;">${refNumber}</div>
                </div>
              </div>
              
              <div style="display:flex;gap:20px;margin-bottom:20px;align-items:flex-start;">
                <div style="width:120px;display:flex;flex-direction:column;align-items:center;gap:10px;">
                  <div style="width:120px;height:148px;border:1px solid #cbd5e1;background:#f1f5f9;">
                    ${photoSrc ? `<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;" />` : '<div style="font-size:8px;text-align:center;margin-top:50px;">NO PHOTO</div>'}
                  </div>
                  <img src="${qrUrl}" style="width:76px;height:76px;border:1px solid #e2e8f0;display:block;" />
                </div>
                <div style="flex:1;">
                  <div style="border:1.5px solid #1e293b;padding:10px 14px;margin-bottom:12px;">
                    <div class="lbl">Identification Number (${verificationType})</div>
                    <div style="font-size:28px;font-weight:700;font-family:monospace;letter-spacing:0.18em;">${ninNumber}</div>
                  </div>
                  <div style="border:1px solid #e2e8f0;">
                    <div class="fmt-row">
                      <div class="fmt-col"><span class="lbl">Surname</span><span class="val">${surname}</span></div>
                      <div class="fmt-col"><span class="lbl">First Name</span><span class="val">${firstname}</span></div>
                    </div>
                    <div class="fmt-row">
                      <div class="fmt-col"><span class="lbl">Middle Name</span><span class="val">${middlename}</span></div>
                      <div class="fmt-col"><span class="lbl">Date of Birth</span><span class="val">${dob}</span></div>
                    </div>
                    <div class="fmt-row">
                      <div class="fmt-col"><span class="lbl">Gender</span><span class="val">${sex}</span></div>
                      <div class="fmt-col"><span class="lbl">Telephone</span><span class="val">${phone}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </body>
            </html>
            `;
        } else if (viewType === 'slip') {
            const slipTemplate = await getBase64Image(require('../../assets/images/verification/NIN-Slip.jpg'));
            const trackingId = val(data.trackingId || data.verificationRef || 'IRHJUMLHZ0005ED');
            const surnameVal = val(data.surname || data.lastname);
            const firstnameVal = val(data.firstname);
            const middlenameVal = val(data.middlename);
            const genderVal = (data.gender || '').trim().toUpperCase() === 'FEMALE' || (data.gender || '').trim().toUpperCase() === 'F' ? 'F' : 'M';
            const addressVal = val(data.residence_address || data.address);
            const townVal = val(data.residence_town);
            const stateVal = val(data.residence_state || data.state);

            contentHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>NIN Slip</title>
              <style>
                @page { size: A4 portrait; margin: 10mm; }
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #ffffff !important; font-family: "Times New Roman", Times, Georgia, serif; }
                .slip-container { position: relative; width: 760px; height: 436px; border: 1px solid #ccc; overflow: hidden; background: #fff; }
                .bg-img { position: absolute; inset: 0; width: 760px; height: 436px; object-fit: fill; z-index: 0; }
                .overlay { position: absolute; inset: 0; z-index: 10; pointer-events: none; }
                .field { position: absolute; font-size: 10px; color: #000; line-height: 1.2; font-weight: bold; }
                .addr { position: absolute; font-size: 12px; color: #000; line-height: 1.4; white-space: pre-wrap; word-break: break-word; font-weight: 500; }
              </style>
            </head>
            <body>
              <div class="slip-container">
                <img src="${slipTemplate}" class="bg-img" />
                <div class="overlay">
                  <div class="field" style="left:90px;top:105px;width:185px;">${trackingId}</div>
                  <div class="field" style="left:280px;top:105px;width:175px;">${surnameVal}</div>
                  <div class="field" style="left:90px;top:154px;width:185px;letter-spacing:0.04em;">${ninNumber}</div>
                  <div class="field" style="left:280px;top:153px;width:175px;">${firstnameVal}</div>
                  <div class="field" style="left:280px;top:195px;width:175px;">${middlenameVal}</div>
                  <div class="field" style="left:253px;top:228px;width:100px;">${genderVal}</div>
                  <div class="addr" style="left:397px;top:130px;width:165px;">${addressVal}<br/>${townVal}<br/>${stateVal}</div>
                  ${photoSrc ? `<div style="position:absolute;left:575px;top:94px;width:140px;height:159px;overflow:hidden;background:#d1d5db;"><img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;" /></div>` : ''}
                </div>
              </div>
            </body>
            </html>
            `;
        } else {
            const cardTemplate = await getBase64Image(require('../../assets/images/verification/NIN-Card.jpg'));
            const qrLogo = await getBase64Image(require('../../assets/images/verification/NINQRcodemiddelimage.jpg'));
            
            const surnameVal = (data.surname || data.lastname || 'SALAWUDEEN').toUpperCase();
            const givenNamesVal = `${data.firstname || 'TOYEEB'} ${data.middlename || ''}`.trim().toUpperCase();
            const dobVal = data.birthdate || data.dateOfBirth || '30 APR 2000';
            const sexVal = (data.gender || 'M').trim().toUpperCase()[0];
            const issueDateVal = data.issueDate || '14 OCT 2024';

            contentHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Digital NIN Card</title>
              <style>
                @page { size: portrait; margin: 10mm; }
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #ffffff !important; font-family: sans-serif; }
                .card-container { position: relative; width: 800px; height: 1067px; border: 1px solid #ccc; border-radius: 12px; overflow: hidden; background: #fff; }
                .bg-img { position: absolute; inset: 0; width: 800px; height: 1067px; object-fit: fill; z-index: 0; }
                .photo-box { position: absolute; z-index: 20; overflow: hidden; left: 9.9%; top: 17%; width: 18.1%; height: 17.5%; }
                .qr-box { position: absolute; z-index: 20; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; left: 69.0%; top: 10.4%; width: 21.9%; height: 15.6%; }
                .overlay { position: absolute; inset: 0; z-index: 20; pointer-events: none; }
              </style>
            </head>
            <body>
              <div class="card-container">
                <img src="${cardTemplate}" class="bg-img" />
                <div class="photo-box"><img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;object-position:top;" /></div>
                <div class="qr-box">
                  <img src="${qrUrl}" style="width:100%;height:100%;object-fit:fill;" />
                  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"><img src="${qrLogo}" style="width:28%;height:28%;object-fit:contain;" /></div>
                </div>
                <div class="overlay">
                  <div style="position:absolute;left:31.0%;top:18.3%;right:32%;"><p style="margin:0;font-size:15px;font-weight:bold;color:#1a1a1a;letter-spacing:0.2em;">${surnameVal}</p></div>
                  <div style="position:absolute;left:31.0%;top:24%;right:32%;"><p style="margin:0;font-size:15px;font-weight:bold;color:#1a1a1a;letter-spacing:0.2em;">${givenNamesVal}</p></div>
                  <div style="position:absolute;left:31.0%;top:30.4%;"><p style="margin:0;font-size:17px;font-weight:bold;color:#1a1a1a;letter-spacing:0.2em;">${dobVal}</p></div>
                  <div style="position:absolute;left:54.0%;top:30.4%;"><p style="margin:0;font-size:17px;font-weight:bold;color:#1a1a1a;letter-spacing:0.02em;">${sexVal}</p></div>
                  <div style="position:absolute;left:72.0%;top:33.2%;width:20%;"><p style="margin:0;font-size:19px;font-weight:bold;color:#1a1a1a;letter-spacing:0.2em;">${issueDateVal}</p></div>
                  <div style="position:absolute;left:0;right:0;top:38.6%;display:flex;justify-content:center;"><p style="margin:0;font-family:monospace;font-weight:bold;color:#000;letter-spacing:0.40em;font-size:38px;">${ninNumber}</p></div>
                </div>
              </div>
            </body>
            </html>
            `;
        }

        const { uri } = await Print.printToFileAsync({ html: contentHtml });

        if (Platform.OS === 'android') {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
                }
                return;
            }

            const fileName = `${verificationType}_Verification_${viewType}_${Date.now()}.pdf`;
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

            const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                'application/pdf'
            );

            await FileSystem.writeAsStringAsync(newFileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
            alert('PDF saved successfully!');
        } else {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                alert('Sharing is not available on this device');
            }
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to save PDF. Please try again.');
    }
};
