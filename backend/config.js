// Centralized configuration for backend

module.exports = {
  skills: [
    'Python', 'JavaScript', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'PHP', 'Swift', 'Kotlin',
    'SQL', 'HTML', 'CSS', 'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask', 'Spring',
    'Machine Learning', 'Data Science', 'DevOps', 'UI/UX', 'Project Management', 'Other'
  ],
  locations: [
    'Remote', 'Onsite', 'Hybrid', 'New York', 'San Francisco', 'London', 'Berlin', 'Bangalore', 'Tokyo', 'Sydney', 'Other'
  ],
  availabilityPatterns: [
    'Weekdays', 'Weekends', 'Evenings', 'Mornings', 'Flexible', 'Other'
  ],
  swapStatus: ['pending', 'accepted', 'rejected', 'completed'],
  userRoles: ['user', 'admin'],
  defaultUserRole: 'user',
  defaultAdminRole: 'admin',
  defaultRating: 4.0,
  defaultTotalRatings: 0,
  pagination: {
    usersPerPage: 10,
    swapsPerPage: 10
  },
  messageTypes: ['info', 'warning', 'error', 'success'],
};
