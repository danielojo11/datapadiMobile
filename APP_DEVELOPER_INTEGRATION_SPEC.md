# Mobile App Developer Technical Integration Specification
**MuftiPay Verification, Printing, Transaction History & Layout Engine**

> [!IMPORTANT]
> This specification documents the exact UI layouts, coordinate grids, typography, modal workflows, canvas export engine, and backend API endpoints implemented in **MuftiPay**. Share this document and the attached file list with your mobile app developer to ensure 100% pixel-perfect feature parity on iOS and Android.

---

## 1. Required Source Files to Hand Over to App Developer

Provide the app developer with the following core files from the `WebApp-MuftiPay` repository:

| File Path | Description / Key Responsibility |
| :--- | :--- |
| [`components/ui/DigitalNINCard.tsx`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/components/ui/DigitalNINCard.tsx) | Digital NIN Card component layout & styling (Front card layout). |
| [`components/ui/NINSlip.tsx`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/components/ui/NINSlip.tsx) | Official Standard NIN Slip layout & pixel positioning grid. |
| [`components/ui/NINVerificationDocument.tsx`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/components/ui/NINVerificationDocument.tsx) | Full NIN Verification Certificate, print wrapper, & PDF generator. |
| [`components/ui/BVNVerificationDocument.tsx`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/components/ui/BVNVerificationDocument.tsx) | Full BVN Verification Certificate, photo container, & print wrapper. |
| [`lib/ninCanvasRenderer.ts`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/lib/ninCanvasRenderer.ts) | HTML5 / Native 2D Canvas Renderer engine (matches DOM coordinates 1:1 for crisp mobile exports). |
| [`lib/assetPreloader.ts`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/lib/assetPreloader.ts) | Base64 template background image preloader. |
| [`lib/print-template.ts`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/lib/print-template.ts) | Thermal & A4 print HTML formatting engine. |
| [`components/modals/TransactionDetailsModal.tsx`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/components/modals/TransactionDetailsModal.tsx) | Transaction history detail modal & receipt action menu. |
| [`components/modals/BVNModal.tsx`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/components/modals/BVNModal.tsx) | BVN verification request modal with PIN verification. |
| [`components/modals/NINModal.tsx`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/components/modals/NINModal.tsx) | NIN verification request modal with PIN verification. |
| [`app/actions/prembly.ts`](file:///c:/Users/Code%20Git/Desktop/muftipay/WebApp-MuftiPay/app/actions/prembly.ts) | Server actions and API service calls for identity verifications. |

### 1.1 Complete Image Template & Logo Asset Inventory

Below is the verified, exhaustive list of all static image asset files located in `WebApp-MuftiPay/public/` that must be provided to the app developer:

| File Name | Location in Project | Purpose / Description | Bundle Requirement |
| :--- | :--- | :--- | :--- |
| **`NIN-Slip.jpg`** | `public/NIN-Slip.jpg` | Primary lightweight template image for standard **NIN Slip** (`760px × 436px`). | **Primary Asset** |
| **`NIN Slip.png`** | `public/NIN Slip.png` | High-definition fallback PNG for **NIN Slip** background. | **Fallback Asset** |
| **`NIN-Card.jpg`** | `public/NIN-Card.jpg` | Primary lightweight template image for **Digital NIN Card** (`800px × 1067px`). | **Primary Asset** |
| **`NIN.png`** | `public/NIN.png` | High-definition fallback PNG for **Digital NIN Card** background. | **Fallback Asset** |
| **`NINBack.jpg`** | `public/NINBack.jpg` | Primary lightweight template image for **Digital NIN Card Back**. | **Primary Asset** |
| **`NINBack.png`** | `public/NINBack.png` | High-definition fallback PNG for **Digital NIN Card Back**. | **Fallback Asset** |
| **`NINQRcodemiddelimage.jpg`** | `public/NINQRcodemiddelimage.jpg` | Coat of Arms emblem placed in the center of the NIN QR code. | **Required** (QR Center Emblem) |
| **`muftiPay.png`** | `public/muftiPay.png` | Official **MuftiPay Brand Logo** (high res) used in headers and PDF certificates. | **Required** (Brand Logo) |
| **`logo.png`** | `public/logo.png` | Alternative compact MuftiPay logo icon. | **Required** |

---

## 2. Backend API Endpoints Reference

All requests require JWT authentication header: `Authorization: Bearer <user_token>`.

### 2.1 Verify NIN (National Identity Number)
- **Endpoint**: `POST /api/v1/prembly/verification/nin`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "number_nin": "62042149067",
    "transactionPin": "1234"
  }
  ```
- **Response Structure (Success `200 OK`)**:
  ```json
  {
    "status": true,
    "message": "NIN verification successful",
    "data": {
      "nin": "62042149067",
      "firstname": "TOYEEB",
      "middlename": "ADISA",
      "surname": "SALAWUDEEN",
      "birthdate": "30-04-2000",
      "gender": "M",
      "telephoneno": "08012345678",
      "photo": "/9j/4AAQSkZJRg...",
      "trackingId": "IRHJUMLHZ0005ED",
      "residence_address": "12 MAIN STREET",
      "residence_town": "IKEJA",
      "residence_state": "LAGOS",
      "verificationRef": "MFT-NIN-982341",
      "generatedAt": "2026-08-14T22:00:00Z"
    }
  }
  ```

### 2.2 Verify BVN (Bank Verification Number)
- **Endpoint**: `POST /api/v1/prembly/verification/bvn`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "number": "22123456789",
    "transactionPin": "1234"
  }
  ```
- **Response Structure (Success `200 OK`)**:
  ```json
  {
    "status": true,
    "message": "BVN verification successful",
    "data": {
      "bvn": "22123456789",
      "firstName": "TOYEEB",
      "middleName": "ADISA",
      "lastName": "SALAWUDEEN",
      "dateOfBirth": "30-Apr-2000",
      "gender": "Male",
      "phoneNumber1": "08012345678",
      "base64Image": "/9j/4AAQSkZJRg...",
      "registrationDate": "14-Oct-2015",
      "enrollmentBank": "058",
      "enrollmentBranch": "IKEJA",
      "verificationRef": "MFT-BVN-884120"
    }
  }
  ```

### 2.3 Fetch Verification History
- **Endpoint**: `GET /api/v1/prembly/verification/history`
- **Headers**: `Authorization: Bearer <token>`
- **Response Structure**:
  ```json
  {
    "status": true,
    "data": [
      {
        "id": "tx_99120",
        "type": "NIN_VERIFICATION",
        "reference": "MFT-NIN-982341",
        "status": "SUCCESS",
        "amount": 250,
        "createdAt": "2026-08-14T20:15:00Z",
        "details": { ... }
      }
    ]
  }
  ```

---

## 3. Pixel-Perfect Layout Specifications

### 3.1 Standard NIN Slip Layout
- **Container Dimensions**: `760px` width × `436px` height (Ratio: ~1.743).
- **Scale Factor for HD Export**: `scale = 2` (`1520px` × `872px` 2D Canvas).
- **Background Image**: `/NIN-Slip.jpg` (`object-fit: fill`, absolute `inset: 0`).
- **Typography & Fields Coordinates Grid**:

| Field Name | Font Family | Size | Left (px) | Top (px) | Width (px) | Special Formatting |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tracking ID** | Times New Roman | 10px | `90px` | `113px` | 185px | Uppercase |
| **Surname** | Times New Roman | 10px | `280px` | `113px` | 175px | Uppercase |
| **NIN** | Times New Roman | 10px | `90px` | `162px` | 185px | `letter-spacing: 0.04em` |
| **First Name** | Times New Roman | 10px | `280px` | `163px` | 175px | Uppercase |
| **Middle Name** | Times New Roman | 10px | `280px` | `203px` | 175px | Uppercase |
| **Gender** | Times New Roman | 10px | `253px` | `236px` | 100px | `"M"` or `"F"` |
| **Address Block** | Times New Roman | 12px | `397px` | `130px` | 165px | Line height: 1.4. **Do NOT print `—` dashes** for missing town/state lines. Filter out empty fields. |
| **User Photo** | Image Container | N/A | `575px` | `94px` | 140px × 159px | `object-fit: cover`, `object-position: top center` |

---

### 3.2 Digital NIN Card Layout
- **Container Dimensions**: `800px` width × `1067px` height.
- **Header**: Single title `"Digital NIN Card"` (Back switch/toggle removed).
- **Template Image**: `/NIN-Card.jpg` positioned with top offset `mt-[16px]` (16px in DOM coordinates, `16 * scale` in Canvas).
- **Coordinates & Overlays**:

| Element | Position / Dimensions | Style Specifications |
| :--- | :--- | :--- |
| **Holder Photo** | `left: 9.9%`, `top: 17%`, `width: 18.1%`, `height: 17.5%` | `object-fit: cover`, `object-position: top` |
| **QR Code Container** | `left: 69.0%`, `top: 10.4%`, `width: 21.9%`, `height: 15.6%` | Background: `#ffffff`, QR ECC Level H |
| **QR Code Data String** | Format: `NIN:{nin}\|REF:{ref}\|AUTH:MUFTIPAY` | Embedded center logo size: 28% × 28% |
| **Surname** | `left: 31.0%`, `top: 18.3%`, `right: 32%` | Montserrat 500, 15px, color `#1a1a1a`, `letter-spacing: 0.2em` |
| **Given Names** | `left: 31.0%`, `top: 24%`, `right: 32%` | Montserrat 500, 15px, color `#1a1a1a`, `letter-spacing: 0.2em` |
| **Date of Birth** | `left: 31.0%`, `top: 30.4%` | Montserrat 500, 17px, color `#1a1a1a`, `letter-spacing: 0.2em` (Format: `30 APR 2000`) |
| **Sex** | `left: 54.0%`, `top: 30.4%` | Montserrat 450, 17px, color `#1a1a1a`, `letter-spacing: 0.02em` (`"M"` or `"F"`) |
| **Issue Date** | `left: 72.0%`, `top: 33.2%` | Montserrat 500, 19px, color `#1a1a1a`, `letter-spacing: 0.2em` |
| **NIN Number** | Centered (`left: 0, right: 0`), `top: 38.6%` | Monospace 500, 38px, color `#000000`, `letter-spacing: 0.40em` (Format: `6204  214  9067`) |

---

### 3.3 BVN Verification Document Layout
- **Header Card**: Green gradient badge (`#059669` to `#047857`) with verified check icon.
- **User Photo Container**: `140px` × `160px` with rounded slate border.
- **Data Table**: 2-column grid format:
  - Full Name, BVN, Phone Number, Date of Birth, Gender, Enrollment Bank & Branch.
- **Footer Section**: Official QR code encoding verification reference and NIMC/NIBSS compliance notice.

---

## 4. Mobile Native PDF & Canvas Export Engine

> [!WARNING]
> On iOS Safari WebViews and Android Chrome WebViews, SVG `foreignObject` rasterization (e.g. `html-to-image`) often strips images or distorts fonts due to CORS/canvas security sandbox rules.

### Mobile Canvas Export Solution (`ninCanvasRenderer.ts`):
Mobile apps must use native 2D Canvas rendering or bitmap drawing context (`CanvasRenderingContext2D` in JavaScript / `Canvas` in Swift / Kotlin):
1. **Preload Assets**: Load background template image and user photo into memory as Bitmaps (`HTMLImageElement` / `Bitmap`).
2. **Draw Base**: `ctx.fillRect(0, 0, W, H)` with white `#ffffff`.
3. **Draw Template**: `ctx.drawImage(bgImg, 0, marginTop, W, H)`.
4. **Draw User Photo**: Clip rectangle at exact coordinates and `ctx.drawImage(userPhoto, px, py, pw, ph)`.
5. **Draw Overlays**: Draw text with exact font sizes, line heights, and `letterSpacing`.
6. **Export Data URL**: Output JPEG image (`canvas.toDataURL('image/jpeg', 0.95)`), then convert to PDF using `jsPDF` or native print API.

---

## 5. Transaction History & Modal Workflow

### 5.1 Verification Request Modal Flow
1. User enters identification number (NIN or BVN).
2. User enters 4-digit transaction PIN.
3. App calls `POST /api/v1/prembly/verification/{type}`.
4. On success:
   - Wallet balance updates automatically.
   - Verification document opens in full-screen modal with Print / Download PDF buttons.

### 5.2 Transaction Details Modal Layout (`TransactionDetailsModal.tsx`)
- **Header**: Icon badge indicating transaction category (Verification, Airtime, Data, Cable, Electricity).
- **Status Badge**:
  - `SUCCESS`: Emerald pill badge (`bg-emerald-50 text-emerald-700`).
  - `PENDING`: Amber pill badge (`bg-amber-50 text-amber-700`).
  - `FAILED`: Red/Rose pill badge (`bg-rose-50 text-rose-700`).
- **Breakdown Fields**:
  - Amount Paid, Service Fee, Transaction Reference, Date & Time, Previous Balance, New Balance.
- **Action Buttons**:
  - **Download Receipt / Share**: Generates crisp PDF receipt.
  - **Print**: Triggers print preview / thermal printer protocol.
