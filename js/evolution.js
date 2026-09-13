"use strict";

(function initializeEvolutionLayer() {
  const config = window.APP_CONFIG;
  const mapApp = window.MapApp;
  if (!mapApp || !window.LayersApp) return;

  const map = mapApp.instance;
  const overlay = L.layerGroup();
  const title = "Évolution du bâti 2015–2025";
  let loaded = false;
  let loading = null;
  let status = "";
  let statusElement = null;

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = () => {
    const container = L.DomUtil.create("div", "evolution-legend");
    L.DomUtil.create("strong", "", container).textContent = title;
    const list = L.DomUtil.create("ul", "legend-list", container);
    Object.values(config.evolutionClasses).forEach(({ label, color }) => {
      const item = L.DomUtil.create("li", "", list);
      const swatch = L.DomUtil.create("span", "legend-swatch", item);
      swatch.style.backgroundColor = color;
      swatch.style.opacity = "0.65";
      swatch.setAttribute("aria-hidden", "true");
      L.DomUtil.create("span", "", item).textContent = label;
    });
    statusElement = L.DomUtil.create("p", "evolution-status", container);
    statusElement.setAttribute("role", "status");
    statusElement.textContent = status;
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    return container;
  };

  function setStatus(message) {
    status = message;
    if (statusElement) statusElement.textContent = message;
  }

  async function loadEvolution() {
    setStatus("Chargement de l’évolution du bâti…");
    try {
      const response = await fetch(config.data.evolution);
      if (!response.ok) {
        throw new Error(`Chargement impossible (${response.status}).`);
      }
      const data = await response.json();
      const paneName = "built-evolution";
      if (!map.getPane(paneName)) {
        map.createPane(paneName).style.zIndex = "415";
      }
      const layer = L.geoJSON(data, {
        coordsToLatLng: window.LayersApp.getCoordsToLatLng(data),
        pane: paneName,
        renderer: L.canvas({ pane: paneName }),
        filter: (feature) => [1, 2, 3].includes(Number(feature.properties?.DN)),
        style: (feature) => ({
          fillColor: config.evolutionClasses[Number(feature.properties.DN)].color,
          fillOpacity: 0.65,
          stroke: false,
          weight: 0,
          opacity: 0
        }),
        onEachFeature: (feature, featureLayer) => {
          const category = config.evolutionClasses[Number(feature.properties.DN)];
          featureLayer.bindPopup(`<strong>${category.label}</strong>`);
        }
      });
      overlay.addLayer(layer);
      loaded = true;
      setStatus("");
    } catch (error) {
      setStatus(`${error.message} Décochez puis recochez la couche pour réessayer.`);
      console.error(error);
    }
  }

  // Chargement au premier affichage, puis réutilisation de la couche en mémoire.
  overlay.on("add", () => {
    legend.addTo(map);
    if (!loaded && !loading) {
      loading = loadEvolution().finally(() => { loading = null; });
    }
  });
  overlay.on("remove", () => {
    legend.remove();
    statusElement = null;
  });
  mapApp.layerControl.addOverlay(overlay, title);
})();
