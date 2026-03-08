import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, FeatureGroup, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

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

      <InfoRow label="Code"      value={site.code_name} />
      <InfoRow label="Status"    value={site.status} />
      <InfoRow label="Started"   value={site.year_start || site['year started']} />
      <InfoRow label="Completed" value={site.year_end || site['year completed']} />
      <InfoRow label="Developer" value={site.developer} />
      <InfoRow label="Location"  value={site.address || [site.barangay, site.municipality, site.province].filter(Boolean).join(', ')} />
      <InfoRow label="Region"    value={site.region} />
      <InfoRow label="Area"      value={site.area ? `${site.area} ha` : null} />
      <InfoRow label="PRA Status" value={site.pra_status} />
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

// Helper to convert polygon coordinates
function convertPolygonCoordinates(geometry) {
  // Check if coordinates are in lat/lon range (< 180)
  if (geometry.type === 'Polygon') {
    const firstCoord = geometry.coordinates[0][0];
    if (Math.abs(firstCoord[0]) < 180 && Math.abs(firstCoord[1]) < 90) {
      // GeoJSON is [lon, lat], Leaflet needs [lat, lon]
      return [geometry.coordinates[0].map(([lon, lat]) => [lat, lon])];
    }
  } else if (geometry.type === 'MultiPolygon') {
    const firstCoord = geometry.coordinates[0][0][0];
    if (Math.abs(firstCoord[0]) < 180 && Math.abs(firstCoord[1]) < 90) {
      return geometry.coordinates.map(poly => poly[0].map(([lon, lat]) => [lat, lon]));
    }
  }
  
  // Coordinates are in projected CRS - skip
  return null;
}

// ── Map component ─────────────────────────────────────────────────────────────

function MapDisplay({ sites, onPhotoClick, layers }) {
  const [ports, setPorts] = useState([]);

  // Get layer visibility from sidebar
  const showPolygons = layers?.find(l => l.id === 'polygons')?.visible ?? true;
  const showPorts = layers?.find(l => l.id === 'ports')?.visible ?? false;

  // Load ports GeoJSON
  useEffect(() => {
    const portsPath = `${import.meta.env.BASE_URL}Ports.geojson`;
    console.log('🚢 Loading ports from:', portsPath);
    
    fetch(portsPath)
      .then(response => {
        if (!response.ok) {
          console.log('⚠️ No Ports.geojson found (this is okay)');
          return null;
        }
        return response.json();
      })
      .then(geojson => {
        if (geojson && geojson.features) {
          console.log('✅ Loaded ports:', geojson.features.length);
          
          // Process ports features
          const processedPorts = geojson.features.map(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;
            
            return {
              name: props.name || props.Name || 'Unnamed Port',
              lat: coords[1],
              lon: coords[0],
              type: props.type || 'port'
            };
          });
          
          setPorts(processedPorts);
        }
      })
      .catch(error => {
        console.log('⚠️ Ports not loaded:', error.message);
      });
  }, []);

  // Extract polygons from sites
  const polygonsToRender = useMemo(() => {
    const result = [];
    sites.forEach((site, index) => {
      if (site.geometry && (site.geometry.type === 'Polygon' || site.geometry.type === 'MultiPolygon')) {
        const coords = convertPolygonCoordinates(site.geometry);
        if (coords) {
          const color = getStatusColor(site.status);
          coords.forEach((ring, ri) => {
            result.push({
              key: `polygon-${index}-${ri}`,
              positions: ring,
              site,
              color,
            });
          });
        }
      }
    });
    console.log(`📐 Rendering ${result.length} polygons from ${sites.length} sites`);
    return result;
  }, [sites]);

  return (
    <MapContainer
      center={[12.8797, 121.774]}
      zoom={6}
      style={{ width: '100%', height: '100vh' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      
      {/* Reclamation Polygons - controlled by sidebar */}
      {showPolygons && (
        <FeatureGroup>
          {polygonsToRender.map(({ key, positions, site, color }) => (
            <Polygon
              key={key}
              positions={positions}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 2 }}
            >
              <Popup maxWidth={300} minWidth={240}>
                <SitePopup site={site} onPhotoClick={onPhotoClick} />
              </Popup>
            </Polygon>
          ))}
        </FeatureGroup>
      )}

      {/* Ports Layer - controlled by sidebar */}
      {showPorts && ports.length > 0 && (
        <FeatureGroup>
          {ports.map((port, index) => (
            <CircleMarker
              key={`port-${index}`}
              center={[port.lat, port.lon]}
              radius={6}
              pathOptions={{
                color: '#dc2626',
                fillColor: '#ef4444',
                fillOpacity: 0.8,
                weight: 2
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                {port.name}
              </Tooltip>
              <Popup>
                <div className="port-popup">
                  <h4>{port.name}</h4>
                  <p className="port-note">
                    <em>Port data extracted from OpenStreetMap</em>
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </FeatureGroup>
      )}

      {/* Reclamation Sites Markers */}
      {sites.map((site, index) => {
        // Skip sites without valid coordinates
        if (!site.lat || !site.lon || isNaN(site.lat) || isNaN(site.lon)) {
          return null;
        }
        
        return (
          <Marker
            key={`${site.name}-${index}`}
            position={[site.lat, site.lon]}
            icon={createMarkerIcon(site.status)}
          >
            <Popup maxWidth={300} minWidth={240}>
              <SitePopup site={site} onPhotoClick={onPhotoClick} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default MapDisplay;
