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

// Function to generate KMZ file for a site
function generateKMZ(site) {
    // Create KML content
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
          <tr><td><b>Area:</b></td><td>${site.area || 'N/A'} hectares</td></tr>
          <tr><td><b>Status:</b></td><td>${site.status || 'N/A'}</td></tr>
          <tr><td><b>Year Started:</b></td><td>${site['year started'] || 'N/A'}</td></tr>
          <tr><td><b>Year Completed:</b></td><td>${site['year completed'] || 'N/A'}</td></tr>
          <tr><td><b>Developer:</b></td><td>${site.developer || 'N/A'}</td></tr>
          <tr><td><b>Location:</b></td><td>${site.address || 'N/A'}</td></tr>
          <tr><td><b>Notes:</b></td><td>${site.notes || 'N/A'}</td></tr>
        </table>
      ]]></description>
      <styleUrl>#reclamationStyle</styleUrl>
      <Point>
        <coordinates>${site.lon},${site.lat},0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

    // Create blob and download
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
    
    if (properties.notes) {
        content += '<div class="info-row">';
        content += '<span class="label">Notes:</span>';
        content += '<span class="value">' + properties.notes + '</span>';
        content += '</div>';
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
        data.sites.forEach(site => {
    const marker = L.marker([site.lat, site.lon], { icon: reclaimedIcon })
        .addTo(map);
    
    marker.bindPopup(createPopupContent(site));
    
    // Create unique function for this site's KMZ download
    const funcName = 'downloadKMZ_' + site.name.replace(/[^a-z0-9]/gi, '_');
    window[funcName] = function() {
        generateKMZ(site);
    };
});
    })

    .catch(error => console.error('Error loading data:', error));

