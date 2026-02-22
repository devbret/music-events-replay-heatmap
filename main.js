const DATA_URL = "./events_timeline.json";

const OPENING_CENTER = [20, 0];
const OPENING_ZOOM = 3;

const map = L.map("map", {
  zoomControl: true,
  preferCanvas: false,
}).setView(OPENING_CENTER, OPENING_ZOOM);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{z}/{z}.png".replace(
    /{z}\/{z}\/{z}/,
    "{z}/{x}/{y}",
  ),
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  },
).addTo(map);

L.svg().addTo(map);
const overlay = d3.select(map.getPanes().overlayPane).select("svg");
const g = overlay.append("g").attr("class", "leaflet-zoom-hide");

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const speedSelect = document.getElementById("speed");

const monthSlider = document.getElementById("monthSlider");
const monthLabel = document.getElementById("monthLabel");
const countLabel = document.getElementById("countLabel");

const rangeStart = document.getElementById("rangeStart");
const rangeEnd = document.getElementById("rangeEnd");
const eventList = document.getElementById("eventList");
const tooltip = document.getElementById("tooltip");

const heatToggle = document.getElementById("heatToggle");

let timer = null;
let playbackMs = Number(speedSelect.value);

let timeline = [];
let monthIndex = 0;

function classifyEventType(name) {
  const s = String(name || "").toLowerCase();
  if (s.includes("premiere") || s.includes("première")) return "premiere";
  if (s.includes("funeral")) return "funeral";
  if (s.includes("stage performance") || s.includes("performance"))
    return "performance";
  return "other";
}

const typeColors = new Map([
  ["premiere", "#f6c445"],
  ["performance", "#3aa6ff"],
  ["funeral", "#b06cff"],
  ["other", "#d9d9d9"],
]);

function colorForEvent(d) {
  const t = d.type || "other";
  return typeColors.get(t) || "#d9d9d9";
}

function projectPoint(lat, lng) {
  const point = map.latLngToLayerPoint([lat, lng]);
  return [point.x, point.y];
}

function showTooltip(evt, d) {
  tooltip.setAttribute("aria-hidden", "false");
  tooltip.style.opacity = "1";

  const city = d.city ? d.city : "Unknown city";
  const country = d.country ? d.country : "Unknown country";
  const venue = d.venue ? d.venue : "Unknown venue";
  const type = d.type ? d.type : "other";

  tooltip.innerHTML = `
    <div class="tname">${escapeHtml(d.name || "Untitled")}</div>
    <div class="tmeta">
      <div><b>Type:</b> ${escapeHtml(type)}</div>
      <div><b>Date:</b> ${escapeHtml(d.date || "")}</div>
      <div><b>Venue:</b> ${escapeHtml(venue)}</div>
      <div><b>Area:</b> ${escapeHtml(city)}, ${escapeHtml(country)}</div>
      <div><b>Coords:</b> ${Number(d.lat).toFixed(5)}, ${Number(d.lng).toFixed(5)}</div>
    </div>
  `;

  moveTooltip(evt);
}

function moveTooltip(evt) {
  const rect = document.getElementById("map").getBoundingClientRect();
  const x = evt.clientX - rect.left + 14;
  const y = evt.clientY - rect.top + 14;
  tooltip.style.transform = `translate(${x}px, ${y}px)`;
}

function hideTooltip() {
  tooltip.setAttribute("aria-hidden", "true");
  tooltip.style.opacity = "0";
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTypeBadge(type) {
  const color = typeColors.get(type) || "#d9d9d9";
  return `<span class="badge" style="border-color:${color}; color:${color};">${escapeHtml(type)}</span>`;
}

function renderEventList(events) {
  if (!events || events.length === 0) {
    eventList.innerHTML = `<div class="muted">No events this month.</div>`;
    return;
  }

  const max = 60;
  const slice = events.slice(0, max);

  eventList.innerHTML = slice
    .map((e) => {
      const parts = [];
      parts.push(renderTypeBadge(e.type || "other"));
      if (e.date)
        parts.push(`<span class="badge">${escapeHtml(e.date)}</span>`);
      if (e.city)
        parts.push(`<span class="badge">${escapeHtml(e.city)}</span>`);
      if (e.country)
        parts.push(`<span class="badge">${escapeHtml(e.country)}</span>`);
      if (e.venue)
        parts.push(`<span class="badge">${escapeHtml(e.venue)}</span>`);

      return `
      <div class="eventCard">
        <div class="name">${escapeHtml(e.name || "Untitled")}</div>
        <div class="meta">${parts.join("")}</div>
      </div>
    `;
    })
    .join("");

  if (events.length > max) {
    eventList.innerHTML += `<div class="muted small">Showing ${max} of ${events.length} events.</div>`;
  }
}

function repositionOverlay() {
  g.selectAll("circle.eventDot")
    .attr("cx", (d) => map.latLngToLayerPoint([d.lat, d.lng]).x)
    .attr("cy", (d) => map.latLngToLayerPoint([d.lat, d.lng]).y);
}

map.on("zoom move viewreset", repositionOverlay);

let heatLayer = null;

function ensureHeatLayer() {
  if (heatLayer) return heatLayer;
  if (!L.heatLayer) return null;

  heatLayer = L.heatLayer([], {
    radius: 38,
    blur: 24,
    maxZoom: 6,
    minOpacity: 0.55,
    gradient: {
      0.1: "#1a4fff",
      0.35: "#00d4ff",
      0.55: "#00ff6a",
      0.75: "#ffe600",
      0.9: "#ff7a00",
      1.0: "#ff0000",
    },
  });

  return heatLayer;
}

function setHeatMode(enabled) {
  const hl = ensureHeatLayer();
  if (!hl) {
    if (heatToggle) heatToggle.checked = false;
    return;
  }

  if (enabled) {
    overlay.style("display", "none");
    if (!map.hasLayer(hl)) hl.addTo(map);
  } else {
    overlay.style("display", null);
    if (map.hasLayer(hl)) map.removeLayer(hl);
  }
}

function updateHeatForMonth(events) {
  const hl = ensureHeatLayer();
  if (!hl) return;

  const valid = (events || []).filter(
    (e) => Number.isFinite(e.lat) && Number.isFinite(e.lng),
  );

  const n = valid.length;
  const baseBoost = n < 10 ? 2.2 : n < 30 ? 1.6 : 1.2;
  const pts = valid.map((e) => [e.lat, e.lng, 1 * baseBoost]);

  hl.setLatLngs(pts);
  hl.setOptions({
    max: Math.max(6, Math.min(30, n)),
  });
}

function updateOverlayForMonth(idx) {
  monthIndex = idx;
  const frame = timeline[monthIndex];
  if (!frame) return;

  const { month, events } = frame;

  monthLabel.textContent = month;
  countLabel.textContent = `${events.length} event${events.length === 1 ? "" : "s"}`;
  monthSlider.value = String(monthIndex);

  renderEventList(events);

  const heatOn = !!(heatToggle && heatToggle.checked);
  if (heatOn) {
    updateHeatForMonth(events);
    setMiniActive(monthIndex);
    return;
  }

  const sel = g
    .selectAll("circle.eventDot")
    .data(events, (d) => d.id || `${d.name}-${d.lat}-${d.lng}-${d.date}`);

  sel.exit().remove();

  const enter = sel
    .enter()
    .append("circle")
    .attr("class", "eventDot")
    .attr("r", 6)
    .attr("fill", (d) => colorForEvent(d))
    .attr("stroke", (d) => colorForEvent(d))
    .attr("stroke-width", 1)
    .attr("cx", (d) => map.latLngToLayerPoint([d.lat, d.lng]).x)
    .attr("cy", (d) => map.latLngToLayerPoint([d.lat, d.lng]).y)
    .on("mouseenter", function (evt, d) {
      showTooltip(evt, d);
    })
    .on("mousemove", function (evt) {
      moveTooltip(evt);
    })
    .on("mouseleave", function () {
      hideTooltip();
    })
    .on("click", function (_evt, d) {
      map.flyTo([d.lat, d.lng], Math.max(map.getZoom(), 6), {
        duration: 0.6,
      });
    });

  sel
    .attr("fill", (d) => colorForEvent(d))
    .attr("stroke", (d) => colorForEvent(d));

  enter.merge(sel);

  repositionOverlay();
  setMiniActive(monthIndex);
}

function setPlaying(isPlaying) {
  playBtn.disabled = isPlaying;
  pauseBtn.disabled = !isPlaying;
}

function startPlayback() {
  if (timer) return;
  setPlaying(true);
  timer = setInterval(() => {
    const next = monthIndex + 1;
    if (next >= timeline.length) {
      stopPlayback();
      return;
    }
    updateOverlayForMonth(next);
  }, playbackMs);
}

function stopPlayback() {
  if (timer) clearInterval(timer);
  timer = null;
  setPlaying(false);
}

const miniSvg = d3.select("#miniChart");
let miniData = [];

function renderMiniChart() {
  const W = 600;
  const H = 90;
  const pad = { l: 8, r: 8, t: 10, b: 18 };

  miniSvg.selectAll("*").remove();

  const x = d3
    .scaleBand()
    .domain(d3.range(miniData.length))
    .range([pad.l, W - pad.r])
    .paddingInner(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(miniData, (d) => d.count) || 1])
    .nice()
    .range([H - pad.b, pad.t]);

  miniSvg
    .append("g")
    .selectAll("rect")
    .data(miniData)
    .enter()
    .append("rect")
    .attr("class", "miniBar")
    .attr("x", (_d, i) => x(i))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => H - pad.b - y(d.count));

  miniSvg.selectAll("rect.miniBar").each(function (_d, i) {
    d3.select(this).on("click", () => updateOverlayForMonth(i));
  });

  const tickEvery = Math.max(1, Math.floor(miniData.length / 8));
  const ticks = d3.range(0, miniData.length, tickEvery);

  miniSvg
    .append("g")
    .selectAll("text")
    .data(ticks)
    .enter()
    .append("text")
    .attr("class", "miniAxisText")
    .attr("x", (i) => x(i) + x.bandwidth() / 2)
    .attr("y", H - 4)
    .attr("text-anchor", "middle")
    .text((i) => {
      const m = miniData[i].month;
      const [yy, mm] = m.split("-");
      return mm === "01" ? yy : "";
    });

  setMiniActive(monthIndex);
}

function setMiniActive(activeIdx) {
  miniSvg
    .selectAll("rect.miniBar")
    .classed("active", (_d, i) => i === activeIdx);
}

async function init() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Failed to fetch ${DATA_URL}: ${res.status}`);
  const data = await res.json();

  timeline = data.timeline || [];

  for (const frame of timeline) {
    const evs = frame.events || [];
    for (const e of evs) {
      e.type = classifyEventType(e.name);
    }
  }

  if (timeline.length === 0) {
    monthLabel.textContent = "No data";
    eventList.innerHTML = `<div class="muted">Timeline is empty.</div>`;
    return;
  }

  monthSlider.min = "0";
  monthSlider.max = String(timeline.length - 1);
  monthSlider.value = "0";

  rangeStart.textContent = timeline[0].month;
  rangeEnd.textContent = timeline[timeline.length - 1].month;

  miniData = timeline.map((d) => ({
    month: d.month,
    count: (d.events || []).length,
  }));

  renderMiniChart();

  const firstWithEvents = Math.max(
    0,
    timeline.findIndex((d) => (d.events || []).length > 0),
  );

  monthIndex = firstWithEvents === -1 ? 0 : firstWithEvents;

  updateOverlayForMonth(monthIndex);

  map.setView(OPENING_CENTER, OPENING_ZOOM, { animate: false });

  repositionOverlay();

  if (heatToggle) {
    heatToggle.addEventListener("change", () => {
      stopPlayback();
      setHeatMode(heatToggle.checked);
      updateOverlayForMonth(monthIndex);
    });

    setHeatMode(heatToggle.checked);
  }
}

init().catch((err) => {
  console.error(err);
  monthLabel.textContent = "Error loading data";
  eventList.innerHTML = `<div class="muted">Check console for details.</div>`;
});

playBtn.addEventListener("click", () => startPlayback());
pauseBtn.addEventListener("click", () => stopPlayback());

speedSelect.addEventListener("change", () => {
  playbackMs = Number(speedSelect.value);
  if (timer) {
    stopPlayback();
    startPlayback();
  }
});

monthSlider.addEventListener("input", () => {
  stopPlayback();
  updateOverlayForMonth(Number(monthSlider.value));
});
