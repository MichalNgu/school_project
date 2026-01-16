# 🚗 Audi Backend Server

A production-ready Node.js + Express backend for the Audi car dealership website.

## Features

✅ **Security**
- CORS protection
- Helmet.js for secure HTTP headers
- Rate limiting (100 req/15min general, 50 req/15min for API)
- Request size limiting
- Input validation and sanitization

✅ **API Endpoints**
- Car models management
- Test drive bookings
- Contact form submissions
- Newsletter subscriptions
- Analytics tracking
- Health checks

✅ **Database**
- JSON-based database (can be upgraded to MongoDB)
- Automatic data persistence
- Analytics tracking
- Timestamped records

✅ **Logging & Monitoring**
- Morgan HTTP logging
- Custom request logger
- Error tracking
- Graceful shutdown handling

✅ **Developer Experience**
- Environment variables support (.env)
- Modular code structure
- Comprehensive error handling
- Development and production modes

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configuration

Create a `.env` file in the `server` directory:

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

### 3. Start the Server

**Development Mode:**
```bash
npm start
```

**Watch Mode (auto-restart):**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Get All Cars
```
GET /api/cars
```

**Response:**
```json
[
  {
    "name": "Audi A3",
    "desc": "Kompaktní prémiový sedan...",
    "price": "od 799 000 Kč",
    "img": "/Web_project/img/audia3.jpeg"
  }
]
```

---

#### 2. Book a Test Drive
```
POST /api/testdrive
```

**Request Body:**
```json
{
  "name": "Jan Novák",
  "email": "jan@example.cz",
  "phone": "+420 123 456 789",
  "model": "Audi A4",
  "date": "2025-01-15",
  "message": "Interested in test drive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test drive request created successfully",
  "id": "1702681234567-abc123def"
}
```

**Status Codes:**
- `201`: Test drive created successfully
- `400`: Validation error (missing/invalid fields)
- `500`: Server error

---

#### 3. Send Contact Message
```
POST /api/contact
```

**Request Body:**
```json
{
  "name": "Jan Novák",
  "email": "jan@example.cz",
  "phone": "+420 123 456 789",
  "model": "Audi Q5",
  "message": "Máme zájem o vaši nabídku"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact message sent successfully",
  "id": "1702681234567-xyz789abc"
}
```

---

#### 4. Subscribe to Newsletter
```
POST /api/newsletter
```

**Request Body:**
```json
{
  "email": "user@example.cz"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter"
}
```

---

#### 5. Get Analytics (Admin)
```
GET /api/analytics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pageViews": 150,
    "totalTestDrives": 5,
    "totalContacts": 8,
    "totalNewsletter": 3,
    "visitorsCount": 42,
    "lastUpdated": "2025-12-03T10:30:00.000Z"
  }
}
```

---

#### 6. Get All Test Drives (Admin)
```
GET /api/testdrive?limit=10
```

**Query Parameters:**
- `limit` (optional): Maximum number of records to return

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "1702681234567-abc123def",
      "name": "Jan Novák",
      "email": "jan@example.cz",
      "phone": "+420 123 456 789",
      "model": "Audi A4",
      "date": "2025-01-15",
      "message": "Interested in test drive",
      "createdAt": "2025-12-03T10:15:30.000Z",
      "status": "pending"
    }
  ]
}
```

---

#### 7. Get All Contacts (Admin)
```
GET /api/contact?limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": "1702681234567-xyz789abc",
      "name": "Jan Novák",
      "email": "jan@example.cz",
      "phone": "+420 123 456 789",
      "model": "Audi Q5",
      "message": "Máme zájem o vaši nabídku",
      "createdAt": "2025-12-03T10:20:15.000Z",
      "status": "new",
      "read": false
    }
  ]
}
```

---

#### 8. Server Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2025-12-03T10:30:45.000Z",
  "uptime": 245.356
}
```

## Database Schema

### Test Drives
```json
{
  "id": "1702681234567-abc123def",
  "name": "string",
  "email": "string",
  "phone": "string",
  "model": "string",
  "date": "string|null",
  "message": "string",
  "createdAt": "ISO8601 timestamp",
  "status": "pending|confirmed|completed|cancelled"
}
```

### Contacts
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "model": "string",
  "message": "string",
  "createdAt": "ISO8601 timestamp",
  "status": "new|read|responded",
  "read": "boolean"
}
```

### Newsletter
```json
{
  "id": "string",
  "email": "string",
  "subscribedAt": "ISO8601 timestamp",
  "active": "boolean"
}
```

### Analytics
```json
{
  "pageViews": "number",
  "totalTestDrives": "number",
  "totalContacts": "number",
  "totalNewsletter": "number",
  "visitorsCount": "number",
  "lastUpdated": "ISO8601 timestamp"
}
```

## Validation Rules

### Email
- Valid email format (username@domain.ext)

### Phone
- At least 9 digits/characters
- Can contain +, -, (, ) characters

### Name
- 3-100 characters
- Cannot be empty

### Message
- 5-5000 characters
- Cannot be empty

## Error Handling

### Common Error Responses

**400 - Bad Request (Validation Error)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Invalid email",
    "Invalid phone"
  ]
}
```

**404 - Not Found**
```json
{
  "success": false,
  "message": "Endpoint not found",
  "path": "/api/nonexistent"
}
```

**500 - Internal Server Error**
```json
{
  "success": false,
  "message": "Server error"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General requests**: 100 per 15 minutes per IP
- **API endpoints**: 50 per 15 minutes per IP
- **Static files**: Not rate limited

When rate limit is exceeded, you'll receive:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

## File Structure

```
server/
├── server.js              # Main server file
├── package.json           # Dependencies
├── database.json          # Data storage
├── .env.example          # Environment variables template
│
├── routes/
│   └── api.js            # All API endpoints
│
├── middleware/
│   └── index.js          # CORS, logging, error handling
│
└── utils/
    ├── database.js       # Database operations
    └── validation.js     # Input validation & sanitization
```

## Environment Variables

```env
NODE_ENV=development      # development | production
PORT=3000                 # Server port
LOG_LEVEL=info           # Log level (optional)
```

## Security Features

1. **Helmet.js**: Sets secure HTTP headers
2. **CORS**: Configurable cross-origin requests
3. **Rate Limiting**: Prevents API abuse
4. **Input Validation**: Sanitizes all inputs
5. **Request Size Limiting**: Prevents large payloads
6. **Error Handling**: Hides sensitive information in production

## Deployment

### Prerequisites
- Node.js 14+
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with production settings
   ```

4. **Start the server**
   ```bash
   NODE_ENV=production npm start
   ```

### Production Recommendations

- Use a process manager like PM2 or Docker
- Enable HTTPS
- Configure environment variables
- Set up monitoring and logging
- Use a reverse proxy (nginx)
- Enable database backups

## Troubleshooting

### Port Already in Use
```bash
# Change the port in .env or use:
PORT=4000 npm start
```

### CORS Errors
- Check the origin in `middleware/index.js`
- Ensure frontend URL is in `allowedOrigins`

### Database Issues
- Check database.json exists in server/
- Verify write permissions on the directory

### Rate Limiting
- Check `Express-RateLimit-*` headers in response
- Wait 15 minutes for limit to reset

## Future Enhancements

- [ ] MongoDB integration
- [ ] User authentication & JWT
- [ ] Email notifications
- [ ] Admin dashboard API
- [ ] Advanced analytics
- [ ] Image upload management
- [ ] Caching layer (Redis)
- [ ] Search functionality
- [ ] API documentation (Swagger)

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is part of a school assignment.

## Support

For issues or questions, contact the development team.

---

**Last Updated**: December 3, 2025
**Version**: 1.0.0
