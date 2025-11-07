# Annual Meeting Documents Feature

## Overview
This feature allows administrators to upload and manage documents related to annual shareholder meetings. Documents are organized by year and displayed on a public-facing page accessible to all visitors.

## Features

### For Administrators
- Upload PDF documents with title, description, and year
- Organize documents by display order
- Activate/deactivate documents
- Delete documents (including from Cloudinary)
- View all documents grouped by year

### For Public Visitors
- Browse annual meeting documents organized by year
- View documents inline or download them
- See document metadata (size, upload date, description)
- Responsive, professional design matching existing site style

## Files Created

### Backend
1. **`models/AnnualMeetingDocument.js`** - Mongoose model with schema validation
2. **`controllers/annualMeetingController.js`** - Business logic for CRUD operations
3. **`routes/annualMeetingRoutes.js`** - API endpoints (protected and public)

### Frontend
4. **`public/admin/annual-meeting-documents.html`** - Admin management interface
5. **`public/annual-meeting.html`** - Public-facing documents page

### Configuration
6. **`server.js`** - Updated to include new routes

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/annual-meeting-documents` | Get all documents (with optional filters) |
| GET | `/api/annual-meeting-documents/by-year` | Get documents grouped by year |
| GET | `/api/annual-meeting-documents/years` | Get list of available years |
| GET | `/api/annual-meeting-documents/:id` | Get single document by ID |

### Admin Endpoints (Authentication Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/annual-meeting-documents` | Upload new document |
| PUT | `/api/annual-meeting-documents/:id` | Update document metadata |
| DELETE | `/api/annual-meeting-documents/:id` | Delete document |

## Database Schema

```javascript
{
  title: String (required, max 200 chars),
  description: String (optional, max 500 chars),
  year: Number (required, 2000-2100),
  fileName: String (required),
  fileUrl: String (required),
  fileSize: Number (required),
  public_id: String (Cloudinary ID),
  displayOrder: Number (default 0),
  isActive: Boolean (default true),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## Usage Instructions

### For Administrators

#### Accessing the Admin Page
1. Log in to admin dashboard
2. Click "Annual Meeting Docs" in the sidebar
3. You'll be redirected to `/admin/annual-meeting-documents.html`

#### Uploading Documents
1. Fill in the upload form:
   - **Document Title**: e.g., "Notice of 2024 Annual Meeting"
   - **Meeting Year**: e.g., 2024
   - **Description** (optional): Brief description of the document
   - **Display Order** (optional): Lower numbers appear first (default: 0)
   - **PDF File**: Select PDF file (max 10MB)
2. Click "Upload Document"
3. Document will be uploaded to Cloudinary and saved to database
4. Document appears in the list below grouped by year

#### Managing Documents
- **Activate/Deactivate**: Click button to toggle visibility on public page
- **Delete**: Permanently removes document from database and Cloudinary
- All actions require confirmation

### For Public Visitors

#### Accessing the Page
- Navigate to **Investors > Annual Meeting** in the main menu
- Or go directly to `/annual-meeting.html`

#### Viewing Documents
- Documents are organized by year (most recent first)
- Each document shows:
  - Title with PDF icon
  - Description (if provided)
  - Upload date and file size
  - View and Download buttons
- Click "View Document" to open in new tab
- Click "Download" to save to computer

## Features & Benefits

### Reusable Structure
- Easy to add documents for new years
- Consistent formatting year after year
- No code changes needed for annual updates

### Professional Presentation
- Clean, modern design matching site aesthetics
- Responsive layout works on all devices
- Clear organization by year
- Document metadata clearly displayed

### Easy Management
- Simple admin interface
- Drag-and-drop file upload
- Immediate visibility of changes
- Safe deletion with confirmation

## Security

### Authentication
- All admin operations require JWT token
- Only users with admin role can manage documents
- Public viewing requires no authentication

### File Upload
- PDF files only (validated)
- 10MB maximum file size
- Stored securely on Cloudinary
- Automatic cleanup on deletion

### Rate Limiting
- API calls subject to rate limits
- Prevents abuse and DoS attacks

## Navigation Updates

### Main Navigation
The public page is accessible via:
- Main menu: **Investors > Annual Meeting**
- Footer links
- Direct URL: `/annual-meeting.html`

### Admin Dashboard
New sidebar link: "Annual Meeting Docs"
- Positioned after "Post Financial Statements"
- Redirects to admin management page

## Styling

### Design Consistency
- Matches existing Loyalist Exploration branding
- Uses same color scheme (#1e3a8a, #3b82f6, #D4B248)
- Consistent typography with Inter font
- Same header/footer as other pages

### Responsive Design
- Mobile-friendly layout
- Grid adapts to screen size
- Touch-friendly buttons
- Readable on all devices

## Testing Checklist

### Backend Testing
- [ ] Upload PDF document
- [ ] Verify file stored in Cloudinary
- [ ] Verify document saved in MongoDB
- [ ] View document on public page
- [ ] Update document metadata
- [ ] Activate/deactivate document
- [ ] Delete document
- [ ] Verify Cloudinary cleanup on delete
- [ ] Test authentication on admin endpoints
- [ ] Test public endpoints without auth

### Frontend Testing
- [ ] Admin page loads correctly
- [ ] Upload form works properly
- [ ] Documents list displays correctly
- [ ] Activate/deactivate toggle works
- [ ] Delete confirmation appears
- [ ] Public page loads correctly
- [ ] Documents grouped by year
- [ ] View button opens PDF in new tab
- [ ] Download button works
- [ ] Mobile responsive design

### Security Testing
- [ ] Admin pages require authentication
- [ ] Non-admin users cannot access admin pages
- [ ] Public pages accessible without auth
- [ ] File type validation works
- [ ] File size limits enforced
- [ ] Rate limiting active

## Troubleshooting

### Upload Fails
**Check:**
- File is PDF format
- File size under 10MB
- Cloudinary credentials correct in `.env`
- JWT token valid and user is admin

### Documents Not Appearing
**Check:**
- Document `isActive` is set to `true`
- Browser cache cleared
- API endpoint returning data
- No JavaScript console errors

### Cloudinary Issues
**Check:**
- `CLOUDINARY_CLOUD_NAME` correct
- `CLOUDINARY_API_KEY` correct
- `CLOUDINARY_API_SECRET` correct
- Cloudinary storage quota not exceeded

## Future Enhancements

### Potential Improvements
1. **Document Categories**: Group by document type (notice, proxy, minutes)
2. **Search Functionality**: Search documents by title or description
3. **Email Notifications**: Alert shareholders when new documents posted
4. **Archive Feature**: Archive old meetings automatically
5. **Version History**: Track document revisions
6. **Batch Upload**: Upload multiple documents at once
7. **Preview Generation**: Generate PDF thumbnails
8. **Download Statistics**: Track document download counts

## Maintenance

### Annual Updates
1. Log in to admin dashboard
2. Navigate to Annual Meeting Docs
3. Upload new year's documents
4. Set appropriate display order
5. Activate documents
6. Optionally deactivate very old documents

### Storage Management
- Monitor Cloudinary storage usage
- Archive or delete outdated documents
- Consider storage plan upgrades if needed

## Support

### Admin Questions
Contact your development team or refer to this documentation.

### Technical Issues
Check:
1. Browser console for errors
2. Network tab for failed requests
3. Server logs for backend errors
4. `.env` file for correct credentials

---

## Quick Start Guide

### First Time Setup
1. Ensure server is running: `npm start`
2. Log in as admin
3. Navigate to "Annual Meeting Docs"
4. Upload your first document
5. Visit `/annual-meeting.html` to see it live

### Adding Documents for New Year
1. Log in to admin
2. Go to Annual Meeting Docs
3. Fill form with new year (e.g., 2025)
4. Upload PDF documents
5. Documents automatically grouped by year

That's it! The feature is designed to be self-explanatory and require minimal technical knowledge for day-to-day use.
