# Add Sample Inventory Items

To add 10 sample items to your inventory database, run:

```bash
cd backend
node insert_sample_inventory.js
```

## Sample Items Being Added:

1. **Projector** - 5 units
   - Location: Building A - Room 101
   - Epson EB-2250U 3LCD Projector with remote

2. **Laptop Stand** - 12 units
   - Location: Building B - Storage
   - Adjustable aluminum laptop stand

3. **Microphone Set** - 3 units
   - Location: Building C - Audio Room
   - Shure SM7B Microphone with cable and stand

4. **Camera** - 2 units
   - Location: Building A - Media Lab
   - Canon EOS R5 Digital Camera with 24-105mm lens

5. **Sound System** - 4 units
   - Location: Building D - Auditorium
   - Bose Professional PA System with speakers and amplifier

6. **Tripod** - 8 units
   - Location: Building A - Media Lab
   - Professional video tripod with pan head

7. **Whiteboard** - 15 units
   - Location: Building B - Classroom Section
   - 4x6 Magnetic whiteboard with dry erase markers

8. **USB-C Hub** - 20 units
   - Location: Building A - IT Room
   - 7-in-1 USB-C Hub with HDMI, USB 3.0, and card reader

9. **Portable Charger** - 10 units
   - Location: Building C - Reception
   - 20000mAh Portable Power Bank with fast charging

10. **Extension Cable Reel** - 6 units
    - Location: Building B - Storage
    - 50ft Heavy Duty Extension Cord Reel

## What This Does:

- Inserts 10 realistic inventory items into the `items` table
- Each item has:
  - Name
  - Quantity (realistic stock levels)
  - Location (various buildings and rooms)
  - Category (Equipment, Accessories, Audio, etc.)
  - Description (detailed specifications)
  - Date (automatically set to current date/time)

## Prerequisites:

- Backend server must be stopped
- PostgreSQL database must be running
- Database credentials must match in the script

After running, you can refresh your application and see these items in the inventory system!
