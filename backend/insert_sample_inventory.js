const { Pool } = require('pg');

// PostgreSQL connection configuration
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'admin',
  port: 5432,
  database: 'lost_and_found'
};

// Create a new pool
const pool = new Pool(dbConfig);

// Sample inventory items matching the exact schema
const sampleItems = [
  {
    name: 'Projector',
    quantity: 5,
    date: '2025-11-23',
    location: 'Building A - Room 101',
    photo: null,
    status: 'available',
    description: 'HD 4K Projector for presentations',
    created_by: 1
  },
  {
    name: 'Laptop Stand',
    quantity: 12,
    date: '2025-11-23',
    location: 'Building B - Storage',
    photo: null,
    status: 'available',
    description: 'Adjustable laptop stands',
    created_by: 1
  },
  {
    name: 'Microphone Set',
    quantity: 3,
    date: '2025-11-23',
    location: 'Building C - Audio Room',
    photo: null,
    status: 'available',
    description: 'Professional wireless microphones',
    created_by: 1
  },
  {
    name: 'Camera',
    quantity: 2,
    date: '2025-11-23',
    location: 'Building A - Media Lab',
    photo: null,
    status: 'available',
    description: 'DSLR cameras for events',
    created_by: 1
  },
  {
    name: 'Sound System',
    quantity: 4,
    date: '2025-11-23',
    location: 'Building D - Auditorium',
    photo: null,
    status: 'available',
    description: 'Complete sound system with speakers and mixer',
    created_by: 1
  },
  {
    name: 'Tripod',
    quantity: 8,
    date: '2025-11-23',
    location: 'Building A - Media Lab',
    photo: null,
    status: 'available',
    description: 'Professional camera tripods',
    created_by: 1
  },
  {
    name: 'Whiteboard',
    quantity: 15,
    date: '2025-11-23',
    location: 'Building B - Classroom Section',
    photo: null,
    status: 'available',
    description: 'Interactive digital whiteboards',
    created_by: 1
  },
  {
    name: 'USB-C Hub',
    quantity: 20,
    date: '2025-11-23',
    location: 'Building A - IT Room',
    photo: null,
    status: 'available',
    description: 'Multi-port USB-C hubs for connectivity',
    created_by: 1
  },
  {
    name: 'Portable Charger',
    quantity: 10,
    date: '2025-11-23',
    location: 'Building C - Reception',
    photo: null,
    status: 'available',
    description: '20000mAh portable power banks',
    created_by: 1
  },
  {
    name: 'Extension Cable Reel',
    quantity: 6,
    date: '2025-11-23',
    location: 'Building B - Storage',
    photo: null,
    status: 'available',
    description: '50m extension cable reels',
    created_by: 1
  }
];

async function insertSampleItems() {
  try {
    console.log('Inserting 10 sample inventory items...\n');
    
    for (const item of sampleItems) {
      const result = await pool.query(
        `INSERT INTO items (name, quantity, date, location, photo, status, description, created_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
         RETURNING id, name, quantity;`,
        [item.name, item.quantity, item.date, item.location, item.photo, item.status, item.description, item.created_by]
      );
      
      console.log(`✓ Added: ${result.rows[0].name} (ID: ${result.rows[0].id}, Qty: ${result.rows[0].quantity})`);
    }
    
    console.log('\n✅ All 10 sample items inserted successfully!');
    
  } catch (error) {
    console.error('❌ Error inserting items:', error.message);
  } finally {
    await pool.end();
  }
}

// Execute the function
insertSampleItems();
