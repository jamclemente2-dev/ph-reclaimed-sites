// PWA Map App - Direct GeoJSON Reader
// Reads from Reclamation_Sites_PolygonandPoints.geojson

const GEOJSON_FILE = 'Reclamation_Sites_PolygonandPoints.geojson';
const PHOTO_BASE_PATH = 'photos/';

let map;
let allFeatures = [];
let markersLayer;

// Extract Google Drive file ID from URL
function extractGoogleDriveId(url) {
    if (!url || url === 'null' || url.trim() === '') return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

// Convert Google Drive link to direct image URL
function getDirectImageUrl(driveUrl) {
    const fileId = extractGoogleDriveId(driveUrl);
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w800` : null;
}

// Process GeoJSON feature into our format
function processFeature(feature) {
    const props = feature.properties;
    
    // Extract photos from photo 1, photo 2, photo 3, photo 4 fields
    const photos = [];
    for (let i = 1; i <= 4; i++) {
        const photoUrl = props[`photo ${i}`];
        if (photoUrl && photoUrl !== 'null' && photoUrl.trim() !== '') {
            const directUrl = getDirectImageUrl(photoUrl);
            if (directUrl) {
                photos.push({
                    thumbnail: directUrl,
                    full: directUrl,
                    drive_link: photoUrl
                });
            }
        }
    }
    
    return {
        name: props.Name || props.name_2 || 'Unnamed Site',
        lat: props.lat,
        lon: props.lon,
        geometry: feature.geometry,
        geometry_type: feature.geometry.type,
        status: props.status || 'Unknown',
        barangay: props.barangay || '',
        municipality: props['municipality/city'] || props.municipality || '',
        province: props.province || '',
        region: props.region || '',
        developer: props.developer || '',
        year_start: props.year_start || '',
        year_end: props.year_end || '',
        area: props.area || props.Has || '',
        pra_status: props.pra_status_2 || props.pra_status || '',
        notes: props.notes || '',
        photos: photos
    };
}

// Initialize map
function initMap() {
    map = L.map('map').setView([12.8797, 121.7740], 6);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    markersLayer = L.layerGroup().addTo(map);
}

// Create popup content
function createPopupContent(site) {
    let html = `
        <div class="popup-content">
            <h3>${site.name}</h3>
            <div class="popup-details">
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="status-badge status-${site.status.toLowerCase().replace(/\s+/g, '-')}">${site.status}</span>
                </div>
    `;
    
    if (site.municipality) {
        html += `<div class="detail-row"><span class="label">Location:</span> ${site.municipality}`;
        if (site.province) html += `, ${site.province}`;
        html += `</div>`;
    }
    
    if (site.barangay) {
        html += `<div class="detail-row"><span class="label">Barangay:</span> ${site.barangay}</div>`;
    }
    
    if (site.developer) {
        html += `<div class="detail-row"><span class="label">Developer:</span> ${site.developer}</div>`;
    }
    
    if (site.year_start || site.year_end) {
        html += `<div class="detail-row"><span class="label">Year:</span> ${site.year_start || '?'} - ${site.year_end || 'Ongoing'}</div>`;
    }
    
    if (site.area) {
        html += `<div class="detail-row"><span class="label">Area:</span> ${site.area} ha</div>`;
    }
    
    if (site.notes) {
        const shortNotes = site.notes.length > 150 ? site.notes.substring(0, 150) + '...' : site.notes;
        html += `<div class="detail-row"><span class="label">Notes:</span> ${shortNotes}</div>`;
    }
    
    html += `
                <div class="detail-row">
                    <span class="label">Coordinates:</span> ${site.lat.toFixed(6)}, ${site.lon.toFixed(6)}
                </div>
            </div>
    `;
    
    // Photos in compact 2-column grid
    if (site.photos && site.photos.length > 0) {
        html += '<div class="popup-photos">';
        site.photos.forEach((photo, idx) => {
            html += `
                <img src="${photo.thumbnail}" 
                     alt="Photo ${idx + 1}" 
                     onclick="openLightbox(${allFeatures.indexOf(site)}, ${idx})"
                     style="width: 65px; height: 65px; object-fit: cover; cursor: pointer; margin: 2px; border-radius: 3px;">
            `;
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// Add feature to map
function addFeatureToMap(site) {
    if (site.geometry_type === 'Point') {
        // Point marker
        const blueIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #0066cc; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        
        const marker = L.marker([site.lat, site.lon], { icon: blueIcon })
            .bindPopup(createPopupContent(site), { maxWidth: 350, className: 'compact-popup' });
        markersLayer.addLayer(marker);
        
    } else if (site.geometry_type === 'Polygon' || site.geometry_type === 'MultiPolygon') {
        // Polygon/MultiPolygon
        const coords = site.geometry.type === 'MultiPolygon' 
            ? site.geometry.coordinates.map(poly => poly[0].map(coord => [coord[1], coord[0]]))
            : [site.geometry.coordinates[0].map(coord => [coord[1], coord[0]])];
        
        const polygon = L.polygon(coords, {
            color: '#0066cc',
            fillColor: '#0066cc',
            fillOpacity: 0.2,
            weight: 2
        }).bindPopup(createPopupContent(site), { maxWidth: 350, className: 'compact-popup' });
        
        markersLayer.addLayer(polygon);
    }
}

// Load and display GeoJSON
async function loadGeoJSON() {
    try {
        const response = await fetch(GEOJSON_FILE);
        if (!response.ok) throw new Error(`Failed to load ${GEOJSON_FILE}`);
        
        const geojson = await response.json();
        console.log('Loaded GeoJSON:', geojson.features.length, 'features');
        
        allFeatures = geojson.features.map(processFeature);
        
        // Display on map
        allFeatures.forEach(site => {
            if (site.lat && site.lon) {
                addFeatureToMap(site);
            }
        });
        
        updateStats();
        
    } catch (error) {
        console.error('Error loading GeoJSON:', error);
        alert('Error loading reclamation sites. Please check console for details.');
    }
}

// Update statistics
function updateStats() {
    const totalSites = allFeatures.length;
    const totalPhotos = allFeatures.reduce((sum, site) => sum + (site.photos?.length || 0), 0);
    
    document.getElementById('total-sites').textContent = totalSites;
    document.getElementById('total-photos').textContent = totalPhotos;
}

// Search functionality
function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    if (!query) {
        markersLayer.clearLayers();
        allFeatures.forEach(addFeatureToMap);
        return;
    }
    
    const results = allFeatures.filter(site => 
        site.name.toLowerCase().includes(query) ||
        (site.barangay && site.barangay.toLowerCase().includes(query)) ||
        (site.municipality && site.municipality.toLowerCase().includes(query)) ||
        (site.province && site.province.toLowerCase().includes(query))
    );
    
    markersLayer.clearLayers();
    results.forEach(addFeatureToMap);
    
    if (results.length > 0) {
        const bounds = L.latLngBounds(results.map(s => [s.lat, s.lon]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Lightbox
function openLightbox(siteIndex, photoIndex) {
    const site = allFeatures[siteIndex];
    if (!site || !site.photos || !site.photos[photoIndex]) return;
    
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    lightboxImg.src = site.photos[photoIndex].full;
    lightboxCaption.innerHTML = `
        <strong>${site.name}</strong><br>
        Photo ${photoIndex + 1} of ${site.photos.length}
        ${site.municipality ? ` | ${site.municipality}` : ''}
        ${site.province ? `, ${site.province}` : ''}
    `;
    
    lightbox.style.display = 'flex';
    
    window.currentLightboxSite = siteIndex;
    window.currentLightboxPhoto = photoIndex;
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}

function navigateLightbox(direction) {
    const site = allFeatures[window.currentLightboxSite];
    if (!site || !site.photos) return;
    
    let newIndex = window.currentLightboxPhoto + direction;
    if (newIndex < 0) newIndex = site.photos.length - 1;
    if (newIndex >= site.photos.length) newIndex = 0;
    
    openLightbox(window.currentLightboxSite, newIndex);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadGeoJSON();
    
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('lightbox').style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateLightbox(-1);
            if (e.key === 'ArrowRight') navigateLightbox(1);
        }
    });
});

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
