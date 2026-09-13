"use strict";

(function initializeApplication() {
  const config = window.APP_CONFIG;
  const yearButtons = [...document.querySelectorAll(".year-button")];
  let surfaceRows = [];

  function parseCsv(text) {
    const lines = text
      .trim()
      .split(/\r?\n/)
      .filter((line) => line.trim());

    if (lines.length < 2) {
      return [];
    }

    const delimiter = lines[0].includes(";") ? ";" : ",";
    // Respecter les champs entre guillemets, notamment la colonne .geo.
    function splitLine(line) {
      const cells = [];
      let cell = "";
      let quoted = false;
      for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') {
          if (quoted && line[index + 1] === '"') {
            cell += '"';
            index += 1;
          } else {
            quoted = !quoted;
          }
        } else if (character === delimiter && !quoted) {
          cells.push(cell.trim());
          cell = "";
        } else {
          cell += character;
        }
      }
      if (quoted) throw new Error("Un champ du CSV contient des guillemets non fermés.");
      cells.push(cell.trim());
      return cells;
    }
    const headers = splitLine(lines[0]);
    const requiredFields = ["annee", "surface_batie_km2", "gain_precedent_km2",
      "evolution_precedente_pct", "evolution_depuis_2015_pct", "precision_pct", "kappa"];
    const missingFields = requiredFields.filter((field) => !headers.includes(field));
    if (missingFields.length) {
      throw new Error(`Colonnes absentes du CSV : ${missingFields.join(", ")}.`);
    }

    return lines.slice(1).map((line, index) => {
      const values = splitLine(line);
      if (values.length !== headers.length) {
        throw new Error(`Nombre de colonnes incorrect à la ligne ${index + 2} du CSV.`);
      }
      const row = Object.fromEntries(
        headers.map((header, index) => [header, values[index]])
      );

      const result = {};
      requiredFields.forEach((field) => {
        const value = row[field] === "" ? NaN : Number(row[field].replace(",", "."));
        if (!Number.isFinite(value)) {
          throw new Error(`Valeur invalide pour ${field} à la ligne ${index + 2} du CSV.`);
        }
        result[field] = value;
      });
      return { ...result, surface_km2: result.surface_batie_km2 };
    });
  }

  async function loadSurfaceData() {
    const csvSources = Array.isArray(config.data.surfacesCsv)
      ? config.data.surfacesCsv
      : [config.data.surfacesCsv];
    let responses;

    try {
      responses = await Promise.all(csvSources.map((source) => fetch(source)));
    } catch (error) {
      throw new Error(
        "Impossible de charger les CSV. Lancez le projet avec un serveur HTTP local."
      );
    }

    const failedIndex = responses.findIndex((response) => !response.ok);
    if (failedIndex !== -1) {
      throw new Error(
        `Chargement de ${csvSources[failedIndex]} impossible (${responses[failedIndex].status}).`
      );
    }

    const csvContents = await Promise.all(
      responses.map((response) => response.text())
    );
    const rows = csvContents
      .flatMap(parseCsv)
      .sort((a, b) => a.annee - b.annee);

    if (!rows.length) {
      throw new Error("Les CSV ne contiennent aucune ligne exploitable.");
    }

    const years = rows.map((row) => row.annee);
    if (new Set(years).size !== years.length || config.years.some((year) => !years.includes(year))) {
      throw new Error("Le CSV doit contenir une seule ligne pour chacune des années 2015, 2020 et 2025.");
    }

    return rows;
  }

  function updateStatistics(year) {
    const rowIndex = surfaceRows.findIndex((row) => row.annee === Number(year));
    const row = surfaceRows[rowIndex];
    const previous = surfaceRows[rowIndex - 1];
    const format = (value, digits = 2) => Number(value).toLocaleString("fr-FR", {
      maximumFractionDigits: digits
    });
    const signed = (value) => `${value > 0 ? "+" : ""}${format(value)}`;
    document.getElementById("statistics-year").textContent = year;
    document.getElementById("statistics-period").textContent = previous
      ? `Période précédente : ${previous.annee}–${row.annee}`
      : "Année de référence : 2015";
    const values = {
      "statistics-area": row ? `${format(row.surface_km2)} km²` : "—",
      "statistics-gain": row && previous ? `${signed(row.gain_precedent_km2)} km²` : "—",
      "statistics-change": row && previous ? `${signed(row.evolution_precedente_pct)} %` : "—",
      "statistics-total-change": row ? `${signed(row.evolution_depuis_2015_pct)} %` : "—",
      "statistics-accuracy": row ? `${format(row.precision_pct)} %` : "—",
      "statistics-kappa": row ? format(row.kappa, 4) : "—"
    };
    Object.entries(values).forEach(([id, value]) => {
      document.getElementById(id).textContent = value;
    });
  }

  function setActiveButton(year) {
    yearButtons.forEach((button) => {
      const isActive = Number(button.dataset.year) === Number(year);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  async function selectYear(year, fitBounds = false) {
    setActiveButton(year);
    updateStatistics(year);
    window.ChartApp.highlightYear(year);
    yearButtons.forEach((button) => {
      button.disabled = true;
    });

    try {
      await window.LayersApp.showYear(year, fitBounds);
    } catch (error) {
      window.MapApp?.setStatus(error.message);
      console.error(error);
    } finally {
      yearButtons.forEach((button) => {
        button.disabled = false;
      });
    }
  }

  async function start() {
    if (!config || !window.MapApp) {
      return;
    }

    if (window.location.protocol === "file:") {
      window.MapApp.setStatus(
        "Ce projet doit être ouvert avec Live Server pour charger la délimitation et les couches."
      );
    }

    yearButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectYear(Number(button.dataset.year), true);
      });
    });

    let studyAreaLoaded = false;

    try {
      await window.LayersApp.loadStudyArea(true);
      studyAreaLoaded = true;
    } catch (error) {
      window.MapApp.setStatus(error.message);
      console.error(error);
    }

    try {
      surfaceRows = await loadSurfaceData();
      window.ChartApp.render(surfaceRows);
      window.ComparisonApp.setData(surfaceRows);
    } catch (error) {
      document.getElementById("statistics-error").textContent = error.message;
      window.MapApp.setStatus(error.message);
      console.error(error);
    }

    await selectYear(config.defaultYear, !studyAreaLoaded);
  }

  start();
})();
