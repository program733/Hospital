# Hospital Management System - Medicine Enhancement TODO

## Backend Changes
- [x] Update Medicine model in models.py: add batch_number, manufacture_date, low_stock_threshold, category, supplier
- [x] Update Medicine Pydantic models in main.py for new fields
- [x] Add new endpoints: /medicines/low-stock, /medicines/expiring-soon, /medicines/batches

## Frontend Changes
- [x] Update Medicines.js form to include new fields (batch, threshold, category, supplier)
- [x] Add alerts section showing low stock and expiring medicines
- [x] Update table to display new fields and highlight alerts
- [x] Add filtering by category and batch

## Testing
- [x] Test inventory alerts and batch tracking
- [x] Verify low stock and expiry notifications
- [x] Test new filtering and search capabilities
