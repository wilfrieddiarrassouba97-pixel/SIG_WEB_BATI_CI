"use strict";

(function initializeMapModule() {
  const config = window.APP_CONFIG;
  const statusElement = document.getElementById("map-status");

  function updateStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  function createBaseMaps() {
    return Object.values(config.baseMaps).reduce((layers, baseMap) => {
      layers[baseMap.label] = L.tileLayer(baseMap.url, baseMap.options);
      return layers;
    }, {});
  }

  function initializeMap() {
    if (!config || typeof L === "undefined") {
      updateStatus(
        "Leaflet n'a pas été chargé. Vérifiez la connexion Internet puis rechargez la page."
      );
      document.getElementById("map")?.classList.add("map-load-error");
      return null;
    }

    const baseMaps = createBaseMaps();
    const defaultBaseMap = baseMaps[config.baseMaps.openStreetMap.label];

    const map = L.map("map", {
      center: config.map.center,
      zoom: config.map.zoom,
      minZoom: config.map.minZoom,
      maxZoom: config.map.maxZoom,
      maxBounds: config.map.maxBounds,
      maxBoundsViscosity: 0.7,
      preferCanvas: true,
      layers: [defaultBaseMap]
    });

    defaultBaseMap.on("tileerror", function () {
      updateStatus(
        "Le fond cartographique ne peut pas être chargé. Vérifiez la connexion Internet."
      );
    });

    defaultBaseMap.on("load", function () {
      if (statusElement?.textContent.includes("fond cartographique")) {
        updateStatus("");
      }
    });

    window.addEventListener("load", function () {
      setTimeout(function () {
        map.invalidateSize();
      }, 300);
    });

    const layerControl = L.control.layers(baseMaps, null, {
      collapsed: false,
      position: "topright"
    }).addTo(map);

    L.control.scale({
      imperial: false,
      position: "bottomleft"
    }).addTo(map);

    const RecenterControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd() {
        const container = L.DomUtil.create("div", "leaflet-bar recenter-control");
        const button = L.DomUtil.create("button", "recenter-button", container);
        button.type = "button";
        button.textContent = "⌖ Recentrer sur Abidjan";
        button.title = "Revenir à l’emprise de la zone d’étude";
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(button, "click", () => {
          const layer = window.LayersApp?.getStudyAreaLayer();
          if (layer?.getBounds().isValid()) map.fitBounds(layer.getBounds(), { padding: [24, 24], maxZoom: 14 });
        });
        return container;
      }
    });
    new RecenterControl().addTo(map);

    return Object.freeze({
      instance: map,
      layerControl,
      baseMaps,
      setStatus: updateStatus
    });
  }

  window.MapApp = initializeMap();
})();
