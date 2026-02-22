import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload } from 'lucide-react';

/** Normalize a parsed CSV row into the site shape used by the app. */
function normalizeRow(row) {
  // Collect photos from photo1–photo4 columns, or a comma-separated "photos" column
  const photos = [];
  ['photo1', 'photo2', 'photo3', 'photo4'].forEach(key => {
    const val = (row[key] || '').trim();
    if (val) photos.push(val);
  });
  if (row.photos && typeof row.photos === 'string') {
    row.photos.split(',').forEach(p => {
      const trimmed = p.trim();
      if (trimmed) photos.push(trimmed);
    });
  }

  const barangay    = row.barangay    || row.Barangay    || '';
  const municipality = row.municipality || row.Municipality || '';
  const province    = row.province    || row.Province    || '';
  const region      = row.region      || row.Region      || '';

  return {
    name:              row.name              || row.Name              || '',
    lat:               parseFloat(row.lat   || row.latitude  || row.Latitude  || 0),
    lon:               parseFloat(row.lon   || row.lng       || row.longitude || row.Longitude || 0),
    status:            row.status            || row.Status            || '',
    'year started':    row['year started']   || row.year_started      || '',
    'year completed':  row['year completed'] || row.year_completed    || '',
    developer:         row.developer         || row.Developer         || '',
    author:            row.author            || row.Author            || '',
    notes:             row.notes             || row.Notes             || '',
    barangay,
    municipality,
    province,
    region,
    address:
      row.address || row.Address ||
      [barangay, municipality, province].filter(Boolean).join(', '),
    photos,
  };
}

function FileUploader({ onDataLoaded }) {
  const fileInputRef = useRef();
  const [uploadedName, setUploadedName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const sites = results.data
          .map(normalizeRow)
          .filter(s => s.lat !== 0 && s.lon !== 0 && !isNaN(s.lat) && !isNaN(s.lon));

        if (sites.length === 0) {
          alert(
            'No valid sites found in the CSV. ' +
            'Make sure each row has numeric lat and lon (or latitude/longitude) columns.'
          );
        } else {
          setUploadedName(`${file.name} (${sites.length} sites)`);
          onDataLoaded(sites);
        }
        e.target.value = '';
      },
      error: () => {
        alert('Error parsing the CSV file. Please check the format and try again.');
        e.target.value = '';
      },
    });
  };

  return (
    <div>
      <div className="section-title">
        <Upload size={14} />
        <span>Upload CSV Data</span>
      </div>
      <p className="upload-hint">
        CSV columns: <code>name</code>, <code>lat</code>, <code>lon</code>,{' '}
        <code>municipality</code>, <code>province</code>, <code>region</code>,{' '}
        <code>developer</code>, <code>photo1</code>–<code>photo4</code>
      </p>
      <button className="upload-btn" onClick={() => fileInputRef.current.click()}>
        <Upload size={15} />
        Choose CSV File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {uploadedName && (
        <div className="upload-status">Loaded: {uploadedName}</div>
      )}
    </div>
  );
}

export default FileUploader;
