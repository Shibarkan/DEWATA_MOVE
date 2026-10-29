import L from "leaflet";

const RED = "#B91C1C";
const BLUE = "#2563EB";

export function createODFlowLayer(
  flows,
  target,
  selectedOriginId,
  formatValue = (value) => Math.round(value).toLocaleString("id-ID"),
) {
  const layer = L.layerGroup();

  if (!target || !flows.length) {
    return layer;
  }

  const maximumFlow = Math.max(1, ...flows.map(({ value }) => value));

  for (const { origin, value } of flows) {
    if (!origin || origin.id === target.id || value <= 0) {
      continue;
    }

    const selected = origin.id === selectedOriginId;
    const color = selected ? RED : BLUE;
    const intensity = Math.sqrt(value / maximumFlow);
    const opacity = selected ? 0.82 : 0.22 + intensity * 0.42;

    L.polyline(
      [
        [origin.lat, origin.lng],
        [target.lat, target.lng],
      ],
      {
        color,
        weight: selected ? 2.8 : 1 + intensity * 1.8,
        opacity,
        dashArray: selected ? undefined : "5 8",
        interactive: true,
      },
    )
      .bindTooltip(
        `${origin.id} → ${target.id}: ${formatValue(value)} smp/jam`,
      )
      .addTo(layer);

    const progress = 0.84;
    const arrowLat = origin.lat + (target.lat - origin.lat) * progress;
    const arrowLng = origin.lng + (target.lng - origin.lng) * progress;
    const meanLatitude = ((origin.lat + target.lat) * Math.PI) / 360;
    const screenX = (target.lng - origin.lng) * Math.cos(meanLatitude);
    const screenY = origin.lat - target.lat;
    const angle = (Math.atan2(screenY, screenX) * 180) / Math.PI;

    L.marker([arrowLat, arrowLng], {
      icon: L.divIcon({
        className: "dm-od-arrow",
        html: `<span style="display:block;width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-left:7px solid ${color};transform:rotate(${angle}deg);filter:drop-shadow(0 1px 1px #fff)"></span>`,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: 750,
    }).addTo(layer);
  }

  L.circleMarker([target.lat, target.lng], {
    radius: 18,
    color: RED,
    weight: 2,
    opacity: 0.95,
    fillColor: RED,
    fillOpacity: 0.1,
    interactive: false,
  }).addTo(layer);

  return layer;
}