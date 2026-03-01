import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polygon, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';

const { BaseLayer, Overlay } = LayersControl;

// ── Marker icon helpers ───────────────────────────────────────────────────────

const STATUS_COLORS = {
  completed: '#1e40af',
  complete:  '#1e40af',
  ongoing:   '#d97706',
};

function getStatusColor(status) {
  const key = (status || '').toLowerCase().replace(/[-\s]/g, '');
  return STATUS_COLORS[key] || '#6b7280';
}

// Cache icons per status color to avoid creating new L.divIcon on every render
const iconCache = {};

function createMarkerIcon(status) {
  const color = getStatusColor(status);
  if (iconCache[color]) return iconCache[color];

  const icon = L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
        <path fill="${color}" stroke="white" stroke-width="1.5"
          d="M12 1C6.477 1 2 5.477 2 11c0 7.5 10 20 10 20S22 18.5 22 11C22 5.477 17.523 1 12 1z"/>
        <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.92"/>
      </svg>`,
    className: '',
    iconSize:    [24, 32],
    iconAnchor:  [12, 32],
    popupAnchor: [0, -34],
  });

  iconCache[color] = icon;
  return icon;
}

// ── Popup content ─────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <span className="label">{label}:</span>
      <span className="value">{value}</span>
    </div>
  );
}

function SitePopup({ site, onPhotoClick }) {
  const photos = site.photos || [];

  return (
    <div className="popup-content">
      <h3>{site.name || 'Unnamed Site'}</h3>

      <InfoRow label="Status"    value={site.status} />
      <InfoRow label="Started"   value={site['year started']} />
      <InfoRow label="Completed" value={site['year completed']} />
      <InfoRow label="Developer" value={site.developer} />
      <InfoRow label="Location"  value={site.address} />
      <InfoRow label="Data by"   value={site.author} />
      <InfoRow label="Notes"     value={site.notes} />

      {photos.length > 0 && (
        <div className="photo-gallery">
          <h4>Photos ({photos.length})</h4>
          <div className="photo-thumbnails">
            {photos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt={`Photo ${i + 1}`}
                className="photo-thumbnail"
                onClick={() => onPhotoClick(photos, i)}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Map component ─────────────────────────────────────────────────────────────

function MapDisplay({ sites, onPhotoClick }) {
  return (
    <MapContainer
      center={[12.8797, 121.774]}
      zoom={6}
      style={{ width: '100%', height: '100vh' }}
    >
      <LayersControl position="topright">
        <BaseLayer checked name="Street">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        </BaseLayer>
        <Overlay checked name="Polygon Areas">
          <FeatureGroup>
            {sites
              .filter(site => Array.isArray(site.polygon) && site.polygon.length >= 3)
              .map((site, index) => (
                <Polygon
                  key={`poly-${site.name}-${index}`}
                  positions={site.polygon}
                  pathOptions={{
                    color: getStatusColor(site.status),
                    fillColor: getStatusColor(site.status),
                    fillOpacity: 0.25,
                    weight: 2,
                  }}
                >
                  <Popup maxWidth={300} minWidth={240}>
                    <SitePopup site={site} onPhotoClick={onPhotoClick} />
                  </Popup>
                </Polygon>
              ))}
          </FeatureGroup>
        </Overlay>
      </LayersControl>

      {sites.map((site, index) => (
        <Marker
          key={`${site.name}-${index}`}
          position={[site.lat, site.lon]}
          icon={createMarkerIcon(site.status)}
        >
          <Popup maxWidth={300} minWidth={240}>
            <SitePopup site={site} onPhotoClick={onPhotoClick} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default MapDisplay;
