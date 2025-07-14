const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // <-- Add this line
require('dotenv').config();

// First 15 skills from the skills list
const SKILLS = [
  'Java',
  'C++',
  'Python',
  'JavaScript',
  'HTML',
  'CSS',
  'SQL',
  'Excel',
  'Photoshop',
  'React',
  'Node.js',
  'Public Speaking',
  'Writing',
  'Project Management',
  'Data Analysis'
];

// Sample locations
const LOCATIONS = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
  'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington'
];

// Sample availability patterns
const AVAILABILITY_PATTERNS = [
  { weekdays: true, weekends: false, evenings: true, mornings: false },
  { weekdays: false, weekends: true, evenings: false, mornings: true },
  { weekdays: true, weekends: true, evenings: true, mornings: false },
  { weekdays: true, weekends: false, evenings: false, mornings: true },
  { weekdays: false, weekends: true, evenings: true, mornings: true }
];

// Function to get random items from an array
const getRandomItems = (array, min, max) => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Function to generate random rating
const getRandomRating = () => {
  return Math.round((Math.random() * 0.7 + 3.5) * 10) / 10; // Between 3.5 and 4.2
};

// Function to get random profile photo URL
const getRandomProfilePhoto = () => {
  // Using Picsum for random placeholder images
  const width = 400;
  const height = 400;
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/${width}/${height}?random=${randomId}`;
};

// Function to create dummy users
const createDummyUsers = async () => {
  try {
    // Debug: Check environment variables
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('Current directory:', process.cwd());

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing dummy users (optional - comment out if you want to keep existing ones)
    await User.deleteMany({ email: { $regex: /^demo\d+@gmail\.com$/ } });
    console.log('Cleared existing dummy users');

    const dummyUsers = [];

    // Create 25 dummy users
    for (let i = 1; i <= 25; i++) {
      const skillsOffered = getRandomItems(SKILLS, 2, 5);
      const skillsWanted = getRandomItems(SKILLS.filter(skill => !skillsOffered.includes(skill)), 2, 4);
      const availability = AVAILABILITY_PATTERNS[Math.floor(Math.random() * AVAILABILITY_PATTERNS.length)];

      const dummyUser = {
        name: `Demo${i}`,
        email: `demo${i}@gmail.com`,
        password: '12345678', // Will be hashed by the User model
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        profilePhoto: getRandomProfilePhoto(), // Add random profile photo
        skillsOffered,
        skillsWanted,
        availability,
        isPublic: true,
        rating: getRandomRating(),
        totalRatings: Math.floor(Math.random() * 10),
        role: 'user'
      };

      dummyUsers.push(dummyUser);
    }

    // Insert all dummy users
    // Hash passwords before insertMany
    for (const user of dummyUsers) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    const result = await User.insertMany(dummyUsers);
    console.log(`✅ Successfully created ${result.length} dummy users!`);

    // Display summary
    console.log('\n📊 Summary:');
    console.log(`Total users created: ${result.length}`);

    // Show some sample users
    console.log('\n👥 Sample users created:');
    result.slice(0, 5).forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Skills offered: ${user.skillsOffered.join(', ')}`);
      console.log(`  Skills wanted: ${user.skillsWanted.join(', ')}`);
      console.log(`  Location: ${user.location}`);
      console.log(`  Rating: ${user.rating}`);
      console.log('');
    });

    console.log('🎉 Dummy users script completed successfully!');
    console.log('You can now test the application with these users.');
    console.log('All users have password: 12345678');

  } catch (error) {
    console.error('❌ Error creating dummy users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createDummyUsers();
