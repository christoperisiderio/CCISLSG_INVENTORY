import React, { useState, useRef } from 'react';
import QRCode from 'qrcode.react';
import '../Mobile.css';

/**
 * QR Code Scanner Component
 * Allows quick borrowing of items via QR code scanning
 * Features: Generate QR codes for items, scan QR codes to borrow
 */

function QRScanner({ handleBorrow, items }) {
  const [scanMode, setScanMode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [scannedResult, setScannedResult] = useState('');
  const qrRef = useRef();

  // Generate QR code for an item (for printing/sharing)
  const handleGenerateQR = (item) => {
    setSelectedItem(item);
    setGeneratedCode(item.id);
  };

  // Download QR code as image
  const downloadQRCode = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-item-${selectedItem.id}.png`;
      link.href = url;
      link.click();
    }
  };

  // Handle QR code scan (simulated)
  const handleScanInput = (e) => {
    const value = e.target.value;
    setScannedResult(value);
    
    // Parse QR code value (format: "item_id_123")
    if (value.startsWith('item_id_')) {
      const itemId = parseInt(value.replace('item_id_', ''));
      const item = items.find(i => i.id === itemId);
      
      if (item) {
        handleBorrow(item);
        setScannedResult('');
        setScanMode(false);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>📱 QR Code Scanner</h2>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setScanMode(!scanMode)}
          style={{
            flex: 1,
            padding: '12px',
            background: scanMode ? '#2a5298' : '#f0f0f0',
            color: scanMode ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {scanMode ? '✓ Scan Mode Active' : 'Scan QR Code'}
        </button>
        <button
          onClick={() => { setGeneratedCode(null); setSelectedItem(null); }}
          style={{
            flex: 1,
            padding: '12px',
            background: generatedCode ? '#2a5298' : '#f0f0f0',
            color: generatedCode ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Generate QR
        </button>
      </div>

      {/* Scan Mode */}
      {scanMode && (
        <div style={{
          background: '#f5f5f5',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <p style={{ marginTop: 0, color: '#666' }}>
            📷 Point your camera at a QR code or paste the code below:
          </p>
          <input
            type="text"
            placeholder="Scan QR code here..."
            value={scannedResult}
            onChange={handleScanInput}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #2a5298',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
          <small style={{ color: '#999', display: 'block', marginTop: '8px' }}>
            Scanning: Ready to read QR codes
          </small>
        </div>
      )}

      {/* Generate QR Code Mode */}
      {!scanMode && (
        <div>
          <div style={{
            background: '#f5f5f5',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
              Select an item:
            </label>
            <select
              onChange={(e) => {
                const item = items.find(i => i.id === parseInt(e.target.value));
                if (item) handleGenerateQR(item);
              }}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Choose an item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.location} (Qty: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          {generatedCode && selectedItem && (
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0' }}>{selectedItem.name}</h3>
              <div ref={qrRef} style={{ 
                display: 'flex', 
                justifyContent: 'center',
                marginBottom: '20px',
                background: '#f9f9f9',
                padding: '20px',
                borderRadius: '8px'
              }}>
                <QRCode
                  value={`item_id_${selectedItem.id}`}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                <p><strong>Item ID:</strong> {selectedItem.id}</p>
                <p><strong>Location:</strong> {selectedItem.location}</p>
                <p><strong>Available:</strong> {selectedItem.quantity} units</p>
              </div>
              <button
                onClick={downloadQRCode}
                style={{
                  padding: '12px 24px',
                  background: '#2a5298',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                ⬇️ Download QR Code
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#e8f4f8',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#0c2d6b'
      }}>
        <strong>📖 How to use:</strong>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
          <li><strong>Scan Mode:</strong> Use your device camera to scan item QR codes</li>
          <li><strong>Generate Mode:</strong> Create and download QR codes for items</li>
          <li>Scanning automatically initiates borrowing process</li>
          <li>QR codes can be printed and placed on items</li>
        </ul>
      </div>
    </div>
  );
}

export default QRScanner;
