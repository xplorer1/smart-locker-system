# SecureBox Backend

Node.js/Express backend for managing locker assignments and authenticating student access for the SmartLock Pro system.

## Setup
1. Install Node.js (v16+).
2. Clone the repository and navigate to the project folder.
3. Run npm install to install dependencies.
4. Start the server with npm start.

## API Endpoints
### Admin Routes (Requires JWT)
- POST /api/admin/login: Admin login to get JWT.
- POST /api/admin/assign: Assign a locker to a student.
- POST /api/admin/reclaim: Reclaim a locker.
- GET /api/admin/lockers: List all lockers.
- GET /api/admin/students: List all students.

### Authentication Routes
- POST /api/auth/verify: Verify student credentials from microcontroller.

## Microcontroller Integration
- Send HTTP POST requests to /api/auth/verify with JSON body: { "studentId": "S001", "pin": "1234", "lockerId": 1 }.
- Use HTTPS in production for security.

## Notes
- Replace JWT_SECRET with a secure key in production.
- Consider using a database (e.g., MongoDB) for persistent storage.