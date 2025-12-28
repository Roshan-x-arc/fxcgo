/**
 * External Features Page - Standalone JavaScript
 * Works without Firebase authentication
 */

// ============================================
// DASHBOARD INITIALIZATION & NAVIGATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
  initializeSidebar();
  initializeNavigation();

  // Initialize modules when their tabs are shown
  setTimeout(() => {
    const hash = window.location.hash.substring(1) || "contracts";
    switchTab(hash);
  }, 100);
});

/**
 * Initialize dashboard
 */
function initializeDashboard() {
  // Set active tab from URL hash or default to contracts
  const hash = window.location.hash.substring(1) || "contracts";
  switchTab(hash);
}

/**
 * Initialize sidebar
 */
function initializeSidebar() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebar = document.getElementById("sidebar");

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      sidebar?.classList.toggle("active");
    });
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      sidebar?.classList.toggle("active");
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 968) {
      if (
        sidebar?.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        !mobileMenuToggle?.contains(e.target)
      ) {
        sidebar.classList.remove("active");
      }
    }
  });
}

/**
 * Initialize navigation
 */
function initializeNavigation() {
  const navLinks = document.querySelectorAll(".nav-link[data-tab]");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = link.getAttribute("data-tab");
      switchTab(tab);

      // Update active state
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Close sidebar on mobile
      if (window.innerWidth <= 968) {
        const sidebar = document.getElementById("sidebar");
        sidebar?.classList.remove("active");
      }
    });
  });
}

/**
 * Switch between dashboard tabs
 */
function switchTab(tabName) {
  // Hide all sections
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => {
    section.style.display = "none";
  });

  // Show selected section
  let sectionId = `${tabName}Section`;
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.style.display = "block";
  }

  // Update page title
  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) {
    const titles = {
      contracts: "Forward Contracts",
      insurance: "Insurance",
      documents: "Documents",
      marketplace: "Marketplace",
    };
    pageTitle.textContent = titles[tabName] || "Forward Contracts";
  }

  // Initialize modules when tabs are shown
  if (tabName === "insurance") {
    setTimeout(() => initializeInsuranceModule(), 100);
  } else if (tabName === "documents") {
    setTimeout(() => initializeDocumentRequirementsSection(), 100);
  }

  // Update URL hash
  window.location.hash = tabName;
}

// ============================================
// FORWARD CONTRACT FUNCTIONALITY
// ============================================

let forwardContractChart = null;

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("forwardContractForm");
  const resultsSection = document.getElementById("forwardContractResults");
  const currencyPairSelect = document.getElementById(
    "forwardContractCurrencyPair"
  );
  const currencyPriceDiv = document.getElementById(
    "forwardContractCurrencyPrice"
  );

  if (!form || !resultsSection) return;

  // Fetch real-time currency rate when pair is selected
  if (currencyPairSelect && currencyPriceDiv) {
    currencyPairSelect.addEventListener("change", function () {
      const currencyPair = this.value;
      if (currencyPair) {
        fetchCurrencyRate(currencyPair, currencyPriceDiv);
      } else {
        currencyPriceDiv.innerHTML = "";
        currencyPriceDiv.className = "forward-contract-currency-price";
      }
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const amount = document.getElementById("forwardContractAmount").value;
    const currencyPair = document.getElementById(
      "forwardContractCurrencyPair"
    ).value;

    // Show loading state
    resultsSection.innerHTML =
      '<div style="text-align: center; padding: 40px;"><div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div><p>Fetching forecast data...</p></div>';

    try {
      // Fetch forecast from backend API
      const response = await fetch("http://127.0.0.1:8000/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency_pair: currencyPair,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch forecast data");
      }
      const forecastData = await response.json();

      // Fetch current rate for the currency pair
      let currentRate = null;
      try {
        const [baseCurrency, quoteCurrency] = currencyPair.split("/");
        if (baseCurrency === "USD") {
          currentRate = await fetchRateFromUSD(quoteCurrency);
        } else if (quoteCurrency === "USD") {
          const inverseRate = await fetchRateFromUSD(baseCurrency);
          currentRate = 1 / inverseRate;
        } else {
          const baseToUSD = await fetchRateFromUSD(baseCurrency);
          const quoteToUSD = await fetchRateFromUSD(quoteCurrency);
          currentRate = baseToUSD / quoteToUSD;
        }
      } catch (error) {
        console.error("Error fetching rate for results:", error);
      }

      // Display results with forecast data
      displayForwardContractResults(
        {
          amount: parseFloat(amount),
          currencyPair,
          currentRate,
          forecastData,
        },
        resultsSection
      );
    } catch (error) {
      console.error("Error fetching forecast:", error);
      resultsSection.innerHTML = `
                <div class="forward-contract-result-block" style="background: #fee2e2; border: 1px solid #fca5a5; padding: 20px; border-radius: 12px;">
                    <h3 style="color: #991b1b; margin: 0 0 10px 0;">Error</h3>
                    <p style="color: #7f1d1d; margin: 0;">Failed to fetch forecast data. Please make sure the backend server is running at http://127.0.0.1:8000</p>
                </div>
            `;
    }
  });
});

function displayForwardContractResults(data, resultsSection) {
  const forecast = data.forecastData;
  const bestTradeDate = new Date(forecast.best_trade_day.date);
  const formattedBestDate = bestTradeDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const resultHTML = `
        <div class="forward-contract-result-block">
            <h2>15-Day Forward Contract Forecast</h2>
            <div class="forward-contract-result-content">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #667eea;">Recommended Trade Date</h3>
                    <p style="font-size: 1.1rem; margin: 5px 0;"><strong>Date:</strong> ${formattedBestDate}</p>
                    <p style="font-size: 1.1rem; margin: 5px 0;"><strong>Equilibrium Price:</strong> ₹${forecast.best_trade_day.price.toFixed(
                      2
                    )}</p>
                    <p style="margin: 10px 0 0 0; color: #6b7280; font-style: italic;">${
                      forecast.best_trade_day.reason
                    }</p>
                </div>
            </div>
            <div style="margin: 30px 0;">
                <canvas id="forecastChart" width="400" height="200"></canvas>
            </div>
            <div class="forward-contract-result-details">
                <p><strong>Amount:</strong> ${formatAmount(data.amount)}</p>
                <p><strong>Currency Pair:</strong> ${data.currencyPair}</p>
                <p><strong>Current Rate:</strong> ${
                  data.currentRate ? data.currentRate.toFixed(4) : "N/A"
                }</p>
                <p><strong>Forecast Period:</strong> 15 days</p>
            </div>
        </div>
    `;

  resultsSection.innerHTML = resultHTML;

  // Create chart
  if (typeof Chart !== "undefined") {
    const ctx = document.getElementById("forecastChart").getContext("2d");
    if (forwardContractChart) {
      forwardContractChart.destroy();
    }
    forwardContractChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: forecast.dates.map((date) => {
          const d = new Date(date);
          return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }),
        datasets: [
          {
            label: "Predicted Price",
            data: forecast.predicted_prices,
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: "Upper Risk Band",
            data: forecast.upper_risk,
            borderColor: "rgba(34, 197, 94, 0.5)",
            backgroundColor: "rgba(34, 197, 94, 0.05)",
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
          },
          {
            label: "Lower Risk Band",
            data: forecast.lower_risk,
            borderColor: "rgba(239, 68, 68, 0.5)",
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: "15-Day Price Forecast",
            font: {
              size: 16,
              weight: "bold",
            },
          },
          legend: {
            display: true,
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Price (₹)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Date",
            },
          },
        },
      },
    });
  }

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "forward-contract-download-pdf-btn";
  downloadBtn.textContent = "Download Contract Note PDF";
  downloadBtn.onclick = () => generateForwardContractPDF(data);
  resultsSection
    .querySelector(".forward-contract-result-block")
    .appendChild(downloadBtn);

  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function generateForwardContractPDF(data) {
  if (typeof window.jspdf === "undefined") {
    alert("PDF library not loaded. Please refresh the page.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FORWARD CONTRACT NOTE", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.text("Contract Details", margin, y);
  y += 8;

  doc.setFontSize(10);

  function addRow(label, value) {
    doc.setFont("Helvetica", "bold");
    doc.text(label + ":", margin, y);
    doc.setFont("Helvetica", "normal");
    doc.text(String(value), margin + 60, y);
    y += 6;
  }

  addRow("Currency Pair", data.currencyPair);
  addRow("Contract Amount", formatAmount(data.amount));
  addRow("Current Market Rate", data.currentRate?.toFixed(4) || "N/A");
  addRow("Forecast Period", "15 days");

  y += 5;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Forecast Summary", margin, y);
  y += 8;
  doc.setFontSize(10);

  if (data.forecastData && data.forecastData.best_trade_day) {
    const bestDate = new Date(data.forecastData.best_trade_day.date);
    const formattedBestDate = bestDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    addRow("Recommended Trade Date", formattedBestDate);
    addRow(
      "Equilibrium Price",
      `₹${data.forecastData.best_trade_day.price.toFixed(2)}`
    );
    addRow("Forecast Period", "15 days");
    y += 4;
  }

  y += 5;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Terms & Disclaimers", margin, y);
  y += 8;

  doc.setFontSize(9);

  const terms = [
    "1. All exchange rates stated herein are indicative and subject to market movements.",
    "2. This document does not constitute financial or legal advice.",
    "3. The client must verify contract details prior to execution.",
    "4. The issuer is not liable for market-driven changes post issuance.",
    "5. This document is system-generated and valid without signature.",
  ];

  terms.forEach((t) => {
    const lines = doc.splitTextToSize(t, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  });

  y += 15;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Authorized Signatory", margin, y);
  y += 20;

  doc.setFont("Helvetica", "normal");
  doc.text("______________________________", margin, y);
  y += 6;
  doc.text("Treasury Operations", margin, y);
  y += 6;
  doc.text("Issued: " + new Date().toLocaleDateString("en-US"), margin, y);

  const filename = `Forward_Contract_${data.currencyPair.replace(
    "/",
    "_"
  )}_${new Date().getTime()}.pdf`;
  doc.save(filename);
}

function formatAmount(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

async function fetchCurrencyRate(currencyPair, currencyPriceDiv) {
  const [baseCurrency, quoteCurrency] = currencyPair.split("/");

  currencyPriceDiv.innerHTML = '<span class="rate-label">Loading...</span>';
  currencyPriceDiv.className = "forward-contract-currency-price loading";

  try {
    let rate;

    if (baseCurrency === "USD") {
      rate = await fetchRateFromUSD(quoteCurrency);
    } else if (quoteCurrency === "USD") {
      const inverseRate = await fetchRateFromUSD(baseCurrency);
      rate = 1 / inverseRate;
    } else {
      const baseToUSD = await fetchRateFromUSD(baseCurrency);
      const quoteToUSD = await fetchRateFromUSD(quoteCurrency);
      rate = baseToUSD / quoteToUSD;
    }

    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    currencyPriceDiv.innerHTML = `
            <span class="rate-value">${rate.toFixed(4)}</span>
            <span class="rate-label">${currencyPair}</span>
            <span class="refresh-indicator">Updated: ${timestamp}</span>
        `;
    currencyPriceDiv.className = "forward-contract-currency-price";
  } catch (error) {
    console.error("Error fetching currency rate:", error);
    currencyPriceDiv.innerHTML =
      '<span class="rate-label">Unable to fetch rate. Please try again.</span>';
    currencyPriceDiv.className = "forward-contract-currency-price error";
  }
}

async function fetchRateFromUSD(currency) {
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/USD`
    );
    if (!response.ok) throw new Error("API request failed");
    const data = await response.json();

    if (data.rates && data.rates[currency]) {
      return data.rates[currency];
    }
    throw new Error("Currency not found");
  } catch (error) {
    // Fallback to exchangerate.host
    try {
      const response = await fetch(
        `https://api.exchangerate.host/latest?base=USD&symbols=${currency}`
      );
      if (!response.ok) throw new Error("Fallback API request failed");
      const data = await response.json();

      if (data.rates && data.rates[currency]) {
        return data.rates[currency];
      }
      throw new Error("Currency not found in fallback");
    } catch (fallbackError) {
      throw new Error("Unable to fetch exchange rate");
    }
  }
}

// ============================================
// INSURANCE DATA STRUCTURES
// ============================================

const insurancePortDirectory = {
  AE: {
    label: "United Arab Emirates",
    ports: [
      { slug: "dubai", label: "Jebel Ali, Dubai (AEDXB)" },
      { slug: "abu-dhabi", label: "Abu Dhabi (AEAUH)" },
      { slug: "jebel-ali", label: "Jebel Ali (AEJEA)" },
    ],
  },
  AU: {
    label: "Australia",
    ports: [
      { slug: "melbourne", label: "Melbourne (AUMEL)" },
      { slug: "sydney", label: "Sydney (AUSYD)" },
    ],
  },
  BE: {
    label: "Belgium",
    ports: [
      { slug: "antwerp", label: "Antwerp (BEANR)" },
      { slug: "zeebrugge", label: "Zeebrugge (BEZEE)" },
    ],
  },
  BR: {
    label: "Brazil",
    ports: [
      { slug: "santos", label: "Santos (BRSSZ)" },
      { slug: "rio-de-janeiro", label: "Rio de Janeiro (BRRIO)" },
    ],
  },
  CN: {
    label: "China",
    ports: [
      { slug: "shanghai", label: "Shanghai (CNSHA)" },
      { slug: "tianjin", label: "Tianjin (CNTJG)" },
      { slug: "ningbo", label: "Ningbo (CNNGB)" },
    ],
  },
  DE: {
    label: "Germany",
    ports: [
      { slug: "hamburg", label: "Hamburg (DEHAM)" },
      { slug: "bremerhaven", label: "Bremerhaven (DEBRV)" },
    ],
  },
  ES: {
    label: "Spain",
    ports: [
      { slug: "valencia", label: "Valencia (ESVLC)" },
      { slug: "barcelona", label: "Barcelona (ESBCN)" },
    ],
  },
  IN: {
    label: "India",
    ports: [
      { slug: "mumbai", label: "Mumbai (INBOM)" },
      { slug: "chennai", label: "Chennai (INMAA)" },
      { slug: "vizag", label: "Visakhapatnam (INVTZ)" },
      { slug: "kolkata", label: "Kolkata (INCCU)" },
    ],
  },
  LK: {
    label: "Sri Lanka",
    ports: [{ slug: "colombo", label: "Colombo (LKCMB)" }],
  },
  MY: {
    label: "Malaysia",
    ports: [
      { slug: "tanjung-pelepas", label: "Tanjung Pelepas (MYTPP)" },
      { slug: "port-klang", label: "Port Klang (MYPKG)" },
    ],
  },
  NL: {
    label: "Netherlands",
    ports: [
      { slug: "rotterdam", label: "Rotterdam (NLRTM)" },
      { slug: "amsterdam", label: "Amsterdam (NLAMS)" },
    ],
  },
  OM: {
    label: "Oman",
    ports: [{ slug: "salalah", label: "Salalah (OMSLL)" }],
  },
  SG: {
    label: "Singapore",
    ports: [{ slug: "singapore", label: "Singapore (SGSIN)" }],
  },
  US: {
    label: "United States",
    ports: [
      { slug: "los-angeles", label: "Los Angeles (USLAX)" },
      { slug: "long-beach", label: "Long Beach (USLGB)" },
      { slug: "new-york", label: "New York / NJ (USNYC)" },
      { slug: "miami", label: "Miami (USMIA)" },
      { slug: "chicago", label: "Chicago (USCHI)" },
    ],
  },
  ZA: {
    label: "South Africa",
    ports: [
      { slug: "durban", label: "Durban (ZADUR)" },
      { slug: "cape-town", label: "Cape Town (ZACPT)" },
    ],
  },
};

const insuranceFallbackCountries = [
  { value: "AE", label: "United Arab Emirates" },
  { value: "AU", label: "Australia" },
  { value: "BE", label: "Belgium" },
  { value: "BR", label: "Brazil" },
  { value: "CN", label: "China" },
  { value: "DE", label: "Germany" },
  { value: "ES", label: "Spain" },
  { value: "IN", label: "India" },
  { value: "LK", label: "Sri Lanka" },
  { value: "MY", label: "Malaysia" },
  { value: "NL", label: "Netherlands" },
  { value: "OM", label: "Oman" },
  { value: "SG", label: "Singapore" },
  { value: "US", label: "United States" },
  { value: "ZA", label: "South Africa" },
];

const insuranceCatalogue = [
  {
    id: "atlas-icc-a",
    provider: "Atlas Marine Mutual",
    product: "Blue Shield ICC (A)",
    url: "https://www.agcs.allianz.com/solutions/marine-cargo-insurance.html",
    coverage: ["ICC A", "War", "SRCC", "Temperature", "High-Value"],
    supportedGoods: [
      "electronics",
      "pharmaceuticals",
      "perishables",
      "machinery",
    ],
    minValue: 50000,
    maxValue: 5000000,
    appetite: {
      ports: [
        "singapore",
        "rotterdam",
        "dubai",
        "mumbai",
        "los-angeles",
        "new-york",
      ],
      modes: ["sea", "air"],
    },
    basePremiumRate: 0.42,
    rating: 4.7,
    notes:
      "Prefers high-value electronics and pharma with airtight packaging proof.",
  },
  {
    id: "harborline-tier2",
    provider: "HarborLine Syndicate",
    product: "Tier 2 Global Cargo (ICC B)",
    url: "https://www.lloyds.com/solutions/marine",
    coverage: ["ICC B", "General Average", "War"],
    supportedGoods: ["machinery", "automotive", "textiles", "bulk"],
    minValue: 20000,
    maxValue: 2500000,
    appetite: {
      ports: ["antwerp", "hamburg", "chennai", "tanjung-pelepas", "long-beach"],
      modes: ["sea", "rail"],
    },
    basePremiumRate: 0.28,
    rating: 4.3,
    notes: "Competitive for industrial cargo, requires survey for >USD 2M.",
  },
  {
    id: "aerosecure-air",
    provider: "AeroSecure Underwriting",
    product: "Just-in-Time Air Hull",
    url: "https://www.chubb.com/us-en/businesses/resources/aerospace-insurance.html",
    coverage: ["ICC Air", "High-Value", "Delay"],
    supportedGoods: ["electronics", "pharmaceuticals", "automotive"],
    minValue: 10000,
    maxValue: 1500000,
    appetite: {
      ports: ["dubai", "hamburg", "chicago", "shanghai"],
      modes: ["air"],
    },
    basePremiumRate: 0.65,
    rating: 4.8,
    notes: "Includes expedited claims on temp-controlled air freight.",
  },
  {
    id: "evertrust-perishables",
    provider: "Evertrust",
    product: "ColdLink ICC (A) + TempGuard",
    url: "https://www.msig.com.sg/business/solutions/marine/marine-cargo-insurance",
    coverage: ["ICC A", "Temperature", "Contamination"],
    supportedGoods: ["perishables", "pharmaceuticals", "bulk"],
    minValue: 15000,
    maxValue: 1200000,
    appetite: {
      ports: ["valencia", "rotterdam", "miami", "jebel-ali", "melbourne"],
      modes: ["sea", "air", "road"],
    },
    basePremiumRate: 0.58,
    rating: 4.6,
    notes: "Requires IoT telemetry for temp excursions coverage to apply.",
  },
  {
    id: "terra-icc-c",
    provider: "Terra Assurance",
    product: "Economy ICC (C)",
    url: "https://axaxl.com/insurance/coverages/marine-cargo",
    coverage: ["ICC C", "General Average"],
    supportedGoods: ["bulk", "textiles", "machinery"],
    minValue: 5000,
    maxValue: 800000,
    appetite: {
      ports: ["colombo", "salalah", "vizag", "durban", "santos"],
      modes: ["sea", "road"],
    },
    basePremiumRate: 0.14,
    rating: 3.9,
    notes: "Value option for shippers with higher deductible appetite.",
  },
];

// ============================================
// INSURANCE FUNCTIONALITY
// ============================================

function initializeInsuranceModule() {
  const insuranceForm = document.getElementById("shipment-form");
  if (!insuranceForm) return;

  loadInsuranceCountryOptions();
  setupInsuranceEventListeners();
}

async function loadInsuranceCountryOptions() {
  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,cca2"
    );
    if (!response.ok) throw new Error("Country fetch failed");
    const payload = await response.json();
    const countries = payload
      .map((country) => ({
        value: country.cca2,
        label: country.name?.common ?? country.cca2,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    populateInsuranceCountrySelects(countries);
  } catch (error) {
    console.warn("Using fallback country list for insurance", error);
    populateInsuranceCountrySelects(insuranceFallbackCountries);
  }
}

function populateInsuranceCountrySelects(countries) {
  const originSelect = document.getElementById("insurance-origin-country");
  const destSelect = document.getElementById("insurance-destination-country");

  if (originSelect) {
    countries.forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      originSelect.appendChild(option);
    });
  }

  if (destSelect) {
    countries.forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      destSelect.appendChild(option);
    });
  }

  setupInsurancePortHandlers();
}

function setupInsurancePortHandlers() {
  const originCountrySelect = document.getElementById(
    "insurance-origin-country"
  );
  const destinationCountrySelect = document.getElementById(
    "insurance-destination-country"
  );

  if (originCountrySelect) {
    originCountrySelect.addEventListener("change", (e) => {
      updateInsurancePortOptions("insurance-origin-port", e.target.value);
    });
  }

  if (destinationCountrySelect) {
    destinationCountrySelect.addEventListener("change", (e) => {
      updateInsurancePortOptions("insurance-destination-port", e.target.value);
    });
  }
}

function updateInsurancePortOptions(portSelectId, countryKey) {
  const portSelect = document.getElementById(portSelectId);
  if (!portSelect) return;

  portSelect.innerHTML = '<option value="">Select port</option>';
  portSelect.disabled = true;
  resetInsurancePortInput(portSelectId);

  if (!countryKey) return;

  const directory = insurancePortDirectory[countryKey];
  const ports = directory?.ports || [];

  ports.forEach((port) => {
    const option = document.createElement("option");
    option.value = port.slug;
    option.textContent = port.label;
    portSelect.appendChild(option);
  });

  const manualOption = document.createElement("option");
  manualOption.value = "__manual";
  manualOption.textContent = "Other / not listed";
  portSelect.appendChild(manualOption);

  portSelect.disabled = false;

  portSelect.addEventListener("change", (e) => {
    if (e.target.value === "__manual") {
      toggleInsuranceManualPort(portSelectId, true);
    } else {
      toggleInsuranceManualPort(portSelectId, false);
    }
  });
}

function toggleInsuranceManualPort(portSelectId, active) {
  const manualInputId = portSelectId + "-manual";
  const manualInput = document.getElementById(manualInputId);
  const portSelect = document.getElementById(portSelectId);

  if (!manualInput) return;

  if (active) {
    manualInput.hidden = false;
    manualInput.required = true;
    portSelect.required = false;
  } else {
    manualInput.hidden = true;
    manualInput.required = false;
    manualInput.value = "";
    portSelect.required = true;
  }
}

function resetInsurancePortInput(portSelectId) {
  const manualInputId = portSelectId + "-manual";
  const manualInput = document.getElementById(manualInputId);

  if (manualInput) {
    manualInput.hidden = true;
    manualInput.required = false;
    manualInput.value = "";
  }
}

function resolveInsurancePortSelection(portSelectId) {
  const portSelect = document.getElementById(portSelectId);
  const manualInputId = portSelectId + "-manual";
  const manualInput = document.getElementById(manualInputId);

  if (portSelect && portSelect.value && portSelect.value !== "__manual") {
    return {
      value: portSelect.value,
      label: portSelect.selectedOptions[0]?.textContent || "",
    };
  }

  if (manualInput && !manualInput.hidden && manualInput.value.trim()) {
    const label = manualInput.value.trim();
    return {
      value: label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      label: label,
    };
  }

  return { value: "", label: "" };
}

function scoreInsuranceProduct(shipment, product) {
  let score = 0;
  const reasons = [];

  if (product.supportedGoods.includes(shipment.goodsType)) {
    score += 25;
    reasons.push("Commodity appetite aligned.");
  }

  if (
    shipment.shipmentValue >= product.minValue &&
    shipment.shipmentValue <= product.maxValue
  ) {
    score += 20;
    reasons.push("Declared value within underwriting band.");
  } else if (shipment.shipmentValue <= product.maxValue * 1.2) {
    score += 8;
    reasons.push("Value slightly outside band; manual approval likely.");
  }

  const lanes = product.appetite.ports;
  const matchedPorts = [];
  if (shipment.originPort && lanes.includes(shipment.originPort)) {
    matchedPorts.push(shipment.originPortLabel || "origin port");
  }
  if (shipment.destinationPort && lanes.includes(shipment.destinationPort)) {
    matchedPorts.push(shipment.destinationPortLabel || "destination port");
  }
  if (matchedPorts.length) {
    score += matchedPorts.length === 2 ? 20 : 15;
    reasons.push(`Known trade lane via ${matchedPorts.join(" & ")}.`);
  }

  if (product.appetite.modes.includes(shipment.transportMode)) {
    score += 15;
    reasons.push("Supports selected transport mode.");
  }

  if (
    shipment.riskProfile === "conservative" &&
    product.coverage.includes("ICC A")
  ) {
    score += 10;
    reasons.push("High-coverage clause for conservative posture.");
  }

  if (shipment.riskProfile === "aggressive" && product.basePremiumRate < 0.4) {
    score += 10;
    reasons.push("Lean rate aligns with cost-focused approach.");
  }

  score += Math.min(15, product.rating * 3);
  score = Math.min(100, score);

  return {
    product,
    score,
    reasons,
    estimatedPremium: (
      (shipment.shipmentValue * product.basePremiumRate) /
      100
    ).toFixed(2),
  };
}

function classifyInsuranceScore(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function setInsuranceSubmitLoading(isLoading) {
  const submitBtn = document.getElementById("insurance-submit-btn");
  if (!submitBtn) return;

  if (isLoading) {
    submitBtn.classList.add("loading");
    submitBtn.textContent = "Scanning markets...";
  } else {
    submitBtn.classList.remove("loading");
    submitBtn.textContent = "Find best-fit insurance";
  }
}

function renderInsuranceResults(recommendations) {
  const resultsContainer = document.getElementById("insurance-results");
  if (!resultsContainer) return;

  if (!recommendations.length) {
    resultsContainer.classList.add("empty");
    resultsContainer.innerHTML =
      "<p>No strong matches yet. Try adjusting commodity or shipment value.</p>";
    return;
  }

  resultsContainer.classList.remove("empty");
  resultsContainer.innerHTML = recommendations
    .map(({ product, score, reasons, estimatedPremium }) => {
      const badges = product.coverage
        .map((c) => `<span class="insurance-tag">${c}</span>`)
        .join("");
      const reasons_html = reasons.map((r) => `<li>${r}</li>`).join("");

      return `
                <article class="insurance-result-card">
                    <header>
                        <div>
                            <h3>${product.product}</h3>
                            <p>${product.provider}</p>
                        </div>
                        <span class="insurance-score-badge ${classifyInsuranceScore(
                          score
                        )}">Score ${Math.round(score)}/100</span>
                    </header>
                    <div class="insurance-tag-row">
                        ${badges}
                        <span class="insurance-tag">Premium ≈ $${estimatedPremium}</span>
                        <span class="insurance-tag">Rating: ${
                          product.rating
                        }</span>
                    </div>
                    <a class="insurance-result-link" href="${
                      product.url
                    }" target="_blank" rel="noopener">
                        View policy deck ↗
                    </a>
                    <ul>
                        ${reasons_html}
                    </ul>
                    <p>${product.notes}</p>
                </article>
            `;
    })
    .join("");
}

function handleInsuranceSubmit(event) {
  event.preventDefault();
  setInsuranceSubmitLoading(true);

  const form = document.getElementById("shipment-form");
  const formData = new FormData(form);

  const originPortInfo = resolveInsurancePortSelection("insurance-origin-port");
  const destinationPortInfo = resolveInsurancePortSelection(
    "insurance-destination-port"
  );

  const shipment = {
    goodsType: formData.get("goodsType"),
    shipmentValue: Number(formData.get("shipmentValue")),
    originCountry: formData.get("originCountry"),
    originPort: originPortInfo.value,
    originPortLabel: originPortInfo.label,
    destinationCountry: formData.get("destinationCountry"),
    destinationPort: destinationPortInfo.value,
    destinationPortLabel: destinationPortInfo.label,
    transportMode: formData.get("transportMode"),
    riskProfile: formData.get("riskProfile"),
    notes: formData.get("notes"),
  };

  const recommendations = insuranceCatalogue
    .map((product) => scoreInsuranceProduct(shipment, product))
    .filter((rec) => rec.score > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  renderInsuranceResults(recommendations);

  const resultsContainer = document.getElementById("insurance-results");
  if (resultsContainer) {
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  setInsuranceSubmitLoading(false);
}

function exportInsuranceResults() {
  const resultsContainer = document.getElementById("insurance-results");
  const cards = resultsContainer
    ? [...resultsContainer.querySelectorAll(".insurance-result-card")]
    : [];

  if (!cards.length) {
    alert("No results to export. Please generate recommendations first.");
    return;
  }

  const data = cards.map((card) => ({
    policy: card.querySelector("h3").textContent,
    provider: card.querySelector("p").textContent,
    score: card.querySelector(".insurance-score-badge").textContent,
    url: card.querySelector(".insurance-result-link")?.href ?? "",
    details: [...card.querySelectorAll("li")].map((li) => li.textContent),
  }));

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "insurance-recommendations.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function setupInsuranceEventListeners() {
  const insuranceForm = document.getElementById("shipment-form");
  const exportBtn = document.getElementById("insurance-export-btn");

  if (insuranceForm) {
    insuranceForm.addEventListener("submit", handleInsuranceSubmit);
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportInsuranceResults);
  }
}

// ============================================
// DOCUMENTS DATA STRUCTURES
// ============================================

const DOCUMENT_MODES = ["sea", "air", "imports", "exports"];

const countryDocumentMatrix = [
  {
    id: "india",
    name: "India",
    corridor: "Nhava Sheva (JNPT), Mundra, Chennai",
    modes: ["sea", "air", "exports"],
    quickChecklist: [
      "Commercial Invoice with HS and GST compliance – see ICEGATE valuation guidance.",
      "Packing List carton-wise for customs inspection.",
      "Shipping Bill submitted electronically via ICEGATE before port entry.",
      "Carrier issued Bill of Lading or Air Waybill for proof of shipment.",
      "Certificate of Origin from DGFT/chamber for FTA benefits (e-COO portal).",
      "Export Declaration (GR/SDF equivalents) filed with Authorized Dealer bank per RBI rules.",
    ],
    requirements: [
      {
        document: "Commercial Invoice",
        use: "Customs valuation, buyer payment documentation",
        issuer: "Exporter / Company",
        linkLabel: "ICEGATE Guidelines",
        linkUrl: "https://icegate.gov.in",
      },
      {
        document: "Packing List",
        use: "Physical examination & load planning",
        issuer: "Exporter / Company",
        linkLabel: "CBIC Export Procedures",
        linkUrl: "https://www.cbic.gov.in",
      },
      {
        document: "Shipping Bill",
        use: "Primary export declaration at port",
        issuer: "Indian Customs via broker/exporter",
        linkLabel: "ICEGATE – Shipping Bill",
        linkUrl: "https://icegate.gov.in",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Title transfer & shipment proof",
        issuer: "Shipping line / Freight forwarder / Airline",
        linkLabel: "Directorate General of Shipping",
        linkUrl: "https://www.dgshipping.gov.in",
      },
      {
        document: "Certificate of Origin",
        use: "Claim preferential duty at destination",
        issuer: "DGFT / Chamber of Commerce",
        linkLabel: "DGFT e-COO Portal",
        linkUrl: "https://coo.dgft.gov.in",
      },
      {
        document: "Export Declaration (GR/SDF)",
        use: "Foreign exchange compliance with RBI",
        issuer: "Authorized Dealer Bank & Exporter",
        linkLabel: "RBI Export FAQs",
        linkUrl: "https://rbi.org.in",
      },
    ],
  },
  {
    id: "united-states",
    name: "United States",
    corridor: "Ports: New York/New Jersey, Los Angeles, Savannah",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice with value, terms, HS code (CBP).",
      "Packing List for CBP inspection and terminal handling.",
      "Carrier Bill of Lading or Air Waybill for arrival notice.",
      "ISF 10+2 security filing for ocean shipments before loading.",
      "CBP Entry (3461/7501) filed via customs broker in ACE.",
      "Partner agency filings (FDA/USDA) when applicable.",
    ],
    requirements: [
      {
        document: "Commercial Invoice",
        use: "CBP customs entry & duty assessment",
        issuer: "Exporter / Foreign Supplier",
        linkLabel: "US CBP",
        linkUrl: "https://www.cbp.gov",
      },
      {
        document: "Packing List",
        use: "CBP inspection & deconsolidation",
        issuer: "Exporter / Foreign Supplier",
        linkLabel: "CBP Trade",
        linkUrl: "https://www.cbp.gov/trade",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Arrival notice & cargo release",
        issuer: "Carrier / NVOCC / Airline",
        linkLabel: "Federal Maritime Commission",
        linkUrl: "https://www.fmc.gov",
      },
      {
        document: "ISF 10+2",
        use: "Security filing for ocean cargo",
        issuer: "US Importer / Customs Broker",
        linkLabel: "CBP ISF 10+2",
        linkUrl:
          "https://www.cbp.gov/border-security/ports-entry/cargo-security/importer-security-filing-102",
      },
      {
        document: "Customs Entry (CBP 3461/7501)",
        use: "Formal import clearance",
        issuer: "US Customs Broker / Importer",
        linkLabel: "CBP Basic Importing",
        linkUrl: "https://www.cbp.gov/trade/basic-import-export",
      },
      {
        document: "FDA / USDA / Partner Agency Docs",
        use: "Regulatory clearance for controlled goods",
        issuer: "US FDA / USDA / Relevant agency",
        linkLabel: "US FDA Import Basics",
        linkUrl: "https://www.fda.gov/industry/import-basics",
      },
    ],
  },
  {
    id: "european-union",
    name: "European Union",
    corridor: "Ports: Rotterdam, Hamburg, Antwerp",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice & Packing List for customs declaration/VAT.",
      "Carrier Bill of Lading or Air Waybill for delivery order.",
      "ENS / ICS2 security filing before arrival.",
      "EU SAD customs declaration lodged via broker.",
      "EUR.1 / REX / Certificate of origin for preferential duty.",
      "Product specific certificates (health, phytosanitary, CE).",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "Customs declaration base, VAT & duty calc",
        issuer: "Exporter",
        linkLabel: "EU Taxation & Customs",
        linkUrl: "https://taxation-customs.ec.europa.eu",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Proof of shipment, release at port",
        issuer: "Carrier / Freight Forwarder",
        linkLabel: "Port of Rotterdam",
        linkUrl: "https://www.portofrotterdam.com",
      },
      {
        document: "ENS (ICS2)",
        use: "Pre-arrival safety/security filing",
        issuer: "Carrier / Representative",
        linkLabel: "ICS2 Security Filing",
        linkUrl:
          "https://taxation-customs.ec.europa.eu/customs-4/customs-security/import-control-system-2-ics2_en",
      },
      {
        document: "EU Customs Declaration (SAD)",
        use: "Release into free circulation or regimes",
        issuer: "Customs Broker / Importer",
        linkLabel: "EU Customs Procedures",
        linkUrl:
          "https://taxation-customs.ec.europa.eu/customs-4/customs-procedures_en",
      },
      {
        document: "Certificates (EUR.1 / REX / Origin)",
        use: "Preferential duty & FTA claims",
        issuer: "Exporter / Competent authority",
        linkLabel: "EU Preferential Origin",
        linkUrl:
          "https://taxation-customs.ec.europa.eu/customs-4/preferential-origins_en",
      },
      {
        document: "Product-Specific Certificates",
        use: "Health/phytosanitary/CE compliance",
        issuer: "Competent Authorities / Labs",
        linkLabel: "EU Sanitary Rules",
        linkUrl:
          "https://ec.europa.eu/info/food-farming-fisheries/farming/international-cooperation/trade_en",
      },
    ],
  },
  {
    id: "united-kingdom",
    name: "United Kingdom",
    corridor: "Ports: Felixstowe, Southampton, London Gateway",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice & Packing List per HMRC guidance.",
      "Bill of Lading/AWB for UK Border Force release.",
      "CDS customs declaration via broker/trader.",
      "UK Certificate of Origin / EUR.1 from chamber when required.",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "UK customs declaration data",
        issuer: "Exporter",
        linkLabel: "HMRC Customs Declaration Guidance",
        linkUrl:
          "https://www.gov.uk/guidance/filling-in-your-customs-declaration",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Evidence of carriage & release",
        issuer: "Carrier / Freight Forwarder",
        linkLabel: "UK Border Force",
        linkUrl: "https://www.gov.uk/government/organisations/border-force",
      },
      {
        document: "CDS Customs Declaration",
        use: "Entry into HMRC CDS system",
        issuer: "Customs broker / Importer",
        linkLabel: "Get access to CDS",
        linkUrl:
          "https://www.gov.uk/guidance/get-access-to-the-customs-declaration-service",
      },
      {
        document: "Certificate of Origin / EUR.1",
        use: "Preferential duty or buyer requirement",
        issuer: "British Chambers of Commerce",
        linkLabel: "British Chambers Export Docs",
        linkUrl: "https://www.britishchambers.org.uk/page/export-documentation",
      },
    ],
  },
  {
    id: "canada",
    name: "Canada",
    corridor: "Ports: Vancouver, Prince Rupert, Montreal",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice or Canada Customs Invoice (CBSA).",
      "Packing List for CBSA / CFIA inspection.",
      "Carrier Bill of Lading or Air Waybill.",
      "Customs Declaration (B3) filed via broker/importer in CARM.",
      "CUSMA/phytosanitary certificates when commodity requires.",
    ],
    requirements: [
      {
        document: "Commercial Invoice / Canada Customs Invoice",
        use: "Import valuation & CBSA assessment",
        issuer: "Exporter / Importer",
        linkLabel: "CBSA Importing",
        linkUrl: "https://www.cbsa-asfc.gc.ca/import/menu-eng.html",
      },
      {
        document: "Packing List",
        use: "Inspection & de-stuffing",
        issuer: "Exporter",
        linkLabel: "CBSA Programs",
        linkUrl: "https://www.cbsa-asfc.gc.ca/prog/ccp-pcc/menu-eng.html",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Manifest & release",
        issuer: "Carrier",
        linkLabel: "Port of Vancouver",
        linkUrl: "https://www.portvancouver.com",
      },
      {
        document: "Customs Declaration (B3)",
        use: "Entry into Canada (CARM/CCS)",
        issuer: "Customs broker / Importer",
        linkLabel: "CBSA CARM",
        linkUrl: "https://www.cbsa-asfc.gc.ca/prog/carm-gcra/menu-eng.html",
      },
      {
        document: "Certificates (CUSMA, Phyto, CFIA)",
        use: "Reduced duty or sanitary clearance",
        issuer: "Authorized bodies / CFIA",
        linkLabel: "CFIA Import Guidance",
        linkUrl: "https://inspection.canada.ca",
      },
    ],
  },
  {
    id: "australia",
    name: "Australia",
    corridor: "Ports: Sydney, Melbourne, Brisbane",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice & Packing List (Australian Border Force).",
      "Bill of Lading or Air Waybill for ICS filing.",
      "Import Declaration (N10/N20) via Integrated Cargo System.",
      "Biosecurity treatment or phytosanitary certificates (DAFF).",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "ABF import declaration",
        issuer: "Exporter",
        linkLabel: "Australian Border Force",
        linkUrl:
          "https://www.abf.gov.au/importing-exporting-and-manufacturing/importing",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Manifest submission & delivery order",
        issuer: "Carrier",
        linkLabel: "Integrated Cargo System",
        linkUrl: "https://www.abf.gov.au/help-and-support/ics",
      },
      {
        document: "Import Declaration (ICS)",
        use: "Formal entry (N10/N20)",
        issuer: "Customs broker / Importer",
        linkLabel: "ICS Lodgement",
        linkUrl: "https://www.abf.gov.au/help-and-support/ics",
      },
      {
        document: "Biosecurity Certificates",
        use: "DAFF clearance (phytosanitary/treatment)",
        issuer: "Department of Agriculture / Competent labs",
        linkLabel: "DAFF Biosecurity",
        linkUrl: "https://www.agriculture.gov.au/biosecurity-trade/import",
      },
    ],
  },
  {
    id: "china",
    name: "China",
    corridor: "Ports: Shanghai, Ningbo, Shenzhen",
    modes: ["sea", "air", "imports", "exports"],
    quickChecklist: [
      "Commercial Invoice & Packing List aligned with GACC requirements.",
      "Bill of Lading / Air Waybill for manifest & release.",
      "CIQ / GACC declarations for regulated goods.",
      "Import/Export licenses, CCC or product registrations when required.",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "GACC customs clearance",
        issuer: "Exporter",
        linkLabel: "China Customs",
        linkUrl: "https://english.customs.gov.cn",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Manifest submission & delivery order",
        issuer: "Carrier",
        linkLabel: "Port of Shanghai",
        linkUrl: "https://www.portshanghai.com.cn/en",
      },
      {
        document: "CIQ / GACC Declaration",
        use: "Inspection & quarantine compliance",
        issuer: "GACC / CIQ",
        linkLabel: "GACC",
        linkUrl: "https://www.gacc.gov.cn",
      },
      {
        document: "Import/Export License & CCC certificate",
        use: "Market access for regulated goods",
        issuer: "MOFCOM / SAMR",
        linkLabel: "MOFCOM Trade",
        linkUrl: "http://english.mofcom.gov.cn",
      },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    corridor: "Ports: Tokyo, Yokohama, Osaka",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice & Packing List per Japan Customs.",
      "Bill of Lading / Air Waybill for NACCS submission.",
      "Import Declaration via NACCS (broker).",
      "Certificates (fumigation, agriculture, PSE) per commodity.",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "Japan Customs entry data",
        issuer: "Exporter",
        linkLabel: "Japan Customs",
        linkUrl: "https://www.customs.go.jp/english/index.htm",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Transport evidence & NACCS filing",
        issuer: "Carrier",
        linkLabel: "NACCS",
        linkUrl: "https://www.naccs.jp/english/",
      },
      {
        document: "Import Declaration",
        use: "Release into Japan via NACCS",
        issuer: "Customs broker / Importer",
        linkLabel: "NACCS User Guide",
        linkUrl: "https://www.naccs.jp/english/service/",
      },
      {
        document: "Certificates (PSE, Phyto, MAFF)",
        use: "Commodity-specific compliance",
        issuer: "MAFF / METI / Labs",
        linkLabel: "MAFF Trade",
        linkUrl: "https://www.maff.go.jp/e/index.html",
      },
    ],
  },
  {
    id: "singapore",
    name: "Singapore",
    corridor: "Port of Singapore & Changi Airfreight Centre",
    modes: ["sea", "air", "imports", "exports"],
    quickChecklist: [
      "Commercial Invoice & Packing List for Singapore Customs.",
      "Bill of Lading / Air Waybill for manifest submission in TradeNet.",
      "Permit applications lodged via TradeNet.",
      "Agency certificates (SFA, IMDA) for restricted goods.",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "Baseline customs data",
        issuer: "Exporter",
        linkLabel: "Singapore Customs",
        linkUrl: "https://www.customs.gov.sg",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Manifest & delivery order",
        issuer: "Carrier",
        linkLabel: "MPA Singapore",
        linkUrl: "https://www.mpa.gov.sg",
      },
      {
        document: "TradeNet Permit",
        use: "Import/export permit clearance",
        issuer: "Trader / Declaring agent",
        linkLabel: "TradeNet",
        linkUrl: "https://www.customs.gov.sg/businesses/permit-declaration",
      },
      {
        document: "Agency Certificates",
        use: "Regulated commodities clearance (SFA, IMDA)",
        issuer: "Competent agencies",
        linkLabel: "Singapore Food Agency",
        linkUrl: "https://www.sfa.gov.sg",
      },
    ],
  },
  {
    id: "united-arab-emirates",
    name: "United Arab Emirates",
    corridor: "Ports: Jebel Ali, Khalifa Port, Dubai Airport",
    modes: ["sea", "air", "imports", "exports"],
    quickChecklist: [
      "Commercial Invoice & Packing List attested as per UAE customs.",
      "Bill of Lading / Air Waybill for manifest submission.",
      "Import/Export declarations lodged via single window (Dubai Trade).",
      "Certificate of Origin via local chamber portals.",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "Customs valuation & inspection",
        issuer: "Exporter",
        linkLabel: "Dubai Customs",
        linkUrl: "https://www.dubaicustoms.gov.ae",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Manifest filing & delivery order",
        issuer: "Carrier",
        linkLabel: "Dubai Trade",
        linkUrl: "https://www.dubaitrade.ae",
      },
      {
        document: "Import/Export Declaration",
        use: "Single window clearance",
        issuer: "Trader / Broker",
        linkLabel: "Dubai Trade Portal",
        linkUrl: "https://www.dubaitrade.ae",
      },
      {
        document: "Certificate of Origin",
        use: "Destination compliance / duty preference",
        issuer: "Dubai Chamber / Local chambers",
        linkLabel: "Dubai Chamber",
        linkUrl: "https://www.dubaichamber.com",
      },
    ],
  },
  {
    id: "saudi-arabia",
    name: "Saudi Arabia",
    corridor: "Ports: Jeddah Islamic Port, Dammam, Riyadh Air Cargo",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice & Packing List registered on FASAH.",
      "Bill of Lading / Air Waybill uploaded through single window.",
      "SABER/SASO certificates for regulated products.",
      "Customs declaration filed via ZATCA.",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "FASAH registration & customs valuation",
        issuer: "Exporter",
        linkLabel: "FASAH",
        linkUrl: "https://www.fasah.sa/",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Manifest submission",
        issuer: "Carrier",
        linkLabel: "Saudi Ports Authority (MAWANI)",
        linkUrl: "https://www.mawani.gov.sa",
      },
      {
        document: "SASO / SABER Certificates",
        use: "Product conformity",
        issuer: "SASO certified bodies",
        linkLabel: "SABER Platform",
        linkUrl: "https://saber.sa",
      },
      {
        document: "Customs Declaration",
        use: "ZATCA clearance & duty payment",
        issuer: "Customs broker / Importer",
        linkLabel: "ZATCA Customs",
        linkUrl:
          "https://www.zatca.gov.sa/en/RulesRegulations/Taxes/Pages/Customs.aspx",
      },
    ],
  },
  {
    id: "brazil",
    name: "Brazil",
    corridor: "Ports: Santos, Paranaguá, Rio de Janeiro",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice & Packing List (Portuguese translation when requested).",
      "Bill of Lading / Air Waybill recorded in Siscomex.",
      "Import Declaration (DI/DUIMP) via Siscomex.",
      "ANVISA/MAPA certificates for regulated goods.",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "Receita Federal customs entry",
        issuer: "Exporter",
        linkLabel: "Receita Federal",
        linkUrl: "https://www.gov.br/receitafederal/pt-br",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Manifest record in Siscomex",
        issuer: "Carrier",
        linkLabel: "Port of Santos",
        linkUrl: "https://www.portodesantos.com.br",
      },
      {
        document: "Import Declaration (DI/DUIMP)",
        use: "Formal customs clearance",
        issuer: "Customs broker / Importer",
        linkLabel: "Siscomex",
        linkUrl: "https://www.gov.br/receitafederal/pt-br/assuntos/siscomex",
      },
      {
        document: "ANVISA / MAPA Certificates",
        use: "Health & agriculture compliance",
        issuer: "Competent agencies",
        linkLabel: "ANVISA",
        linkUrl: "https://www.gov.br/anvisa/pt-br",
      },
    ],
  },
  {
    id: "mexico",
    name: "Mexico",
    corridor: "Ports: Manzanillo, Veracruz, Lazaro Cardenas",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice & Packing List per SAT guidance.",
      "Bill of Lading / Air Waybill for pedimento filing.",
      "Pedimento customs entry via VUCEM.",
      "NOM/COFEPRIS/SENASICA certificates when applicable.",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "SAT customs entry data",
        issuer: "Exporter",
        linkLabel: "SAT",
        linkUrl: "https://www.sat.gob.mx",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Pedimento reference & manifest",
        issuer: "Carrier",
        linkLabel: "Mexican Customs",
        linkUrl: "https://www.aduanas.gob.mx",
      },
      {
        document: "Pedimento (Customs Entry)",
        use: "Formal clearance via broker",
        issuer: "Customs broker / Importer",
        linkLabel: "VUCEM",
        linkUrl: "https://www.ventanillaunica.gob.mx",
      },
      {
        document: "NOM / COFEPRIS / SENASICA Certificates",
        use: "Product conformity & sanitary approvals",
        issuer: "Relevant agency",
        linkLabel: "COFEPRIS",
        linkUrl: "https://www.gob.mx/cofepris",
      },
    ],
  },
  {
    id: "south-africa",
    name: "South Africa",
    corridor: "Ports: Durban, Cape Town, Port Elizabeth",
    modes: ["sea", "air", "imports"],
    quickChecklist: [
      "Commercial Invoice & Packing List aligned with SARS.",
      "Bill of Lading / Air Waybill for manifest & release.",
      "Customs Clearance (DA500/SAD 500) via broker.",
      "Permits/certificates (DAFF, NRCS) for regulated goods.",
    ],
    requirements: [
      {
        document: "Commercial Invoice & Packing List",
        use: "SARS customs valuation",
        issuer: "Exporter",
        linkLabel: "SARS Customs & Excise",
        linkUrl: "https://www.sars.gov.za/customs-and-excise",
      },
      {
        document: "Bill of Lading / Air Waybill",
        use: "Manifest, release & delivery order",
        issuer: "Carrier",
        linkLabel: "Transnet National Ports Authority",
        linkUrl: "https://www.transnetnationalportsauthority.net",
      },
      {
        document: "Customs Clearance (SAD 500)",
        use: "Entry into South Africa",
        issuer: "Customs broker / Importer",
        linkLabel: "SARS Clearance",
        linkUrl:
          "https://www.sars.gov.za/customs-and-excise/importing-exporting",
      },
      {
        document: "Permits / Certificates (DAFF, NRCS)",
        use: "Commodity-specific compliance",
        issuer: "DAFF / NRCS",
        linkLabel: "Department of Agriculture",
        linkUrl: "https://www.dalrrd.gov.za",
      },
    ],
  },
];

let documentRequirementsInitialized = false;

function initializeDocumentRequirementsSection() {
  if (documentRequirementsInitialized) return;

  const countrySelect = document.getElementById("docCountrySelect");
  const modeSelect = document.getElementById("docModeSelect");

  if (!countrySelect || !modeSelect) {
    return;
  }

  populateDocumentCountryOptions(countrySelect);
  populateDocumentModeOptions(modeSelect);

  countrySelect.addEventListener("change", () => {
    updateDocumentRequirementsDisplay();
    resetDocumentChecklistResult();
  });

  modeSelect.addEventListener("change", () => {
    updateDocumentRequirementsDisplay();
    resetDocumentChecklistResult();
  });

  updateDocumentRequirementsDisplay();
  documentRequirementsInitialized = true;
}

function populateDocumentCountryOptions(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = countryDocumentMatrix
    .map((country) => `<option value="${country.id}">${country.name}</option>`)
    .join("");
}

function populateDocumentModeOptions(selectEl) {
  if (!selectEl) return;
  const options = ["all", ...DOCUMENT_MODES].map(
    (mode) => `<option value="${mode}">${formatModeLabel(mode)}</option>`
  );
  selectEl.innerHTML = options.join("");
}

function updateDocumentRequirementsDisplay(presetCountryId, presetMode) {
  const countrySelect = document.getElementById("docCountrySelect");
  const modeSelect = document.getElementById("docModeSelect");
  const targetCountryId =
    presetCountryId || countrySelect?.value || countryDocumentMatrix[0]?.id;
  const targetMode = presetMode || modeSelect?.value || "all";

  if (countrySelect && targetCountryId) {
    countrySelect.value = targetCountryId;
  }
  if (modeSelect && targetMode) {
    modeSelect.value = targetMode;
  }

  const countryData = getCountryDataById(targetCountryId);
  renderDocumentRequirementsTable(countryData, targetMode);
}

function getCountryDataById(countryId) {
  return countryDocumentMatrix.find((country) => country.id === countryId);
}

function renderDocumentRequirementsTable(countryData, mode) {
  const container = document.getElementById("docRequirementsTable");
  if (!container) return;

  if (!countryData) {
    container.innerHTML = `<div class="doc-empty-state">We couldn't find requirements for the selected country yet. Please choose another option.</div>`;
    return;
  }

  if (mode && mode !== "all" && !countryData.modes.includes(mode)) {
    container.innerHTML = `<div class="doc-empty-state">We haven't mapped ${formatModeLabel(
      mode
    )} requirements for ${countryData.name} yet. Try another mode.</div>`;
    return;
  }

  const rows = countryData.requirements
    .map(
      (req) => `
        <tr>
            <td>${req.document}</td>
            <td>${req.use}</td>
            <td>${req.issuer}</td>
            <td>
                ${
                  req.linkUrl
                    ? `<a href="${
                        req.linkUrl
                      }" target="_blank" rel="noopener">${
                        req.linkLabel || "Official Link"
                      }</a>`
                    : "-"
                }
            </td>
        </tr>
    `
    )
    .join("");

  container.innerHTML = `
        <div class="doc-table-card">
            <div class="doc-table-card-head">
                <div>
                    <h4>${countryData.name}</h4>
                    <p>${countryData.corridor || ""}</p>
                </div>
                <span class="doc-table-badge">${formatModeLabel(mode)}</span>
            </div>
            <div class="doc-requirements-table">
                <table>
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>Typical Use</th>
                            <th>Issuer</th>
                            <th>Official Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function formatModeLabel(mode) {
  if (!mode || mode === "all") return "All Modes";
  const labels = {
    sea: "Sea Freight",
    air: "Air Freight",
    imports: "Imports",
    exports: "Exports",
  };
  return labels[mode] || mode.charAt(0).toUpperCase() + mode.slice(1);
}

function resetDocumentChecklistResult() {
  const checklistEl = document.getElementById("docChecklistResult");
  if (checklistEl) {
    checklistEl.classList.remove("active");
    checklistEl.textContent = "";
  }
}

function generateDocumentChecklist() {
  const countrySelect = document.getElementById("docCountrySelect");
  const modeSelect = document.getElementById("docModeSelect");
  const checklistEl = document.getElementById("docChecklistResult");

  if (!countrySelect || !modeSelect || !checklistEl) return;

  const countryData = getCountryDataById(countrySelect.value);
  const selectedMode = modeSelect.value;

  if (!countryData) {
    checklistEl.innerHTML = "Select a country to see the quick checklist.";
    checklistEl.classList.add("active");
    return;
  }

  if (selectedMode !== "all" && !countryData.modes.includes(selectedMode)) {
    checklistEl.innerHTML = `We have not mapped ${formatModeLabel(
      selectedMode
    )} workflows for ${countryData.name}. Try another mode.`;
    checklistEl.classList.add("active");
    return;
  }

  const items = countryData.quickChecklist || [];
  if (!items.length) {
    checklistEl.innerHTML = "Checklist will be available soon.";
    checklistEl.classList.add("active");
    return;
  }

  const listHtml = items.map((item) => `<li>${item}</li>`).join("");
  checklistEl.innerHTML = `
        <h4>Checklist for ${countryData.name} (${formatModeLabel(
    selectedMode
  )})</h4>
        <ul>${listHtml}</ul>
        <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--color-text-tertiary);">
            Source: Official customs, trade and partner agency portals linked above.
        </p>
    `;
  checklistEl.classList.add("active");
}
