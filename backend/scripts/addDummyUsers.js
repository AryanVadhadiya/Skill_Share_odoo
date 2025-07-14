const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // <-- Add this line
const config = require('../config');
require('dotenv').config();

const DUMMY_USER_PASSWORD = process.env.DUMMY_USER_PASSWORD || 'changeme';
const DUMMY_USER_COUNT = parseInt(process.env.DUMMY_USER_COUNT, 10) || 10;
const DUMMY_PROFILE_PHOTO_BASE = process.env.DUMMY_PROFILE_PHOTO_BASE || 'https://randomuser.me/api/portraits/';

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
    for (let i = 1; i <= DUMMY_USER_COUNT; i++) {
      const skillsOffered = getRandomItems(config.skills, 2, 5);
      const skillsWanted = getRandomItems(config.skills.filter(skill => !skillsOffered.includes(skill)), 2, 4);
      const availability = config.availabilityPatterns[Math.floor(Math.random() * config.availabilityPatterns.length)];

      const dummyUser = {
        name: `Demo${i}`,
        email: `demo${i}@gmail.com`,
        password: DUMMY_USER_PASSWORD, // Will be hashed by the User model
        location: config.locations[Math.floor(Math.random() * config.locations.length)],
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
