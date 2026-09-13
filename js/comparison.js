"use strict";

(function initializeComparisonModule() {
  const map = window.MapApp?.instance;
  const yearASelect = document.getElementById("comparison-year-a");
  const yearBSelect = document.getElementById("comparison-year-b");
  const startButton = document.getElementById("comparison-start");
  const exitButton = document.getElementById("comparison-exit");
  const errorElement = document.getElementById("comparison-error");
  const normalYearButtons = [...document.querySelectorAll(".year-button")];
  let surfaceRows = [];
  let active = false;
  let previousYear = null;
  let sliderControl = null;
  let legendControl = null;
  let dividerElement = null;
  let splitValue = 50;

  const format = (value) => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const getRow = (year) => surfaceRows.find((row) => row.annee === Number(year));

  function updateIndicators() {
    const rowA = getRow(yearASelect.value);
    const rowB = getRow(yearBSelect.value);
    document.getElementById("comparison-area-a").textContent = rowA ? format(rowA.surface_km2) : "—";
    document.getElementById("comparison-area-b").textContent = rowB ? format(rowB.surface_km2) : "—";
    if (!rowA || !rowB) return;
    const difference = rowB.surface_km2 - rowA.surface_km2;
    const rate = rowA.surface_km2 === 0 ? null : difference / rowA.surface_km2 * 100;
    document.getElementById("comparison-difference").textContent = `${difference > 0 ? "+" : ""}${format(difference)}`;
    document.getElementById("comparison-rate").textContent = rate === null ? "Non calculable" : `${rate > 0 ? "+" : ""}${format(rate)} %`;
  }

  function applyClip(value) {
    if (!active) return;
    splitValue = value;
    if (dividerElement) dividerElement.style.left = `${value}%`;
    const leftPane = map.getPane(`built-${Number(yearASelect.value)}`);
    const rightPane = map.getPane(`built-${Number(yearBSelect.value)}`);
    const mapRect = map.getContainer().getBoundingClientRect();
    const dividerX = mapRect.left + mapRect.width * value / 100;
    leftPane?.querySelectorAll("svg").forEach((svg) => {
      const rect = svg.getBoundingClientRect();
      svg.style.clipPath = `inset(0 ${Math.max(0, rect.right - dividerX)}px 0 0)`;
    });
    rightPane?.querySelectorAll("svg").forEach((svg) => {
      const rect = svg.getBoundingClientRect();
      svg.style.clipPath = `inset(0 0 0 ${Math.max(0, dividerX - rect.left)}px)`;
    });
  }

  function addMapControls() {
    dividerElement = L.DomUtil.create("div", "temporal-divider", map.getContainer());
    dividerElement.innerHTML = '<span aria-hidden="true">↔</span>';
    const Slider = L.Control.extend({ options: { position: "topleft" }, onAdd() {
      const wrap = L.DomUtil.create("div", "temporal-slider-wrap");
      const input = L.DomUtil.create("input", "temporal-slider", wrap);
      input.type = "range"; input.min = "0"; input.max = "100"; input.value = "50";
      input.setAttribute("aria-label", "Position du comparateur avant/après");
      L.DomEvent.disableClickPropagation(wrap); L.DomEvent.disableScrollPropagation(wrap);
      L.DomEvent.on(input, "input", (event) => applyClip(Number(event.target.value)));
      setTimeout(() => applyClip(50), 0);
      return wrap;
    }});
    const Legend = L.Control.extend({ options: { position: "bottomright" }, onAdd() {
      const node = L.DomUtil.create("div", "comparison-map-legend");
      node.innerHTML = `<div><i class="comparison-left"></i>Gauche : Bâti ${yearASelect.value}</div><div><i class="comparison-right"></i>Droite : Bâti ${yearBSelect.value}</div>`;
      return node;
    }});
    sliderControl = new Slider().addTo(map);
    legendControl = new Legend().addTo(map);
  }

  function removeMapControls() {
    if (sliderControl) map.removeControl(sliderControl);
    if (legendControl) map.removeControl(legendControl);
    dividerElement?.remove();
    dividerElement = null;
    sliderControl = legendControl = null;
  }

  async function activate() {
    const yearA = Number(yearASelect.value);
    const yearB = Number(yearBSelect.value);
    errorElement.textContent = "";
    if (yearA === yearB) { errorElement.textContent = "Choisissez deux années différentes."; return; }
    previousYear = window.LayersApp.getActiveYear();
    startButton.disabled = true;
    try {
      await window.LayersApp.showComparison(yearA, yearB);
      active = true;
      addMapControls();
      updateIndicators();
      yearASelect.disabled = yearBSelect.disabled = true;
      normalYearButtons.forEach((button) => { button.disabled = true; });
      exitButton.disabled = false;
      startButton.textContent = "Comparaison active";
    } catch (error) {
      errorElement.textContent = error.message;
      startButton.disabled = false;
    }
  }

  async function deactivate() {
    if (!active) return;
    removeMapControls();
    window.LayersApp.hideBuiltLayers();
    window.LayersApp.resetLayerPresentation();
    active = false;
    yearASelect.disabled = yearBSelect.disabled = false;
    normalYearButtons.forEach((button) => { button.disabled = false; });
    exitButton.disabled = true;
    startButton.disabled = false;
    startButton.textContent = "Activer la comparaison";
    await window.LayersApp.showYear(previousYear || window.APP_CONFIG.defaultYear);
  }

  yearASelect?.addEventListener("change", updateIndicators);
  yearBSelect?.addEventListener("change", updateIndicators);
  startButton?.addEventListener("click", activate);
  exitButton?.addEventListener("click", deactivate);
  map?.on("moveend zoomend resize", () => applyClip(splitValue));

  window.ComparisonApp = Object.freeze({ setData(rows) { surfaceRows = [...rows]; updateIndicators(); }, isActive: () => active });
})();
