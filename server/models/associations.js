const User = require('./User');
const Story = require('./Story');
const UserStory = require('./UserStory');
const Category = require('./Category');
const Tag = require('./Tag');
const Subscriber = require('./Subscriber');
const Design = require('./Design');
const Notification = require('./Notification');
const Setting = require('./Setting');
const PageVisit = require('./PageVisit');
const VisitorInfo = require('./VisitorInfo');
const SocialShare = require('./SocialShare');
const Review = require('./Review');
const Favorite = require('./Favorite');

// User <-> Story Many-to-Many via UserStory (Favorites & History)
User.belongsToMany(Story, { through: UserStory, as: 'Stories' });
Story.belongsToMany(User, { through: UserStory, as: 'Users' });

// User <-> Story (Favorites)
User.hasMany(Favorite, { foreignKey: 'userId', as: 'Favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId' });

Story.hasMany(Favorite, { foreignKey: 'storyId', as: 'Favorites' });
Favorite.belongsTo(Story, { foreignKey: 'storyId' });

// User <-> Design (One-to-Many)
User.hasMany(Design, { foreignKey: 'userId', as: 'Designs' });
Design.belongsTo(User, { foreignKey: 'userId' });

// We can also define one-to-many if we need to query the join table directly
User.hasMany(UserStory);
UserStory.belongsTo(User);
Story.hasMany(UserStory);
UserStory.belongsTo(Story);

// User - Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'Notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Analytics Associations
User.hasMany(PageVisit, { foreignKey: 'userId', as: 'PageVisits' });
PageVisit.belongsTo(User, { foreignKey: 'userId' });

Story.hasMany(PageVisit, { foreignKey: 'storyId', as: 'PageVisits' });
PageVisit.belongsTo(Story, { foreignKey: 'storyId' });

Story.hasMany(SocialShare, { foreignKey: 'storyId', as: 'SocialShares' });
SocialShare.belongsTo(Story, { foreignKey: 'storyId' });

User.hasMany(SocialShare, { foreignKey: 'userId', as: 'SocialShares' });
SocialShare.belongsTo(User, { foreignKey: 'userId' });

// Reviews Associations
User.hasMany(Review, { foreignKey: 'userId', as: 'Reviews' });
Review.belongsTo(User, { foreignKey: 'userId' });

Story.hasMany(Review, { foreignKey: 'storyId', as: 'Reviews' });
Review.belongsTo(Story, { foreignKey: 'storyId' });

console.log('--- Database Associations Established (Including Analytics & Reviews) ---');

module.exports = {
    User,
    Story,
    UserStory,
    Category,
    Tag,
    Subscriber,
    Design,
    Notification,
    Setting,
    PageVisit,
    VisitorInfo,
    SocialShare,
    SocialShare,
    Review,
    Favorite
};
