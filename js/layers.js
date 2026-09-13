"use strict";

(function initializeLayersModule() {
  const config = window.APP_CONFIG;
  const mapApp = window.MapApp;
  const layersByYear = new Map();
  let studyAreaLayer = null;
  let activeYear = null;
  let displayRequestId = 0;

  function formatArea(value) {
    return Number(value).toLocaleString("fr-FR", {
      maximumFractionDigits: 2
    });
  }

  function bindFeaturePopup(feature, layer, year) {
    const properties = feature.properties || {};
    const name = properties.nom || properties.name || "Zone bâtie";
    const area = Number(properties.surface_km2 || properties.surface_batie_km2);
    const areaLine = Number.isFinite(area)
      ? `<br>Surface indicative : ${formatArea(area)} km²`
      : "";

    layer.bindPopup(`<strong>${name}</strong><br>Année : ${year}${areaLine}`);
  }

  function normalizeGeoData(data) {
    if (data.type) {
      return data;
    }

    if (data.geometryType === "esriGeometryPolygon" && Array.isArray(data.features)) {
      return {
        type: "FeatureCollection",
        features: data.features
          .filter((feature) => Number(feature.attributes?.gridcode) === 1)
          .map((feature) => ({
            type: "Feature",
            properties: feature.attributes || {},
            geometry: {
              type: "MultiPolygon",
              coordinates: (feature.geometry?.rings || []).map((ring) => [ring])
            }
          }))
      };
    }

    throw new Error("Format géographique non pris en charge.");
  }

  function getCoordsToLatLng(data) {
    const crsName = data.crs?.properties?.name;
    if (!crsName || /(?:EPSG(?::|::|\/0\/)4326|CRS:?84)$/i.test(crsName)) {
      return L.GeoJSON.coordsToLatLng;
    }

    if (!/EPSG(?::|::|\/0\/)32630$/i.test(crsName)) {
      throw new Error(`Projection non prise en charge : ${crsName}.`);
    }
    if (typeof proj4 !== "function") {
      throw new Error("La conversion des coordonnées n'est pas disponible. Vérifiez le chargement de Proj4js puis rechargez la page.");
    }

    // Conversion pour Leaflet uniquement : les données sources restent intactes.
    const projection = proj4("+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs", "EPSG:4326");
    return (coordinates) => {
      const [longitude, latitude] = projection.forward([coordinates[0], coordinates[1]]);
      return L.latLng(latitude, longitude, coordinates[2]);
    };
  }

  async function loadStudyArea(fitBounds = false) {
    if (!mapApp) {
      throw new Error("La carte Leaflet n'est pas disponible.");
    }

    if (!studyAreaLayer) {
      let response;

      try {
        response = await fetch(config.data.studyArea);
      } catch (error) {
        throw new Error(
          "Impossible de charger la délimitation. Ouvrez le projet avec Live Server, pas directement avec index.html."
        );
      }

      if (!response.ok) {
        throw new Error(`Chargement de la zone d'étude impossible (${response.status}).`);
      }

      studyAreaLayer = L.geoJSON(await response.json(), {
        style: config.studyAreaStyle,
        onEachFeature: (feature, featureLayer) => {
          const properties = feature.properties || {};
          const name = properties.nom || properties.name || properties.Text || "Zone d'étude";
          featureLayer.bindPopup(`<strong>${name}</strong>`);
        }
      });

      mapApp.layerControl.addOverlay(studyAreaLayer, "Limite de la zone d'étude");
    }

    if (!mapApp.instance.hasLayer(studyAreaLayer)) {
      studyAreaLayer.addTo(mapApp.instance);
    }

    if (fitBounds && studyAreaLayer.getBounds().isValid()) {
      mapApp.instance.fitBounds(studyAreaLayer.getBounds(), {
        padding: [24, 24],
        maxZoom: 14
      });
    }

    return studyAreaLayer;
  }

  async function loadLayer(year) {
    const numericYear = Number(year);

    if (layersByYear.has(numericYear)) {
      return layersByYear.get(numericYear);
    }

    const url = config.data.builtLayers[numericYear];
    if (!url) {
      throw new Error(`Aucune couche configurée pour ${numericYear}.`);
    }

    let response;

    try {
      response = await fetch(url);
    } catch (error) {
      throw new Error(
        "Impossible de charger les GeoJSON. Lancez le projet avec un serveur HTTP local."
      );
    }

    if (!response.ok) {
      throw new Error(`Chargement impossible pour ${numericYear} (${response.status}).`);
    }

    const paneName = `built-${numericYear}`;
    if (!mapApp.instance.getPane(paneName)) {
      const pane = mapApp.instance.createPane(paneName);
      pane.style.zIndex = "410";
    }

    const geojson = normalizeGeoData(await response.json());
    const layer = L.geoJSON(geojson, {
      coordsToLatLng: getCoordsToLatLng(geojson),
      style: config.builtLayerStyle,
      pane: paneName,
      renderer: L.svg({ pane: paneName }),
      filter: (feature) => Number(feature.properties?.DN) === 1,
      onEachFeature: (feature, featureLayer) => {
        bindFeaturePopup(feature, featureLayer, numericYear);
      }
    });

    layersByYear.set(numericYear, layer);
    return layer;
  }

  async function showYear(year, fitBounds = false) {
    if (!mapApp) {
      throw new Error("La carte Leaflet n'est pas disponible.");
    }

    const numericYear = Number(year);
    const requestId = ++displayRequestId;
    mapApp.setStatus(`Chargement du bâti ${numericYear}…`);

    const nextLayer = await loadLayer(numericYear);

    if (requestId !== displayRequestId) {
      return nextLayer;
    }

    if (!mapApp.instance.hasLayer(nextLayer)) {
      nextLayer.addTo(mapApp.instance);
    }

    layersByYear.forEach((layer, layerYear) => {
      if (layerYear !== numericYear && mapApp.instance.hasLayer(layer)) {
        mapApp.instance.removeLayer(layer);
      }
    });

    activeYear = numericYear;

    if (fitBounds && nextLayer.getBounds().isValid()) {
      mapApp.instance.fitBounds(nextLayer.getBounds(), {
        padding: [24, 24],
        maxZoom: 14
      });
    }

    mapApp.setStatus("");
    return nextLayer;
  }

  function hideBuiltLayers() {
    displayRequestId += 1;
    layersByYear.forEach((layer) => {
      if (mapApp.instance.hasLayer(layer)) mapApp.instance.removeLayer(layer);
    });
  }

  function resetLayerPresentation() {
    layersByYear.forEach((layer, year) => {
      layer.setStyle(config.builtLayerStyle);
      const pane = mapApp.instance.getPane(`built-${year}`);
      if (pane) {
        pane.querySelectorAll("svg").forEach((svg) => { svg.style.clipPath = "none"; });
        pane.style.zIndex = "410";
      }
    });
  }

  async function showComparison(yearA, yearB) {
    const numericA = Number(yearA);
    const numericB = Number(yearB);
    const requestId = ++displayRequestId;
    mapApp.setStatus(`Chargement de la comparaison ${numericA} / ${numericB}…`);
    const [leftLayer, rightLayer] = await Promise.all([loadLayer(numericA), loadLayer(numericB)]);
    if (requestId !== displayRequestId) return null;
    hideBuiltLayers();
    leftLayer.setStyle(config.comparisonStyles.left);
    rightLayer.setStyle(config.comparisonStyles.right);
    leftLayer.addTo(mapApp.instance);
    rightLayer.addTo(mapApp.instance);
    mapApp.instance.getPane(`built-${numericA}`).style.zIndex = "411";
    mapApp.instance.getPane(`built-${numericB}`).style.zIndex = "412";
    mapApp.setStatus("");
    return { leftLayer, rightLayer };
  }

  window.LayersApp = Object.freeze({
    getCoordsToLatLng,
    loadStudyArea,
    loadLayer,
    showYear,
    showComparison,
    hideBuiltLayers,
    resetLayerPresentation,
    getStudyAreaLayer: () => studyAreaLayer,
    getActiveYear: () => activeYear
  });
})();
