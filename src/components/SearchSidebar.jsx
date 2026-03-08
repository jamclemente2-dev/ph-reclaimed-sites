import { SlidersHorizontal, X, Map } from 'lucide-react';

const FILTER_FIELDS = [
  { key: 'name',         label: 'Name',         placeholder: 'Search by name…' },
  { key: 'municipality', label: 'Municipality',  placeholder: 'e.g. Manila, Makati…' },
  { key: 'province',     label: 'Province',      placeholder: 'e.g. Bataan, Cebu…' },
  { key: 'region',       label: 'Region',        placeholder: 'e.g. NCR, Region VII…' },
  { key: 'developer',   label: 'Developer',     placeholder: 'Search by developer…' },
];

function SearchSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  totalSites,
  visibleSites,
  layers,
  onLayerToggle,
}) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Philippine Reclaimed Sites</h1>
        <p>Interactive map of reclamation projects</p>
      </div>

      <div className="sidebar-stats">
        Showing <strong>{visibleSites}</strong> of <strong>{totalSites}</strong> sites
      </div>

      <div className="sidebar-section">
        <div className="section-title">
          <SlidersHorizontal size={14} />
          <span>Filter Sites</span>
        </div>

        {FILTER_FIELDS.map(({ key, label, placeholder }) => (
          <div className="filter-group" key={key}>
            <label htmlFor={`filter-${key}`}>{label}</label>
            <input
              id={`filter-${key}`}
              type="text"
              placeholder={placeholder}
              value={filters[key]}
              onChange={e => onFilterChange(key, e.target.value)}
              autoComplete="off"
            />
          </div>
        ))}

        {hasActiveFilters && (
          <button className="clear-btn" onClick={onClearFilters}>
            <X size={13} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Map Layers Section */}
      <div className="sidebar-section">
        <div className="section-title">
          <Map size={14} />
          <span>Map Layers</span>
        </div>
        
        <div className="layer-controls">
          {layers.map(layer => (
            <label key={layer.id} className="layer-checkbox">
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => onLayerToggle(layer.id)}
              />
              <span className="layer-name">{layer.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="legend">
        <div className="legend-title">Status Legend</div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#1e40af' }} />
          Completed
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#d97706' }} />
          On-Going
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#6b7280' }} />
          Other / Unknown
        </div>
      </div>
    </aside>
  );
}

export default SearchSidebar;
