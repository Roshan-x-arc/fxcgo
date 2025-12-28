# FXcgo Platform - Complete Feature & Technology Documentation

## 🎯 Project Overview

**FXcgo** is an end-to-end export-import risk management platform that provides AI-powered currency forecasting, shipment insurance recommendations, marketplace connectivity, eKYC verification, and comprehensive document management. The platform connects exporters and importers globally with intelligent tools for managing international trade operations.

---

## 🏗️ Technology Architecture

### Frontend Stack

- **HTML5** - Semantic markup and page structure
- **CSS3** - Custom styling, animations, responsive design (Grid & Flexbox)
- **JavaScript (ES6+)** - Client-side logic, real-time interactions, DOM manipulation
- **Google Fonts (Inter)** - Modern typography system

### Backend Stack

- **FastAPI (Python)** - RESTful API server for AI predictions
- **TensorFlow/Keras** - LSTM neural network model for time series forecasting
- **XGBoost** - Gradient boosting model for return predictions
- **NumPy/Pandas** - Data processing and manipulation
- **Joblib** - Model serialization and loading

### Database & Authentication

- **Firebase Authentication v10.7.1** - User authentication (email/password, OTP)
- **Firebase Realtime Database** - Real-time data synchronization
- **Firebase Firestore** - Structured document storage for eKYC data
- **Two Separate Firebase Projects**:
  - Exporter Database: `expoter-af015`
  - Importer Database: `impoter-9e6bf`

### Real-time Communication

- **WebRTC** - Peer-to-peer video calls for eKYC verification
- **STUN Servers** - NAT traversal for WebRTC connections

### Security

- **Fernet Encryption (Python Cryptography)** - Symmetric encryption for sensitive data
- **Firebase Security Rules** - Database access control
- **Password Hashing** - Firebase handles secure password storage

### Third-party Integrations

- **Razorpay Payment Gateway** - Payment processing for marketplace orders
- **Exchange Rate API** - Real-time currency exchange rates (exchangerate-api.com)
- **RestCountries API** - Country and port data for insurance/document features

### UI Libraries

- **Chart.js** - Data visualization for forward contract forecasts
- **jsPDF** - PDF generation for contract notes
- **SVG Icons** - Scalable vector graphics for UI elements

---

## 🔑 Feature Breakdown by Technology

### 1. Landing Page & Authentication System

**Technology:** Firebase Authentication v10.7.1, JavaScript, HTML5, CSS3

**Features:**

- Dual authentication system supporting both exporters and importers
- Email/password login with validation
- OTP (One-Time Password) login support
- Signup with profile information collection
- Password strength indicator
- Remember me functionality
- Forgot password recovery

**How It Works:**

- Users select account type (Exporter/Importer) before authentication
- Separate Firebase projects handle exporter and importer data isolation
- Session management keeps users logged in across pages
- Automatic redirection to appropriate dashboard after login

---

### 2. Forward Contract Forecast System (AI-Powered)

**Technology:** FastAPI, TensorFlow/Keras (LSTM), XGBoost, NumPy, Pandas, Joblib

**Features:**

- 15-day currency price forecasting
- Optimal trade date recommendation
- Confidence intervals (upper/lower risk bands)
- Interactive price charts
- PDF contract note generation
- Real-time exchange rate fetching

**How It Works:**

1. User inputs contract amount and currency pair
2. Frontend sends request to FastAPI backend (`/forecast` endpoint)
3. Backend loads pre-trained models:
   - **LSTM Model** - Analyzes historical price trends (60-day lookback)
   - **XGBoost Model** - Predicts return rates with hybrid input
   - **Volatility Model** - Calculates market uncertainty
4. Models generate 15-day forecast with confidence intervals
5. System identifies "best trade day" (mid-range price for minimum loss)
6. Results displayed as interactive chart using Chart.js
7. Users can download contract note as PDF with company branding

**Key Files:**

- `backend/main.py` - FastAPI server
- `backend/lstm_model.h5` - LSTM neural network
- `backend/xgb_model.joblib` - XGBoost model
- `external-feature/features-script.js` - Frontend integration

---

### 3. Insurance Recommendation System

**Technology:** JavaScript, RestCountries API, Static Insurance Catalog

**Features:**

- AI-driven insurance product matching
- Scoring algorithm based on multiple factors
- Coverage adequacy analysis
- Trade lane appetite checking
- Premium efficiency calculation
- Export results to JSON

**How It Works:**

1. User fills shipment form (goods type, value, origin/destination ports, transport mode, risk profile)
2. System loads country/port directory from static data
3. Insurance catalog contains pre-configured insurance products with:
   - Coverage types (ICC A/B/C)
   - Supported goods categories
   - Value ranges
   - Trade lane preferences
   - Base premium rates
4. Scoring algorithm evaluates each insurance product:
   - **Commodity Match** (25 points) - Checks if goods type supported
   - **Value Band** (20 points) - Verifies shipment value within underwriting limits
   - **Trade Lane** (20 points) - Matches origin/destination ports
   - **Transport Mode** (15 points) - Confirms mode support
   - **Risk Profile** (10 points) - Aligns coverage with user's risk tolerance
   - **Provider Rating** (15 points) - Includes customer rating
5. Top 3 recommendations displayed with scores, estimated premiums, and rationale
6. Results can be exported as JSON

**Key Files:**

- `external-feature/features-script.js` - Insurance logic (lines 760-1380)

---

### 4. Document Requirements & Checklist Generator

**Technology:** JavaScript, Static Country Document Matrix

**Features:**

- Country-specific document requirements
- Transport mode filtering (Sea/Air/Imports/Exports)
- Official government links for each document
- Quick checklist generation
- Document issuer information

**How It Works:**

1. User selects country and transport mode
2. System queries static country document matrix
3. Each country entry contains:
   - Document name and use case
   - Issuer information
   - Official government links
   - Quick checklist items
   - Supported transport modes
4. Results displayed in table format with clickable official links
5. Checklist generator creates actionable list based on selection

**Key Files:**

- `external-feature/features-script.js` - Document requirements (lines 1382-2239)

---

### 5. Marketplace System

**Technology:** Firebase Realtime Database, JavaScript, Firebase Authentication

**Features:**

- Product catalog browsing
- Advanced search and filtering (category, price, currency, incoterm, target market)
- Shopping cart management
- Real-time product updates
- Product detail views
- Image handling (Base64 encoding)

**How It Works:**

1. Products stored in Firebase Realtime Database at `users/{userId}/products` or `productCatalog/`
2. Marketplace reads from all exporter products simultaneously
3. Real-time listeners update product catalog automatically
4. Cart stored in Firebase per user (`users/{userId}/cart`)
5. Filtering happens client-side for instant results
6. Product images stored as Base64 strings in database

**Key Files:**

- `marketplace/marketplace.html` - Marketplace UI
- `marketplace/marketplace.js` - Product loading, filtering, cart logic

---

### 6. Checkout & Payment System

**Technology:** Firebase Realtime Database, Razorpay SDK, JavaScript

**Features:**

- Multi-step checkout process
- Document upload (commercial invoice, packing list, certificate of origin)
- Shipping information collection
- Payment method selection (Razorpay/Pay Later)
- Order confirmation and tracking
- Order history

**How It Works:**

1. User proceeds from marketplace cart
2. Step 1: Upload required international shipping documents
3. Step 2: Enter shipping address and delivery preferences
4. Step 3: Choose payment method
   - **Razorpay**: Redirects to payment gateway, processes payment
   - **Pay Later**: Marks order as pending, allows payment later
5. Order saved to Firebase (`users/{userId}/orders/{orderId}`)
6. Cart cleared after successful order
7. Order accessible in dashboard for tracking

**Key Files:**

- `marketplace/checkout.html` - Checkout UI
- `marketplace/checkout.js` - Order processing logic

---

### 7. eKYC (Electronic Know Your Customer) Verification

**Technology:** WebRTC, Firebase Firestore, Firebase Realtime Database, JavaScript

**Features:**

- Document upload (identity proof, business proof, bank proof)
- Live selfie capture via webcam
- Video call verification with admin
- Real-time status updates
- Document review interface

**How It Works:**

1. **User Side (Exporter/Importer)**:

   - Upload identity documents (ID proof, business proof, bank proof)
   - Capture live selfie using browser camera API
   - Submit eKYC request to Firebase
   - Request video call with admin
   - Join WebRTC video call when admin accepts
   - Receive verification status update

2. **Admin Side**:
   - View pending eKYC requests from Firestore/Realtime Database
   - Review uploaded documents
   - Accept video call request
   - Establish WebRTC connection with user
   - Verify identity via video call
   - Approve or reject eKYC with optional notes

**WebRTC Flow:**

- User creates offer (SDP) and sends to Firebase
- Admin receives offer, creates answer (SDP)
- ICE candidates exchanged through Firebase signaling
- Peer-to-peer connection established
- Video/audio streams shared between user and admin

**Key Files:**

- `Admin/admin-script.js` - Admin video call logic
- Exporter/Importer dashboard JS files - User eKYC submission

---

### 8. Admin Panel

**Technology:** Firebase Realtime Database, Firebase Firestore, WebRTC, JavaScript

**Features:**

- Video call request monitoring (both exporter and importer)
- Real-time eKYC document review
- WebRTC video call interface
- Support center chat management
- Online/offline status toggle
- eKYC approval/rejection workflow

**How It Works:**

1. Admin panel listens to two Firebase projects simultaneously
2. Pending video call requests appear in real-time
3. Admin can accept/reject requests
4. Video call interface uses WebRTC for peer-to-peer communication
5. Documents displayed for review during call
6. Admin approves/rejects with optional rejection reason
7. Status updates propagate to user dashboard instantly

**Key Files:**

- `Admin/admin-panel.html` - Admin UI
- `Admin/admin-script.js` - Admin functionality (2800+ lines)

---

### 9. Support Chat System

**Technology:** Firebase Realtime Database, JavaScript

**Features:**

- Real-time messaging between users and admin
- Support status toggle (online/offline)
- Thread-based conversation management
- Message history
- Auto-scroll to latest messages

**How It Works:**

1. Users can initiate support requests from dashboard
2. Messages stored in Firebase at `supportChat/{userId}/messages`
3. Admin toggles online/offline status at `supportStatus/admin`
4. Real-time listeners on both sides update chat instantly
5. Messages include sender ID, text, and timestamp
6. Admin sees all user threads in sidebar
7. Clicking thread loads conversation history

**Key Files:**

- Dashboard JavaScript files - User chat interface
- `Admin/admin-script.js` - Admin support center

---

### 10. Exporter Dashboard

**Technology:** Firebase Realtime Database, Firebase Firestore, JavaScript, Chart.js

**Features:**

- Dashboard overview with statistics
- Forward contract management
- Insurance policy management
- Product catalog management
- Document library
- Profile management (8 sections: Basic, Business, Compliance, Import Details, Address, Banking, Documents, Settings)
- eKYC status display
- Support chat integration
- Forward contract forecast integration
- Insurance recommendation integration

**How It Works:**

- All data synced with Firebase Realtime Database
- Real-time updates when data changes
- Forward contracts link to AI forecasting API
- Insurance section uses recommendation engine
- Documents stored with Base64 encoding
- Profile updates save instantly to database

**Key Files:**

- `Export-Dashboard/export-dashboard.html` - Dashboard UI
- `Export-Dashboard/dashboard-script.js` - Dashboard logic

---

### 11. Importer Dashboard

**Technology:** Firebase Realtime Database, Firebase Authentication, JavaScript

**Features:**

- Dashboard overview with shipment statistics
- Document library with country-specific requirements
- Forward contract forecast (same as exporter)
- Support chat
- Marketplace integration
- Shopping cart
- Order history
- Profile management (8 sections)
- eKYC verification
- Notifications system

**How It Works:**

- Separate Firebase project (`impoter-9e6bf`) for data isolation
- Real-time sync with database
- Marketplace connects to exporter database to view products
- Cart stored in importer database
- Orders link products from exporter database with importer user data

**Key Files:**

- `Impoter-Dashboard/impoter-dashboard.html` - Dashboard UI
- `Impoter-Dashboard/importer-dashboard.js` - Dashboard logic (6000+ lines)

---

### 12. Security & Encryption Module

**Technology:** Python Cryptography (Fernet), Environment Variables

**Features:**

- Symmetric encryption for sensitive data
- Key generation utility
- Encryption/decryption functions
- Invalid token handling

**How It Works:**

- Uses Fernet (AES encryption) from Python Cryptography library
- Encryption key stored in environment variable `APP_ENCRYPTION_KEY`
- Data encrypted before storage, decrypted when retrieved
- Handles corrupted/invalid tokens gracefully

**Key Files:**

- `security/encryption.py` - Encryption manager class
- `security/test_encryption.py` - Test suite

---

## 🔄 Real-time Data Flow

### Product Catalog Updates

1. Exporter adds/updates product → Firebase Realtime Database
2. Marketplace listeners detect change → Update UI instantly
3. All viewers see new/changed products immediately

### eKYC Status Updates

1. Admin approves/rejects → Firebase Firestore/Realtime Database
2. User dashboard listener detects change → Update status badge
3. User can proceed to next step automatically

### Support Chat Messages

1. User/admin sends message → Firebase Realtime Database
2. Both parties' listeners detect new message → Display instantly
3. Chat scrolls to show latest message

### Cart Synchronization

1. User adds item → Firebase Realtime Database
2. Dashboard listener updates cart badge
3. Cart persists across browser sessions

---

## 📊 Database Architecture

### Firebase Realtime Database Structure

**Exporter Database (`expoter-af015`):**

```
root/
├── users/
│   └── {userId}/
│       ├── profile/
│       ├── products/
│       ├── cart/
│       ├── orders/
│       ├── documents/
│       └── ekyc/
├── productCatalog/
├── supportChat/
│   └── {userId}/
│       └── messages/
├── supportStatus/
│   └── admin/
└── videoCallRequests/ (Firestore)
```

**Importer Database (`impoter-9e6bf`):**

```
root/
├── importers/
│   └── {userId}/
│       ├── profile/
│       ├── cart/
│       ├── orders/
│       ├── documents/
│       ├── ekyc/
│       └── videoCallRequests/
└── supportChat/ (if implemented)
```

### Firebase Firestore Structure (Exporter)

```
ekyc/
└── {userId}/
    ├── userName
    ├── userEmail
    ├── documents/
    └── ekycStatus

videoCallRequests/
└── {requestId}/
    ├── userId
    ├── status
    ├── offer (SDP)
    ├── answer (SDP)
    └── iceCandidates
```

---

## 🚀 Feature Technology Mapping

| Feature                | Frontend Tech      | Backend Tech           | Database       | Communication       |
| ---------------------- | ------------------ | ---------------------- | -------------- | ------------------- |
| **Authentication**     | Firebase Auth JS   | -                      | Firebase Auth  | -                   |
| **Forward Contracts**  | Chart.js, jsPDF    | FastAPI, LSTM, XGBoost | -              | REST API            |
| **Insurance**          | JavaScript         | Static Algorithm       | -              | -                   |
| **Documents**          | JavaScript         | Static Data            | -              | -                   |
| **Marketplace**        | JavaScript         | -                      | Firebase RTDB  | Real-time listeners |
| **Checkout**           | Razorpay SDK       | -                      | Firebase RTDB  | Payment Gateway     |
| **eKYC**               | WebRTC, Camera API | -                      | Firestore/RTDB | WebRTC P2P          |
| **Admin Panel**        | WebRTC             | -                      | Firestore/RTDB | WebRTC, Real-time   |
| **Support Chat**       | JavaScript         | -                      | Firebase RTDB  | Real-time listeners |
| **Profile Management** | JavaScript         | -                      | Firebase RTDB  | Real-time sync      |
| **Encryption**         | -                  | Python Cryptography    | -              | -                   |

---

## 🔐 Security Features

1. **Authentication Security**

   - Firebase handles password hashing
   - Session tokens managed by Firebase
   - Email verification option

2. **Database Security**

   - Firebase Security Rules control access
   - User-specific data isolation
   - Public read for products only
   - Authenticated write requirements

3. **Data Encryption**

   - Sensitive data encrypted using Fernet (AES)
   - Encryption keys in environment variables
   - Never exposed in client-side code

4. **WebRTC Security**
   - Signaling through secure Firebase
   - STUN servers for NAT traversal
   - No TURN servers (peer-to-peer only)

---

## 📱 User Flows

### Exporter Journey

1. Sign up → Email verification → Dashboard
2. Complete profile → Upload documents → eKYC submission
3. Request video call → Admin verification → Approval
4. Add products → Products appear in marketplace
5. Receive orders → Manage shipments → Track payments

### Importer Journey

1. Sign up → Email verification → Dashboard
2. Complete profile → Upload documents → eKYC submission
3. Request video call → Admin verification → Approval
4. Browse marketplace → Add to cart → Checkout
5. Upload shipping documents → Pay → Track order

### Admin Journey

1. Access admin panel → View pending requests
2. Review documents → Accept video call
3. Conduct verification → Approve/reject with notes
4. Monitor support chat → Respond to queries
5. Track platform statistics

---

## 🌐 API Endpoints

### Backend API (FastAPI)

- `GET /` - Health check
- `GET /forecast` - 15-day currency forecast (returns JSON with dates, prices, confidence bands, best trade day)

### External APIs Used

- `exchangerate-api.com` - Currency exchange rates
- `restcountries.com` - Country data
- `Razorpay API` - Payment processing

---

## 📦 File Structure Summary

```
fxcgo/
├── index.html                    # Landing page with auth
├── script.js                     # Landing page logic + Firebase auth
├── styles.css                    # Global styles
│
├── backend/
│   ├── main.py                   # FastAPI server
│   ├── lstm_model.h5             # LSTM neural network
│   ├── xgb_model.joblib          # XGBoost model
│   └── [other model files]       # Scalers, data, volatility models
│
├── Admin/
│   ├── admin-panel.html          # Admin interface
│   ├── admin-script.js           # Admin logic (WebRTC, eKYC)
│   └── admin-styles.css          # Admin styling
│
├── Export-Dashboard/
│   ├── export-dashboard.html     # Exporter dashboard
│   ├── dashboard-script.js       # Dashboard logic
│   └── dashboard-styles.css      # Dashboard styling
│
├── Impoter-Dashboard/
│   ├── impoter-dashboard.html    # Importer dashboard
│   ├── importer-dashboard.js     # Dashboard logic (6000+ lines)
│   └── importer-dashboard.css    # Dashboard styling
│
├── marketplace/
│   ├── marketplace.html          # Product marketplace
│   ├── marketplace.js            # Product/cart logic
│   ├── checkout.html             # Checkout page
│   ├── checkout.js               # Order processing
│   └── checkout.css              # Checkout styling
│
├── external-feature/
│   ├── features.html             # Feature showcase page
│   └── features-script.js        # Forward contracts, Insurance, Documents
│
├── security/
│   ├── encryption.py             # Encryption module
│   └── test_encryption.py        # Encryption tests
│
└── assets/                       # Images, logos, icons
```

---

## 🎨 UI/UX Technologies

- **Responsive Design**: CSS Grid & Flexbox
- **Animations**: CSS transitions, keyframes
- **Icons**: SVG inline icons
- **Fonts**: Google Fonts (Inter family)
- **Charts**: Chart.js library
- **PDFs**: jsPDF library
- **Color Scheme**: Custom CSS variables for theming

---

## 🔄 Real-time Synchronization

All major features use Firebase real-time listeners:

- Product catalog updates instantly
- Chat messages appear immediately
- eKYC status changes reflect in real-time
- Cart updates sync across devices
- Support status toggles update instantly
- Video call requests notify admin immediately

---

## 📈 Performance Optimizations

1. **Lazy Loading**: Products load in batches (12 per page)
2. **Debouncing**: Search and filter inputs debounced (300ms)
3. **Image Optimization**: Base64 encoding for inline display
4. **Model Caching**: AI models loaded once at server startup
5. **Database Indexing**: Firebase handles automatic indexing
6. **Event Throttling**: Scroll and resize events throttled

---

## ✅ Testing & Validation

- Form validation on client-side
- Password strength indicators
- Email format validation
- File type/size validation for uploads
- Real-time error handling
- Network error recovery
- Offline capability (Firebase persistence)

---

## 🎯 Key Takeaways

**FXcgo** is a full-stack platform combining:

- **Frontend**: Modern JavaScript with real-time Firebase integration
- **Backend**: Python FastAPI with machine learning models
- **Database**: Dual Firebase projects for data isolation
- **AI/ML**: LSTM + XGBoost hybrid model for currency forecasting
- **Real-time**: WebRTC for video calls, Firebase listeners for data sync
- **Security**: Firebase Auth, encryption module, security rules
- **Payment**: Razorpay integration for marketplace transactions

The platform provides a complete solution for export-import businesses, from currency risk management to marketplace transactions, all with real-time synchronization and AI-powered insights.
