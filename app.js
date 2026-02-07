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

// Global variables for lightbox
let currentPhotos = [];
let currentPhotoIndex = 0;

// Global variables for search
let allSites = [];
let allMarkers = [];

// Function to search sites
function searchSites(query) {
    console.log('Search called with query:', query);
    console.log('Total sites available:', allSites.length);
    
    const searchResults = document.getElementById('search-results');
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
        searchResults.classList.remove('active');
        return;
    }
    
    // Search in name, barangay, and municipality
    const results = allSites.filter(site => {
        const name = (site.name || '').toLowerCase();
        const barangay = (site.barangay || '').toLowerCase();
        const municipality = (site.municipality || '').toLowerCase();
        
        console.log('Checking site:', name, 'barangay:', barangay, 'municipality:', municipality);
        
        return name.includes(lowerQuery) || 
               barangay.includes(lowerQuery) || 
               municipality.includes(lowerQuery);
    });
    
    console.log('Found results:', results.length);
    
    // Display results
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No results found</div>';
        searchResults.classList.add('active');
    } else {
        let html = '';
        results.forEach((site, index) => {
            html += '<div class="search-result-item" onclick="zoomToSite(' + index + ', \'' + 
                    site.name.replace(/'/g, "\\'") + '\')">';
            html += '<div class="result-name">' + site.name + '</div>';
            html += '<div class="result-location">' + (site.address || 'Location not specified') + '</div>';
            html += '</div>';
        });
        searchResults.innerHTML = html;
        searchResults.classList.add('active');
        
        // Store filtered results for zooming
        window.searchResults = results;
    }
}

// Function to zoom to a site from search results
function zoomToSite(index, siteName) {
    const site = window.searchResults[index];
    
    // Find the marker for this site
    const marker = allMarkers.find(m => m.site.name === siteName);
    
    if (marker) {
        // Zoom to marker
        map.setView([site.lat, site.lon], 15);
        
        // Open popup
        setTimeout(() => {
            marker.leafletMarker.openPopup();
        }, 500);
        
        // Clear search
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').classList.remove('active');
    }
}

// Function to clear search
function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').classList.remove('active');
    document.getElementById('search-results').innerHTML = '';
}

// Function to generate KMZ file
function generateKMZ(site) {
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${site.name}</name>
    <description>${site.name} - Reclamation Project</description>
    <Style id="reclamationStyle">
      <IconStyle>
        <color>ffff0000</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pushpin/blue-pushpin.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Placemark>
      <name>${site.name}</name>
      <description><![CDATA[
        <h3>${site.name}</h3>
        <table>
          <tr><td><b>Status:</b></td><td>${site.status || 'N/A'}</td></tr>
          <tr><td><b>Year Started:</b></td><td>${site['year started'] || 'N/A'}</td></tr>
          <tr><td><b>Year Completed:</b></td><td>${site['year completed'] || 'N/A'}</td></tr>
          <tr><td><b>Developer:</b></td><td>${site.developer || 'N/A'}</td></tr>
          <tr><td><b>Location:</b></td><td>${site.address || 'N/A'}</td></tr>
          <tr><td><b>Notes:</b></td><td>${site.notes || 'N/A'}</td></tr>
          <tr><td><b>Author:</b></td><td>${site.author || 'N/A'}</td></tr>
        </table>
      ]]></description>
      <styleUrl>#reclamationStyle</styleUrl>
      <Point>
        <coordinates>${site.lon},${site.lat},0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = site.name.replace(/[^a-z0-9]/gi, '_') + '.kmz';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to create popup content
function createPopupContent(properties) {
    let content = '<div class="popup-content">';
    content += '<h3>' + (properties.name || 'Unnamed Site') + '</h3>';
    
    // Only show fields if they have data
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
    
    if (properties['year completed']) {
        content += '<div class="info-row">';
        content += '<span class="label">Year Completed:</span>';
        content += '<span class="value">' + properties['year completed'] + '</span>';
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
    
    if (properties.author) {
        content += '<div class="info-row">';
        content += '<span class="label">Data by:</span>';
        content += '<span class="value">' + properties.author + '</span>';
        content += '</div>';
    }
    
    if (properties.notes) {
        content += '<div class="info-row">';
        content += '<span class="label">Notes:</span>';
        content += '<span class="value">' + properties.notes + '</span>';
        content += '</div>';
    }
    
    // Add photo gallery if photos exist
    if (properties.photos && properties.photos.length > 0) {
        content += '<div class="photo-gallery">';
        content += '<h4>📷 Photos (' + properties.photos.length + ')</h4>';
        content += '<div class="photo-thumbnails">';
        
        properties.photos.forEach((photo, index) => {
            const photoId = 'photo_' + properties.name.replace(/[^a-z0-9]/gi, '_') + '_' + index;
            content += '<img src="' + photo + '" ';
            content += 'class="photo-thumbnail" ';
            content += 'onclick="openLightbox(\'' + photoId + '\')" ';
            content += 'alt="Photo ' + (index + 1) + '" ';
            content += 'onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E\'">';
        });
        
        content += '</div>';
        content += '</div>';
        
        // Store photos for lightbox
        window['photos_' + properties.name.replace(/[^a-z0-9]/gi, '_')] = properties.photos;
    }
    
    // Add KMZ download button
    content += '<button onclick="downloadKMZ_' + properties.name.replace(/[^a-z0-9]/gi, '_') + '()" ';
    content += 'style="width: 100%; padding: 10px; margin-top: 10px; ';
    content += 'background: #1e40af; color: white; border: none; ';
    content += 'border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;">';
    content += '🌍 Open in Google Earth Pro</button>';
    
    content += '</div>';
    return content;
}

// Load sites data
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        console.log('Data loaded successfully!');
        console.log('Number of sites:', data.sites.length);
        
        allSites = data.sites; // Store for search
        
        console.log('First site data:', allSites[0]);
        
        data.sites.forEach(site => {
            const marker = L.marker([site.lat, site.lon], { icon: reclaimedIcon })
                .addTo(map);
            
            marker.bindPopup(createPopupContent(site), { 
                maxWidth: 300,
                maxHeight: 400
            });
            
            // Store marker reference for search
            allMarkers.push({
                site: site,
                leafletMarker: marker
            });
            
            // Create unique function for this site's KMZ download
            const funcName = 'downloadKMZ_' + site.name.replace(/[^a-z0-9]/gi, '_');
            window[funcName] = function() {
                generateKMZ(site);
            };
        });
        
        console.log('All sites stored:', allSites.length);
        console.log('All markers stored:', allMarkers.length);
        
        // Set up search event listeners after data is loaded
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const clearButton = document.getElementById('clear-button');
        
        if (!searchInput || !searchButton || !clearButton) {
            console.error('Search elements not found!');
            console.log('searchInput:', searchInput);
            console.log('searchButton:', searchButton);
            console.log('clearButton:', clearButton);
            return;
        }
        
        console.log('Setting up search event listeners...');
        
        // Search on button click
        searchButton.addEventListener('click', () => {
            console.log('Search button clicked');
            searchSites(searchInput.value);
        });
        
        // Search on Enter key
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter key pressed');
                searchSites(searchInput.value);
            } else {
                // Live search as user types
                searchSites(searchInput.value);
            }
        });
        
        // Clear search
        clearButton.addEventListener('click', () => {
            console.log('Clear button clicked');
            clearSearch();
        });
        
        console.log('Search setup complete! Try searching now.');
    })
    .catch(error => {
        console.error('Error loading data:', error);
    });

// Lightbox functions
function openLightbox(photoId) {
    const parts = photoId.split('_');
    const siteName = parts.slice(1, -1).join('_');
    const photoIndex = parseInt(parts[parts.length - 1]);
    
    currentPhotos = window['photos_' + siteName];
    currentPhotoIndex = photoIndex;
    
    document.getElementById('lightbox-img').src = currentPhotos[currentPhotoIndex];
    document.getElementById('lightbox-counter').textContent = (currentPhotoIndex + 1) + ' / ' + currentPhotos.length;
    document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

function changePhoto(direction) {
    currentPhotoIndex += direction;
    
    if (currentPhotoIndex < 0) {
        currentPhotoIndex = currentPhotos.length - 1;
    } else if (currentPhotoIndex >= currentPhotos.length) {
        currentPhotoIndex = 0;
    }
    
    document.getElementById('lightbox-img').src = currentPhotos[currentPhotoIndex];
    document.getElementById('lightbox-counter').textContent = (currentPhotoIndex + 1) + ' / ' + currentPhotos.length;
}

// Close lightbox with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Navigate photos with arrow keys
document.addEventListener('keydown', function(e) {
    if (document.getElementById('lightbox').classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            changePhoto(-1);
        } else if (e.key === 'ArrowRight') {
            changePhoto(1);
        }
    }
});

// Close lightbox when clicking outside the image
document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) {
        closeLightbox();
    }
});
