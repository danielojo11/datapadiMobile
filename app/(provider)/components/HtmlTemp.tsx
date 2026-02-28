interface VoucherPin {
  pin?: string;
  serial?: string;
  networkId?: string;
  network?: string;
  amount?: number;
  batchId?: string;
}

interface PrintBatch {
  id: string;
  networkId: string;
  amount: number;
  pins: VoucherPin[];
}

export interface TemplateParams {
  batches?: PrintBatch[];
  pins?: VoucherPin[]; // Legacy fallback
  currency?: string;
}

export const HtmlTemp = ({ batches, pins, currency = '₦' }: TemplateParams) => {
  const getUSSD = (networkId: string) => {
    switch (networkId) {
      case 'MTN': return '*555*PIN#';
      case 'AIRTEL': return '*126*PIN#';
      case 'GLO': return '*123*PIN#';
      case '9MOBILE': return '*222*PIN#';
      default: return '*XXX*PIN#';
    }
  };

  const formatPin = (pin: string) => {
    console.log("Pin", pin)
    if (!pin) return 'No Pins from the template';
    return pin.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  // Support legacy flat pins array or new batches array
  const renderBatches = batches && batches.length > 0 ? batches : [{ id: 'default', networkId: 'UNKNOWN', amount: 0, pins: pins || [] }];

  // Check if totally empty
  const hasPins = renderBatches.some(b => b.pins && b.pins.length > 0);

  if (!hasPins) {
    return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { margin: 0; padding: 40px; font-family: Arial, sans-serif; text-align: center; color: #6B7280; }
        h2 { color: #374151; }
      </style>
    </head>
    <body>
      <h2>No PINs available to generate</h2>
      <p>This batch might be empty or still processing.</p>
    </body>
  </html>
        `;
  }

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
          background: #ffffff;
          color: #000000;
        }

        .batch-container {
          margin-bottom: 0px;
        }

        .header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 1px solid #333;
          padding-bottom: 5px;
        }

        .header h1 {
          font-size: 22px;
          font-weight: 900;
          margin: 0;
          letter-spacing: 2px;
        }

        .header p {
          margin: 4px 0;
          font-size: 10px;
          color: #555;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 3mm;
        }

        .card {
          border: 0.5pt solid #ccc;
          padding: 6px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          height: 24mm;
          page-break-inside: avoid;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          font-weight: 800;
        }

        .amount {
          border: 1px solid #000;
          padding: 1px 4px;
          font-weight: 900;
        }

        .card-body {
          flex: 1;
          text-align: center;
          background: #fafafa;
          border-radius: 4px;
          margin: 3px 0;
          padding: 3px 0;
        }

        .network {
          font-size: 8px;
          font-weight: 900;
          background: #000;
          color: #fff;
          padding: 2px 4px;
          border-radius: 2px;
          display: inline-block;
          margin-bottom: 2px;
        }

        .pin-label {
          font-size: 7px;
          font-weight: bold;
          color: #666;
        }

        .pin-value {
          font-family: monospace;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .footer {
          font-size: 6.5px;
          display: flex;
          justify-content: space-between;
        }
      </style>
    </head>
    
    <body>
      <div class="grid">
      ${renderBatches.map(batch => `
        ${batch.pins.map((pin: any) => {
    const nw = pin.network || pin.networkId || batch.networkId || 'N/A';
    const amt = pin.amount || batch.amount || 0;
    return `
              <div class="card">
                <div class="card-header">
                  <span>MUFTI PAY</span>
                  <span class="amount">${currency}${amt}</span>
                </div>

                <div class="card-body">
                  <div class="network">${nw}</div>
                  <div class="pin-label">Recharge PIN</div>
                  <div class="pin-value">${pin.pin ? formatPin(pin.pin) : 'No Pins from the template'}</div>
                </div>

                <div class="footer">
                  <span>SN: ${pin.serial || 'N/A'}</span>
                  <span>Load: ${getUSSD(nw)}</span>
                </div>
              </div>
            `}).join('')}
      `).join('')}
      </div>

    </body>
  </html>
  `;
};