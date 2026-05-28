const issuers = [
  {
    id: "surcos",
    name: "SURCOS SA",
    sector: "Industria quimica agropecuaria",
    source: "Datos reales tomados de vuelco-balance-SURCOS- Ago23.xlsx. Montos normalizados en ARS millones. Fabricacion de insecticidas, plaguicidas y productos quimicos de uso agropecuario.",
    dataQuality: "EEFF reales",
    market: { mavRate: 34, issuerSpread: 10, volatility: 12 },
    financials: [
      { year: 2022, revenue: 53370, ebitda: 9151, debt: 21966, cash: 1909, equity: 3441, interest: 10555, currentAssets: 43599, currentLiabilities: 34413 },
      { year: 2023, revenue: 44961, ebitda: 8235, debt: 35246, cash: 3053, equity: 6249, interest: 6795, currentAssets: 36818, currentLiabilities: 37503 },
    ],
  },
  {
    id: "pluspetrol",
    name: "PLUSPETROL SA",
    sector: "Energia / Petroleo y gas",
    source: "Datos reales tomados de vuelco-balance-PLUSPETROL- Dic24.xlsx. Montos normalizados en ARS millones. Extraccion de petroleo crudo.",
    dataQuality: "EEFF reales",
    market: { mavRate: 29, issuerSpread: 7, volatility: 10 },
    financials: [
      { year: 2023, revenue: 174050, ebitda: 21384, debt: 365362, cash: 4807, equity: 501072, interest: 71848, currentAssets: 185296, currentLiabilities: 337401 },
      { year: 2024, revenue: 764664, ebitda: 208713, debt: 1482344, cash: 65164, equity: 2011090, interest: 82859, currentAssets: 414891, currentLiabilities: 721183 },
    ],
  },
  {
    id: "san-miguel",
    name: "SAN MIGUEL AGICIF SA",
    sector: "Industria alimenticia",
    source: "Datos reales tomados de vuelco-balance-SAN MIGUEL - Dic25.xlsx. Montos normalizados en ARS millones. Elaboracion de jugos naturales y concentrados de frutas, hortalizas y legumbres.",
    dataQuality: "EEFF reales",
    market: { mavRate: 33, issuerSpread: 9, volatility: 11 },
    financials: [
      { year: 2024, revenue: 103614, ebitda: 9468, debt: 291166, cash: 62357, equity: 69353, interest: 26879, currentAssets: 177123, currentLiabilities: 165064 },
      { year: 2025, revenue: 172520, ebitda: 15157, debt: 394689, cash: 80012, equity: 107396, interest: 39547, currentAssets: 245894, currentLiabilities: 359313 },
    ],
  },
];

const weights = {
  solvencia: 0.4,
  liquidez: 0.33,
  rentabilidad: 0.27,
};

const state = {
  issuer: issuers[0],
  incomeGrowth: 0,
  debtGrowth: 0,
  marketRisk: 0,
  incomeVolatility: 0,
  debtVolatility: 0,
  marketVolatility: 0,
  analystBias: 0,
};

const els = {
  issuerSelect: document.querySelector("#issuerSelect"),
  companyTitle: document.querySelector("#companyTitle"),
  sourceNotes: document.querySelector("#sourceNotes"),
  dataQuality: document.querySelector("#dataQuality"),
  financialTable: document.querySelector("#financialTable"),
  ratiosTable: document.querySelector("#ratiosTable"),
  currentScore: document.querySelector("#currentScore"),
  currentScoreLabel: document.querySelector("#currentScoreLabel"),
  projectedScore: document.querySelector("#projectedScore"),
  projectedScoreLabel: document.querySelector("#projectedScoreLabel"),
  expectedDrift: document.querySelector("#expectedDrift"),
  feasibilityScore: document.querySelector("#feasibilityScore"),
  feasibilityLabel: document.querySelector("#feasibilityLabel"),
  breachProbability: document.querySelector("#breachProbability"),
  confidenceRange: document.querySelector("#confidenceRange"),
  riskStatus: document.querySelector("#riskStatus"),
  riskBadge: document.querySelector("#riskBadge"),
  riskTitle: document.querySelector("#riskTitle"),
  riskText: document.querySelector("#riskText"),
  prescriptionList: document.querySelector("#prescriptionList"),
  validationText: document.querySelector("#validationText"),
  biasText: document.querySelector("#biasText"),
  confidenceFill: document.querySelector("#confidenceFill"),
  incomeGrowth: document.querySelector("#incomeGrowth"),
  debtGrowth: document.querySelector("#debtGrowth"),
  marketRisk: document.querySelector("#marketRisk"),
  incomeVolatility: document.querySelector("#incomeVolatility"),
  debtVolatility: document.querySelector("#debtVolatility"),
  marketVolatility: document.querySelector("#marketVolatility"),
  analystBias: document.querySelector("#analystBias"),
  incomeGrowthValue: document.querySelector("#incomeGrowthValue"),
  debtGrowthValue: document.querySelector("#debtGrowthValue"),
  marketRiskValue: document.querySelector("#marketRiskValue"),
  incomeVolatilityValue: document.querySelector("#incomeVolatilityValue"),
  debtVolatilityValue: document.querySelector("#debtVolatilityValue"),
  marketVolatilityValue: document.querySelector("#marketVolatilityValue"),
  analystBiasValue: document.querySelector("#analystBiasValue"),
  engineTable: document.querySelector("#engineTable"),
  timeline: document.querySelector("#timeline"),
  resetBtn: document.querySelector("#resetBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  chart: document.querySelector("#projectionChart"),
  gaussChart: document.querySelector("#gaussChart"),
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pct(value) {
  return `${Math.round(value)}%`;
}

function money(value) {
  return value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function yoy(values) {
  const growth = [];
  for (let index = 1; index < values.length; index += 1) {
    growth.push(((values[index] / values[index - 1]) - 1) * 100);
  }
  return growth;
}

function scoreLabel(score) {
  if (score >= 68) return "Flujo seguro";
  if (score >= 55) return "Observacion";
  return "Riesgo elevado";
}

function latestFinancial() {
  return state.issuer.financials.at(-1);
}

function calculateFinancialRatios(financial = latestFinancial()) {
  const netDebt = Math.max(0, financial.debt - financial.cash);
  const ebitdaMargin = (financial.ebitda / financial.revenue) * 100;
  const leverage = netDebt / Math.max(financial.ebitda, 1);
  const interestCoverage = financial.ebitda / Math.max(financial.interest, 1);
  const currentRatio = financial.currentAssets / Math.max(financial.currentLiabilities, 1);
  const debtEquity = financial.debt / Math.max(financial.equity, 1);

  return { netDebt, ebitdaMargin, leverage, interestCoverage, currentRatio, debtEquity };
}

function scoreFromFinancials(financial, revenueGrowth, marketRisk) {
  const ratios = calculateFinancialRatios(financial);
  const rentabilidadScore = clamp(42 + revenueGrowth * 1.25 + ratios.ebitdaMargin * 1.15, 5, 98);
  const deudaScore = clamp(
    92 - ratios.leverage * 12 + ratios.interestCoverage * 2.7 + ratios.currentRatio * 5 - ratios.debtEquity * 12,
    5,
    98
  );
  const mercadoScore = clamp(100 - marketRisk * 1.35 - state.issuer.market.issuerSpread * 1.2 - state.issuer.market.volatility * 0.9, 5, 98);
  const scoreBase = rentabilidadScore * 0.4 + deudaScore * 0.4 + mercadoScore * 0.2;
  const psiBruto = calculateRawPsi(financial, revenueGrowth, marketRisk);

  // El Score Matchfin conserva escala decisional 0-100 para andariveles 55/68.
  // Psi queda como penalizador estructural, no como sustituto bruto del score.
  return Math.round(clamp(scoreBase * 0.45 + calibratePsiScore(psiBruto) * 0.55, 5, 98));
}

function calculateRawPsi(financial = latestFinancial(), revenueGrowth = state.incomeGrowth, marketRisk = state.marketRisk) {
  const ratios = calculateFinancialRatios(financial);
  const solvenciaScore = clamp(92 - ratios.leverage * 14 - ratios.debtEquity * 1.8, 5, 98);
  const liquidezScore = clamp(50 + ratios.interestCoverage * 6.5 + (ratios.currentRatio - 1) * 18, 5, 98);
  const rentabilidadScore = clamp(42 + revenueGrowth * 1.25 + ratios.ebitdaMargin * 1.15, 5, 98);
  const delta = getMarketDelta(marketRisk);
  const psi =
    Math.pow(solvenciaScore / 100, weights.solvencia) *
    Math.pow(liquidezScore / 100, weights.liquidez) *
    Math.pow(rentabilidadScore / 100, weights.rentabilidad) *
    delta *
    100;

  return psi;
}

function calibratePsiScore(rawPsi) {
  return Math.round(clamp(32 + rawPsi * 0.72, 5, 98));
}

function getMarketDelta(marketRisk = state.marketRisk) {
  return clamp(
    1 - (marketRisk * 0.007 + state.issuer.market.issuerSpread * 0.005 + state.issuer.market.volatility * 0.003),
    0.55,
    1
  );
}

function getPsiComposition(financial = latestFinancial(), revenueGrowth = state.incomeGrowth) {
  const ratios = calculateFinancialRatios(financial);
  const solvencia = clamp(92 - ratios.leverage * 14 - ratios.debtEquity * 1.8, 5, 98);
  const liquidez = clamp(50 + ratios.interestCoverage * 6.5 + (ratios.currentRatio - 1) * 18, 5, 98);
  const rentabilidad = clamp(42 + revenueGrowth * 1.25 + ratios.ebitdaMargin * 1.15, 5, 98);
  const total = solvencia + liquidez + rentabilidad;

  return {
    solvencia,
    liquidez,
    rentabilidad,
    lS: solvencia / total,
    lL: liquidez / total,
    lR: rentabilidad / total,
    label: compositionLabel(solvencia / total, liquidez / total, rentabilidad / total),
  };
}

function compositionLabel(lS, lL, lR) {
  const names = ["Solvencia", "Liquidez", "Rentabilidad"];
  const vals = [lS, lL, lR];
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const dominant = names[vals.indexOf(max)];
  const absent = names[vals.indexOf(min)];

  if (max > 0.55) return `${dominant} dominante`;
  if (min < 0.15) return `Borde ${names.filter((name) => name !== absent).join("-")}`;
  if (max < 0.4) return "Equilibrio estructural";
  return `Tendencia ${dominant}`;
}

function calculateHistoryScores() {
  return state.issuer.financials.map((financial, index, list) => {
    const growth = index === 0 ? 0 : ((financial.revenue / list[index - 1].revenue) - 1) * 100;
    return scoreFromFinancials(financial, growth, state.issuer.market.mavRate);
  });
}

function deriveInputsFromFinancials() {
  const financials = state.issuer.financials;
  const revenues = financials.map((item) => item.revenue);
  const debts = financials.map((item) => item.debt);
  const margins = financials.map((item) => (item.ebitda / item.revenue) * 100);
  const revenueGrowths = yoy(revenues);
  const debtGrowths = yoy(debts);
  const leverageHistory = financials.map((item) => calculateFinancialRatios(item).leverage);

  const incomeGrowth = average(revenueGrowths);
  const debtGrowth = average(debtGrowths);
  const marginVolatility = Math.max(...margins) - Math.min(...margins);
  const leverageVolatility = Math.max(...leverageHistory) - Math.min(...leverageHistory);
  const lastGrowthGap = revenueGrowths.at(-1) - average(revenueGrowths);

  return {
    incomeGrowth: Math.round(clamp(incomeGrowth, -20, 35)),
    debtGrowth: Math.round(clamp(debtGrowth, -25, 35)),
    marketRisk: Math.round(clamp(state.issuer.market.mavRate + state.issuer.market.issuerSpread * 0.4, 5, 45)),
    incomeVolatility: Math.round(clamp(2 + marginVolatility + Math.abs(lastGrowthGap) * 0.25, 1, 12)),
    debtVolatility: Math.round(clamp(2 + leverageVolatility * 2 + Math.abs(debtGrowth) * 0.18, 1, 14)),
    marketVolatility: Math.round(clamp(state.issuer.market.volatility, 1, 16)),
    analystBias: Math.round(clamp(lastGrowthGap * 0.22 - Math.max(0, debtGrowth - incomeGrowth) * 0.12, -10, 10)),
  };
}

function getHistoricDeleveraging() {
  const debtGrowths = yoy(state.issuer.financials.map((item) => item.debt));
  const reductions = debtGrowths.filter((value) => value < 0).map((value) => Math.abs(value));
  return reductions.length ? Math.round(Math.max(...reductions)) : 4;
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function normalSample(mean, deviation, seed) {
  const u1 = Math.max(seededRandom(seed), 0.0001);
  const u2 = Math.max(seededRandom(seed + 1.37), 0.0001);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * deviation;
}

function percentile(values, percent) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((sorted.length - 1) * percent);
  return sorted[index];
}

function calculateScenario(incomeGrowth, debtGrowth, marketRisk) {
  const latest = latestFinancial();
  const latestRatios = calculateFinancialRatios(latest);
  const marginShift = state.analystBias * 0.12 - Math.max(0, marketRisk - state.issuer.market.mavRate) * 0.03;
  const result = [calculateHistoryScores().at(-1)];

  for (let year = 1; year <= 3; year += 1) {
    const revenue = latest.revenue * (1 + incomeGrowth / 100) ** year;
    const debt = latest.debt * (1 + debtGrowth / 100) ** year;
    const cash = latest.cash * (1 + Math.max(-5, incomeGrowth * 0.45) / 100) ** year;
    const ebitdaMargin = clamp(latestRatios.ebitdaMargin + marginShift - year * 0.2, 4, 35);
    const ebitda = revenue * (ebitdaMargin / 100);
    const interest = debt * clamp((marketRisk + state.issuer.market.issuerSpread) / 100, 0.06, 0.55);
    const equity = latest.equity * (1 + Math.max(-4, incomeGrowth * 0.35) / 100) ** year;
    const currentAssets = latest.currentAssets * (1 + incomeGrowth / 140) ** year;
    const currentLiabilities = latest.currentLiabilities * (1 + Math.max(0, debtGrowth) / 115) ** year;
    const financial = { revenue, ebitda, debt, cash, equity, interest, currentAssets, currentLiabilities };

    result.push(scoreFromFinancials(financial, incomeGrowth, marketRisk));
  }

  return result;
}

function calculateProbabilisticModel() {
  const runs = 5000;
  const yearly = [[], [], [], []];
  const finalScores = [];
  let breaches = 0;

  for (let run = 0; run < runs; run += 1) {
    const seed = run * 9.91 + state.issuer.id.length * 17;
    const income = normalSample(state.incomeGrowth, state.incomeVolatility, seed);
    const debt = normalSample(state.debtGrowth, state.debtVolatility, seed + 11);
    const market = normalSample(state.marketRisk, state.marketVolatility, seed + 23);
    const scenario = calculateScenario(income, debt, market);

    scenario.forEach((score, index) => yearly[index].push(score));
    const finalScore = scenario.at(-1);
    finalScores.push(finalScore);
    if (finalScore < 68) breaches += 1;
  }

  const expected = yearly.map((scores) => Math.round(average(scores)));
  const p10 = yearly.map((scores) => Math.round(percentile(scores, 0.1)));
  const p90 = yearly.map((scores) => Math.round(percentile(scores, 0.9)));

  return {
    expected,
    p10,
    p90,
    finalScores,
    breachProbability: Math.round((breaches / runs) * 100),
    finalMean: expected.at(-1),
    finalP10: p10.at(-1),
    finalP90: p90.at(-1),
  };
}

function getDiagnosis(values, model) {
  const finalScore = values.at(-1);
  const minimum = Math.min(...values);
  if (minimum < 55 || model.breachProbability >= 55) {
    return {
      tone: "danger",
      badge: "Alerta temprana",
      title: "El caso piloto tensiona el andarivel",
      text: "La combinacion de deuda, cobertura de intereses y mercado genera una probabilidad alta de ruptura del flujo seguro.",
    };
  }
  if (finalScore < 68 || model.breachProbability >= 25) {
    return {
      tone: "watch",
      badge: "En observacion",
      title: "La solvencia depende de ejecucion operativa",
      text: "El score medio es defendible, pero la dispersion exige seguimiento de margen, deuda neta y costo financiero.",
    };
  }
  return {
    tone: "safe",
    badge: "Apto",
    title: "El piloto permanece dentro de flujo seguro",
    text: "Los EEFF normalizados sostienen cobertura y liquidez suficientes bajo la simulacion probabilistica.",
  };
}

function getPrescriptions(values, model) {
  const finalScore = values.at(-1);
  const gap = Math.max(0, 68 - finalScore);
  const ratios = calculateFinancialRatios();

  if (gap === 0 && model.breachProbability < 25) {
    return [
      ["Mantener cupo sujeto a covenants", `Net debt / EBITDA en ${ratios.leverage.toFixed(1)}x y cobertura en ${ratios.interestCoverage.toFixed(1)}x.`],
      ["Monitorear tasa MAV", `Activar alerta si el riesgo de mercado supera ${state.marketRisk + 4} puntos.`],
    ];
  }

  const debtReduction = Math.ceil(Math.max(gap * 1.45, Math.max(0, ratios.leverage - 2.2) * 9));
  const marginLift = Math.ceil(Math.max(2, gap * 0.45));
  const coverageTarget = Math.max(2.2, ratios.interestCoverage + 0.4).toFixed(1);

  return [
    [`Reducir deuda neta en ${debtReduction}%`, "Prioridad alta por impacto directo en leverage y cobertura de intereses."],
    [`Recuperar margen EBITDA en ${marginLift} pts`, "Mejora el componente de ingresos y reduce probabilidad de ruptura."],
    [`Exigir cobertura minima ${coverageTarget}x`, "Usar como covenant para validar factibilidad de nuevas lineas."],
  ];
}

function getFeasibility(values) {
  const finalScore = values.at(-1);
  const gap = Math.max(0, 68 - finalScore);
  const ratios = calculateFinancialRatios();
  const historicalCapacity = getHistoricDeleveraging();
  const leveragePenalty = Math.max(0, ratios.leverage - 2.5) * 11;
  const feasible = gap === 0
    ? clamp(94 - leveragePenalty, 55, 95)
    : clamp(90 - gap * 2.4 - leveragePenalty + historicalCapacity * 0.6, 18, 86);

  return Math.round(feasible);
}

function drawChart(model) {
  const values = model.expected;
  const canvas = els.chart;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pad = { left: 56, right: 24, top: 26, bottom: 54 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const xFor = (index) => pad.left + (chartW / 3) * index;
  const yFor = (score) => pad.top + (100 - clamp(score, 0, 100)) * (chartH / 100);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#dff3ea";
  ctx.fillRect(pad.left, yFor(100), chartW, yFor(68) - yFor(100));
  ctx.fillStyle = "#fbecd1";
  ctx.fillRect(pad.left, yFor(68), chartW, yFor(55) - yFor(68));
  ctx.fillStyle = "#f7dede";
  ctx.fillRect(pad.left, yFor(55), chartW, yFor(0) - yFor(55));

  ctx.fillStyle = "rgba(47, 107, 159, 0.15)";
  ctx.beginPath();
  model.p90.forEach((score, index) => {
    if (index === 0) ctx.moveTo(xFor(index), yFor(score));
    else ctx.lineTo(xFor(index), yFor(score));
  });
  [...model.p10].reverse().forEach((score, reverseIndex) => {
    const index = model.p10.length - 1 - reverseIndex;
    ctx.lineTo(xFor(index), yFor(score));
  });
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#d5dfdb";
  ctx.lineWidth = 1;
  [0, 30, 45, 55, 68, 85, 100].forEach((score) => {
    const y = yFor(score);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = "#66716f";
    ctx.font = "13px Inter, system-ui, sans-serif";
    ctx.fillText(score, 18, y + 4);
  });

  ctx.strokeStyle = "#2f6b9f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  values.forEach((score, index) => {
    if (index === 0) ctx.moveTo(xFor(index), yFor(score));
    else ctx.lineTo(xFor(index), yFor(score));
  });
  ctx.stroke();

  values.forEach((score, index) => {
    const x = xFor(index);
    const y = yFor(score);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2f6b9f";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#13211f";
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.fillText(score, x - 9, y - 16);
  });

  ["Actual", "Ano 1", "Ano 2", "Ano 3"].forEach((label, index) => {
    ctx.fillStyle = "#66716f";
    ctx.font = "13px Inter, system-ui, sans-serif";
    ctx.fillText(label, xFor(index) - 18, height - 24);
  });
}

function drawGaussChart(model) {
  const canvas = els.gaussChart;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pad = { left: 38, right: 30, top: 22, bottom: 40 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const mean = model.finalMean;
  const variance = model.finalScores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / model.finalScores.length;
  const deviation = Math.max(3, Math.sqrt(variance));
  const min = Math.max(0, Math.floor(mean - deviation * 3));
  const max = Math.min(100, Math.ceil(mean + deviation * 3));
  const yBase = height - pad.bottom;
  const xFor = (score) => pad.left + ((score - min) / (max - min)) * chartW;
  const yFor = (value) => yBase - value * chartH * 0.92;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(179, 58, 58, 0.12)";
  ctx.fillRect(pad.left, pad.top, Math.max(0, xFor(68) - pad.left), chartH);

  ctx.strokeStyle = "#2f6b9f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let step = 0; step <= 120; step += 1) {
    const score = min + ((max - min) / 120) * step;
    const exponent = -0.5 * ((score - mean) / deviation) ** 2;
    const y = yFor(Math.exp(exponent));
    if (step === 0) ctx.moveTo(xFor(score), y);
    else ctx.lineTo(xFor(score), y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#b33a3a";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(xFor(68), pad.top);
  ctx.lineTo(xFor(68), yBase);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#13211f";
  ctx.font = "700 14px Inter, system-ui, sans-serif";
  ctx.fillText(`Esperado ${mean}`, xFor(mean) - 38, pad.top + 18);
  ctx.fillStyle = "#66716f";
  ctx.font = "13px Inter, system-ui, sans-serif";
  ctx.fillText(`P10 ${model.finalP10}`, pad.left, height - 14);
  ctx.fillText(`P90 ${model.finalP90}`, width - pad.right - 56, height - 14);
  ctx.fillText("Piso seguro 68", xFor(68) - 42, yBase - 8);
}

function renderFinancials() {
  const ratios = calculateFinancialRatios();
  const latest = latestFinancial();

  els.companyTitle.textContent = `${state.issuer.name} · ${state.issuer.sector}`;
  els.sourceNotes.textContent = state.issuer.source;
  els.dataQuality.textContent = state.issuer.dataQuality;
  els.financialTable.innerHTML = state.issuer.financials
    .map((item) => `
      <tr>
        <td>${item.year}</td>
        <td>${money(item.revenue)}</td>
        <td>${money(item.ebitda)}</td>
        <td>${money(item.debt)}</td>
        <td>${money(item.cash)}</td>
      </tr>
    `)
    .join("");

  const ratioRows = [
    ["Margen EBITDA", pct(ratios.ebitdaMargin), ratios.ebitdaMargin >= 20 ? "Rentabilidad defensiva" : "Margen bajo presion"],
    ["Deuda neta / EBITDA", `${ratios.leverage.toFixed(1)}x`, ratios.leverage <= 2.2 ? "Apalancamiento sano" : "Requiere control"],
    ["Cobertura intereses", `${ratios.interestCoverage.toFixed(1)}x`, ratios.interestCoverage >= 3 ? "Cobertura suficiente" : "Sensibilidad financiera"],
    ["Liquidez corriente", `${ratios.currentRatio.toFixed(1)}x`, ratios.currentRatio >= 1.2 ? "Liquidez operativa" : "Tension de corto plazo"],
    ["Costo financiero", pct((latest.interest / latest.debt) * 100), "Base para stress MAV"],
  ];

  els.ratiosTable.innerHTML = ratioRows
    .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
    .join("");
}

function renderEngineTable(values) {
  const comp = getPsiComposition();
  const readings = [
    ["Solvencia", "40%", `Score ${Math.round(comp.solvencia)} · leverage + estructura patrimonial`],
    ["Liquidez", "33%", `Score ${Math.round(comp.liquidez)} · cobertura + ratio corriente`],
    ["Rentabilidad", "27%", `Score ${Math.round(comp.rentabilidad)} · crecimiento + margen EBITDA`],
    ["delta Mercado", "modificador", `MAV ${state.marketRisk} · spread ${state.issuer.market.issuerSpread} · vol ${state.issuer.market.volatility}`],
  ];

  els.engineTable.innerHTML = readings
    .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
    .join("");

  els.timeline.innerHTML = values
    .map((score, index) => {
      const label = index === 0 ? "Actual" : `Ano ${index}`;
      return `<div class="timeline-item"><strong>${label}</strong><span>${score} puntos · ${scoreLabel(score)}</span></div>`;
    })
    .join("");
}

function drawTernplot(comp) {
  const canvas = document.querySelector("#ternplotCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const ax = width / 2;
  const ay = 24;
  const bx = 36;
  const by = height - 28;
  const cx = width - 36;
  const cy = height - 28;
  const guideA = (value) => ({ x: ax + (bx - ax) * value, y: ay + (by - ay) * value });
  const guideC = (value) => ({ x: ax + (cx - ax) * value, y: ay + (cy - ay) * value });
  const guideBC = (value) => ({ x: bx + (cx - bx) * value, y: by });
  const px = comp.lS * ax + comp.lL * bx + comp.lR * cx;
  const py = comp.lS * ay + comp.lL * by + comp.lR * cy;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f3f6f4";
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#d9e0dd";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 4]);
  [
    [guideA(1 / 3), guideC(1 / 3)],
    [guideA(2 / 3), guideC(2 / 3)],
    [guideA(1 / 3), guideBC(2 / 3)],
    [guideA(2 / 3), guideBC(1 / 3)],
    [guideC(1 / 3), guideBC(1 / 3)],
    [guideC(2 / 3), guideBC(2 / 3)],
  ].forEach(([p1, p2]) => {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  ctx.strokeStyle = "#aebbb7";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.stroke();

  const ternHeight = by - ay;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.7;
  ctx.setLineDash([5, 3]);
  ctx.strokeStyle = "#1f8a5b";
  ctx.beginPath();
  ctx.moveTo(bx + (ax - bx) * comp.lS, by - ternHeight * comp.lS);
  ctx.lineTo(cx - (cx - ax) * comp.lS, by - ternHeight * comp.lS);
  ctx.stroke();
  ctx.strokeStyle = "#534ab7";
  ctx.beginPath();
  ctx.moveTo(ax + (bx - ax) * comp.lL, ay + ternHeight * comp.lL);
  ctx.lineTo(cx + (bx - cx) * comp.lL, cy);
  ctx.stroke();
  ctx.strokeStyle = "#d85a30";
  ctx.beginPath();
  ctx.moveTo(ax + (cx - ax) * comp.lR, ay + ternHeight * comp.lR);
  ctx.lineTo(bx + (cx - bx) * comp.lR, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(px, py, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#13211f";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#13211f";
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#13211f";
  ctx.font = "700 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Solvencia", ax, ay - 8);
  ctx.fillText("Liquidez", bx, by + 16);
  ctx.fillText("Rentabilidad", cx, cy + 16);
  ctx.textAlign = "left";
}

function renderPsiPanel() {
  const comp = getPsiComposition();
  const delta = getMarketDelta();
  const psi = Math.round(clamp(calculateRawPsi(), 5, 98));
  const scoreMatchfin = scoreFromFinancials(
    latestFinancial(),
    state.incomeGrowth,
    state.marketRisk
  );
  const query = (id) => document.querySelector(`#${id}`);
  const setText = (id, value) => {
    const element = query(id);
    if (element) element.textContent = value;
  };
  const setWidth = (id, value) => {
    const element = query(id);
    if (element) element.style.width = `${value}%`;
  };

  setText("psiLabel", comp.label);
  setText("psiScore", `Firma Psi ${psi} · Score ${scoreMatchfin}`);
  setText("valSolvencia", Math.round(comp.solvencia));
  setText("valLiquidez", Math.round(comp.liquidez));
  setText("valRentabilidad", Math.round(comp.rentabilidad));
  setText("valDelta", `x${delta.toFixed(2)}`);
  setWidth("barSolvencia", comp.solvencia);
  setWidth("barLiquidez", comp.liquidez);
  setWidth("barRentabilidad", comp.rentabilidad);
  setWidth("barDelta", delta * 100);

  drawTernplot(comp);
}

function render() {
  const model = calculateProbabilisticModel();
  const values = model.expected;
  const current = values[0];
  const projected = values.at(-1);
  const drift = projected - current;
  const diagnosis = getDiagnosis(values, model);
  const feasibility = getFeasibility(values);

  els.currentScore.textContent = current;
  els.currentScoreLabel.textContent = scoreLabel(current);
  els.projectedScore.textContent = projected;
  els.projectedScoreLabel.textContent = scoreLabel(projected);
  els.expectedDrift.textContent = `${drift > 0 ? "+" : ""}${drift}`;
  els.feasibilityScore.textContent = `${feasibility}%`;
  els.feasibilityLabel.textContent = feasibility >= 70 ? "Correccion realista" : "Requiere validacion";
  els.breachProbability.textContent = `${model.breachProbability}%`;
  els.confidenceRange.textContent = `${model.finalP10}-${model.finalP90}`;

  els.riskStatus.className = `risk-status ${diagnosis.tone === "safe" ? "" : diagnosis.tone}`;
  els.riskBadge.textContent = diagnosis.badge;
  els.riskTitle.textContent = diagnosis.title;
  els.riskText.textContent = diagnosis.text;

  els.prescriptionList.innerHTML = getPrescriptions(values, model)
    .map(([title, detail]) => `<div class="prescription-item"><strong>${title}</strong><span>${detail}</span></div>`)
    .join("");

  els.validationText.textContent =
    feasibility >= 70
      ? "El historial normalizado muestra capacidad suficiente para ejecutar las correcciones sugeridas."
      : "La correccion requerida supera la capacidad historica observada; conviene reducir cupo o pedir garantias.";
  els.confidenceFill.style.width = `${feasibility}%`;
  els.biasText.textContent =
    state.analystBias > 0
      ? "Sesgo optimista derivado de mejora reciente: la expectativa sube, pero la dispersion valida la confianza."
      : state.analystBias < 0
        ? "Sesgo conservador derivado de deterioro reciente: penaliza la expectativa para evitar sobreestimacion."
        : "Sin sesgo direccional fuerte: la lectura depende de dispersion y ratios actuales.";

  els.incomeGrowthValue.textContent = pct(state.incomeGrowth);
  els.debtGrowthValue.textContent = pct(state.debtGrowth);
  els.marketRiskValue.textContent = `${state.marketRisk}`;
  els.incomeVolatilityValue.textContent = `${state.incomeVolatility}`;
  els.debtVolatilityValue.textContent = `${state.debtVolatility}`;
  els.marketVolatilityValue.textContent = `${state.marketVolatility}`;
  els.analystBiasValue.textContent = `${state.analystBias > 0 ? "+" : ""}${state.analystBias}`;

  drawChart(model);
  drawGaussChart(model);
  renderFinancials();
  renderEngineTable(values);
  renderPsiPanel();
}

function syncStateFromIssuer() {
  Object.assign(state, deriveInputsFromFinancials());
}

function setIssuer(issuerId) {
  state.issuer = issuers.find((issuer) => issuer.id === issuerId) || issuers[0];
  syncStateFromIssuer();
  syncControls();
  render();
}

function syncControls() {
  els.incomeGrowth.value = state.incomeGrowth;
  els.debtGrowth.value = state.debtGrowth;
  els.marketRisk.value = state.marketRisk;
  els.incomeVolatility.value = state.incomeVolatility;
  els.debtVolatility.value = state.debtVolatility;
  els.marketVolatility.value = state.marketVolatility;
  els.analystBias.value = state.analystBias;
}

function init() {
  els.issuerSelect.innerHTML = issuers
    .map((issuer) => `<option value="${issuer.id}">${issuer.name} · ${issuer.sector}</option>`)
    .join("");

  syncStateFromIssuer();
  els.issuerSelect.addEventListener("change", (event) => setIssuer(event.target.value));
  els.incomeGrowth.addEventListener("input", (event) => {
    state.incomeGrowth = Number(event.target.value);
    render();
  });
  els.debtGrowth.addEventListener("input", (event) => {
    state.debtGrowth = Number(event.target.value);
    render();
  });
  els.marketRisk.addEventListener("input", (event) => {
    state.marketRisk = Number(event.target.value);
    render();
  });
  els.incomeVolatility.addEventListener("input", (event) => {
    state.incomeVolatility = Number(event.target.value);
    render();
  });
  els.debtVolatility.addEventListener("input", (event) => {
    state.debtVolatility = Number(event.target.value);
    render();
  });
  els.marketVolatility.addEventListener("input", (event) => {
    state.marketVolatility = Number(event.target.value);
    render();
  });
  els.analystBias.addEventListener("input", (event) => {
    state.analystBias = Number(event.target.value);
    render();
  });
  els.resetBtn.addEventListener("click", () => setIssuer(state.issuer.id));
  els.exportBtn.addEventListener("click", () => window.print());

  syncControls();
  render();
}

init();
