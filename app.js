import { useState, useEffect, useCallback } from 'react';
import SearchSidebar from './components/SearchSidebar';
import MapDisplay from './components/MapDisplay';
import Lightbox from './components/Lightbox';

const INITIAL_FILTERS = {
  name: '',
  municipality: '',
  province: '',
  region: '',
  developer: '',
};

// Helper functions for processing GeoJSON
function extractGoogleDriveId(url) {
  if (!url || url === 'null' || url.trim() === '') return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function getDirectImageUrl(driveUrl) {
  const fileId = extractGoogleDriveId(driveUrl);
  return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w800` : null;
}

function processFeature(feature) {
  const props = feature.properties;
  
  // Extract photos from photo 1, photo 2, photo 3, photo 4 fields
  const photos = [];
  for (let i = 1; i <= 4; i++) {
    const photoUrl = props[`photo ${i}`];
    if (photoUrl && photoUrl !== 'null' && photoUrl.trim() !== '') {
      const directUrl = getDirectImageUrl(photoUrl);
      if (directUrl) {
        photos.push(directUrl);
      }
    }
  }
  
  return {
    name: props.Name || props.name_2 || 'Unnamed Site',
    code_name: props['Code name'] || '',
    lat: props.lat,
    lon: props.lon,
    geometry: feature.geometry,
    geometry_type: feature.geometry.type,
    status: props.status || 'Unknown',
    year_start: props.year_start || '',
    year_end: props.year_end || '',
    developer: props.developer || '',
    author: props.author || '',
    notes: props.notes || '',
    barangay: props.barangay || '',
    municipality: props['municipality/city'] || props.municipality || '',
    province: props.province || '',
    region: props.region || '',
    area: props.area || props.Has || '',
    pra_status: props.pra_status_2 || props.pra_status || '',
    photos: photos,
    // Keep old field names for backwards compatibility
    'year started': props.year_start || '',
    'year completed': props.year_end || '',
    address: [props.barangay, props['municipality/city'] || props.municipality, props.province].filter(Boolean).join(', ')
  };
}

function App() {
  const [allSites, setAllSites] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [lightbox, setLightbox] = useState({ open: false, photos: [], index: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load GeoJSON from public folder
    fetch('/ReclamationSites.geojson')
      .then(response => response.json())
      .then(geojson => {
        console.log('✅ Loaded GeoJSON:', geojson.features.length, 'features');
        const sites = geojson.features.map(processFeature);
        console.log('✅ Processed first site:', sites[0]);
        setAllSites(sites);
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error loading GeoJSON:', error);
        setLoading(false);
      });
  }, []);

  const filteredSites = allSites.filter(site => {
    const match = (field, key) =>
      !filters[key] ||
      (site[field] || '').toLowerCase().includes(filters[key].toLowerCase());

    return (
      match('name', 'name') &&
      match('municipality', 'municipality') &&
      match('province', 'province') &&
      match('region', 'region') &&
      match('developer', 'developer')
    );
  });

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const openLightbox = useCallback((photos, index) => {
    setLightbox({ open: true, photos, index });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(prev => ({ ...prev, open: false }));
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading reclamation sites...</div>;
  }

  return (
    <div className="app-container">
      <SearchSidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        totalSites={allSites.length}
        visibleSites={filteredSites.length}
      />
      <div className="map-wrapper">
        <MapDisplay
          sites={filteredSites}
          onPhotoClick={openLightbox}
        />
      </div>
      {lightbox.open && (
        <Lightbox
          photos={lightbox.photos}
          initialIndex={lightbox.index}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}

export default App;
