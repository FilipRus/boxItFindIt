# BoxIT - QR Code Box Inventory System

A full-stack web application for tracking moving box contents using QR codes. Create boxes, add items with photos, generate QR codes, and scan to view contents without logging in.

## Features

- **User Authentication**: Secure email/password authentication with NextAuth.js
- **Box Management**: Create, edit, and delete boxes with custom labels
- **Item Tracking**: Add items to boxes with:
  - Item name (required)
  - Optional photo upload
  - Optional description
  - Optional category tags
- **QR Code Generation**: Generate unique QR codes for each box
- **Public QR Scanning**: View box contents by scanning QR code (no login required)
- **Search**: Search across all boxes and items
- **Statistics Dashboard**: View total boxes and items count
- **Mobile-Responsive**: Optimized for mobile scanning experience

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM (hosted on Neon)
- **Authentication**: NextAuth.js v5
- **QR Codes**: qrcode library
- **Image Storage**: Cloudinary

## Prerequisites

- Node.js 18+ and npm
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd boxITQRcodeIt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local` and fill in your values:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Seed demo data (optional)**
   ```bash
   npx prisma db seed
   ```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### User
- id (String, Primary Key)
- email (String, Unique)
- password (String, Hashed)
- name (String, Optional)
- boxes (Relation to Box[])

### Box
- id (String, Primary Key)
- name (String)
- qrCode (String, Unique)
- userId (String, Foreign Key)
- items (Relation to Item[])

### Item
- id (String, Primary Key)
- name (String)
- description (String, Optional)
- category (String, Optional)
- imagePath (String, Optional)
- boxId (String, Foreign Key)

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Boxes (Protected)
- `GET /api/boxes` - Get all user's boxes (supports ?search=query)
- `POST /api/boxes` - Create new box
- `GET /api/boxes/[id]` - Get specific box with items
- `PATCH /api/boxes/[id]` - Update box name
- `DELETE /api/boxes/[id]` - Delete box and all items

### Items (Protected)
- `POST /api/boxes/[id]/items` - Add item to box (multipart/form-data)
- `PATCH /api/items/[id]` - Update item (multipart/form-data)
- `DELETE /api/items/[id]` - Delete item

### Public
- `GET /api/public/box/[qrCode]` - Get box contents by QR code (no auth)
- `POST /api/qr` - Generate QR code image

## User Flow

1. **Sign Up/Sign In**: User creates account or logs in
2. **Create Box**: User creates a new box with a name (e.g., "Kitchen Items")
3. **Add Items**: User adds items to the box with optional photos and details
4. **Generate QR Code**: User generates and downloads QR code for the box
5. **Print & Attach**: User prints QR code and attaches to physical box
6. **Scan to View**: Anyone can scan the QR code to see box contents (no login needed)
7. **Manage**: User can edit/delete items and boxes from dashboard

## Deployment

### Vercel (Recommended)

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables:
     - `DATABASE_URL`: Use a hosted database (see below)
     - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
     - `NEXTAUTH_URL`: Your production URL (e.g., `https://your-app.vercel.app`)

3. **Database**
   - Uses [Neon](https://neon.tech) PostgreSQL
   - Set `DATABASE_URL` in Vercel environment variables
   - Run migrations: `npx prisma migrate deploy`

4. **Image Storage**
   - Uses Cloudinary for image uploads
   - Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in Vercel environment variables

### Other Platforms

#### Railway
1. Create new project on [Railway](https://railway.app)
2. Add PostgreSQL database
3. Set environment variables
4. Deploy from GitHub

#### DigitalOcean App Platform
1. Create new app
2. Connect GitHub repository
3. Add managed PostgreSQL database
4. Configure environment variables

## Project Structure

```
boxITQRcodeIt/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── boxes/        # Box CRUD operations
│   │   ├── items/        # Item CRUD operations
│   │   ├── public/       # Public endpoints (no auth)
│   │   └── qr/           # QR code generation
│   ├── auth/             # Auth pages (signin/signup)
│   ├── box/              # Public box view (QR scan)
│   ├── dashboard/        # Protected user dashboard
│   │   └── box/[id]/     # Box detail page
│   └── page.tsx          # Landing page
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client singleton
├── prisma/
│   └── schema.prisma     # Database schema
├── public/
│   └── uploads/          # Uploaded item images
└── types/
    └── next-auth.d.ts    # NextAuth type definitions
```

## Common Development Tasks

### Reset Database
```bash
npx prisma migrate reset
```

### View Database
```bash
npx prisma studio
```

### Add New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Update Prisma Client
```bash
npx prisma generate
```

### Build for Production
```bash
npm run build
npm start
```

## Security Considerations

1. **Passwords**: Hashed using bcrypt (10 rounds)
2. **Authentication**: JWT-based sessions with NextAuth.js
3. **Authorization**: Middleware protects dashboard routes
4. **Input Validation**: Required fields validated on both client and server
5. **File Uploads**: Accept only image files
6. **Environment Variables**: Never commit `.env` to version control

## Future Enhancements

- [ ] Bulk item import via CSV
- [ ] Box templates for common categories
- [ ] Share boxes with other users
- [ ] Mark items as "retrieved"
- [ ] Export inventory to PDF
- [ ] Multiple photos per item
- [ ] Barcode support
- [ ] Mobile app (React Native)

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
