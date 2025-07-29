## __Problem Statement:__ _Skill Swap Platform_
Develop a Skill Swap Platform — a mini application that enables users to list their skills and
request others in return

## Live Demo

You can access the hosted website here:

👉 [Skill Share Odoo on Vercel](https://skill-share-odoo-lcrc.vercel.app/browse)

---


## Description
A MERN stack application that enables users to list their skills and request others in return. Users can browse profiles, propose skill swaps, accept/reject requests, and rate completed exchanges.

## Features

### User Features
- **User Registration & Authentication**: Secure signup/login with JWT tokens
- **Profile Management**: Update personal info, skills, availability, and profile photo
- **Skill Listing**: Add/remove skills you can offer and skills you want to learn
- **User Discovery**: Browse and search users by skills or location
- **Skill Swap Requests**: Propose swaps with other users
- **Swap Management**: Accept, reject, or cancel swap requests
- **Rating System**: Rate completed swaps and view user ratings
- **Privacy Control**: Make profiles public or private

### Admin Features
- **User Management**: View all users, ban/unban accounts
- **Platform Monitoring**: View swap statistics and user activity
- **Message System**: Send platform-wide announcements
- **Reports**: Generate user activity and swap statistics reports

## Tech Stack

- **Frontend**: React.js, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Upload**: Multer for profile photo uploads
- **Validation**: Express-validator for input validation

## 🔗 Google Drive

[Coming Soon]()


## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
   - Copy `config.env` and update with your MongoDB URI and JWT secret
   - For local MongoDB: `MONGODB_URI=mongodb://localhost:27017/skillswap`
   - For MongoDB Atlas: Use your connection string

4. Start the server:
```bash
npm start
# or for development
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Quick Start (Both Frontend & Backend)

From the root directory:
```bash
# Install all dependencies
npm run install-all

# Start both servers
npm start
```

## Database Models

### User
- Basic info (name, email, password, location, profile photo)
- Skills offered and wanted arrays
- Availability settings
- Public/private profile setting
- Role (user/admin)
- Ban status
- Rating system

### Swap
- Requester and recipient references
- Skills being exchanged
- Status (pending, accepted, rejected, cancelled, completed)
- Optional message
- Rating system for both parties
- Timestamps


## Key Features Implementation

### Authentication & Authorization
- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes with middleware
- Admin role verification

### File Upload
- Profile photo upload with Multer
- Image validation and size limits
- Static file serving

### Real-time Updates
- Automatic data refresh after actions
- Optimistic UI updates
- Error handling and user feedback

### Responsive Design
- Mobile-friendly interface
- CSS Grid and Flexbox layouts
- Modern, clean UI design

## Usage Examples

### Creating an Account
1. Navigate to `/register`
2. Fill in name, email, password, and optional location
3. Click "Create Account"

### Adding Skills
1. Go to your profile page
2. Add skills you can offer in the "Skills I Can Offer" section
3. Add skills you want to learn in the "Skills I Want to Learn" section

### Proposing a Swap
1. Browse users or search by skill
2. Click on a user's profile
3. Click "Propose Swap"
4. Select the skill you'll offer and the skill you want to learn
5. Add an optional message
6. Submit the request

### Managing Swaps
1. Go to "My Swaps" to see all your swap requests
2. Accept or reject incoming requests
3. Cancel pending requests you've sent
4. Mark accepted swaps as completed
5. Rate completed swaps

## Admin Functions

### User Management
- View all registered users
- Ban/unban users for policy violations
- Monitor user activity

### Platform Monitoring
- View real-time statistics
- Monitor swap completion rates
- Track user growth

### Communication
- Send platform-wide messages
- Create different message types (info, warning, alert, update)
- Manage message visibility

## Future Enhancements

- Real-time messaging between users
- Video call integration for skill exchanges
- Advanced search and filtering
- Skill verification system
- Payment integration for premium features
- Mobile app development
- Email notifications
- Social media integration
<!-- 
## Contributing

This is a college-level intermediate project. Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This project is created for educational purposes.

## Support

For questions or issues, please check the code comments or create an issue in the repository.  -->
