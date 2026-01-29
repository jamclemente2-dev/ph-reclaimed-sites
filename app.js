// Initialize map centered on Philippines
const map = L.map('map').setView([12.8797, 121.7740], 6);

// Add map tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Custom marker icon
const reclaimedIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <path fill="#1e40af" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            <circle cx="12" cy="9" r="2" fill="white"/>
        </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Function to create popup content
function createPopupContent(properties) {
    let content = '<div class="popup-content">';
    content += '<h3>' + properties.name + '</h3>';
    
    if (properties.area) {
        content += '<div class="info-row">';
        content += '<span class="label">Area:</span>';
        content += '<span class="value">' + properties.area + ' hectares</span>';
        content += '</div>';
    }
    
    if (properties.status) {
        content += '<div class="info-row">';
        content += '<span class="label">Status:</span>';
        content += '<span class="value">' + properties.status + '</span>';
        content += '</div>';
    }
    
    if (properties['year started']) {
        content += '<div class="info-row">';
        content += '<span class="label">Year Started:</span>';
        content += '<span class="value">' + properties['year started'] + '</span>';
        content += '</div>';
    }
    
    if (properties.developer) {
        content += '<div class="info-row">';
        content += '<span class="label">Developer:</span>';
        content += '<span class="value">' + properties.developer + '</span>';
        content += '</div>';
    }
    
    if (properties.address) {
        content += '<div class="info-row">';
        content += '<span class="label">Location:</span>';
        content += '<span class="value">' + properties.address + '</span>';
        content += '</div>';
    }
    
    content += '</div>';
    return content;
}

// Load sites data
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        data.sites.forEach(site => {
            const marker = L.marker([site.lat, site.lon], { icon: reclaimedIcon })
                .addTo(map);
            
            marker.bindPopup(createPopupContent(site));
        });
    })
    .catch(error => console.error('Error loading data:', error));