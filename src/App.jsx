import { useState, useEffect, useCallback } from 'react';
import SearchSidebar from './components/SearchSidebar';
import MapDisplay from './components/MapDisplay';
import Lightbox from './components/Lightbox';
import defaultData from '../data.json';

const INITIAL_FILTERS = {
  name: '',
  municipality: '',
  province: '',
  region: '',
  developer: '',
};

function App() {
  const [allSites, setAllSites] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [lightbox, setLightbox] = useState({ open: false, photos: [], index: 0 });

  useEffect(() => {
    setAllSites(defaultData.sites);
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
