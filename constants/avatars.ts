// Avatar options for guest reviewers
export const GUEST_AVATARS = [
    {
        id: 'avatar-1',
        name: 'Happy Kid',
        emoji: '😊',
        color: '#FF6B6B'
    },
    {
        id: 'avatar-2',
        name: 'Bookworm',
        emoji: '📚',
        color: '#4ECDC4'
    },
    {
        id: 'avatar-3',
        name: 'Dreamer',
        emoji: '🌟',
        color: '#FFE66D'
    },
    {
        id: 'avatar-4',
        name: 'Explorer',
        emoji: '🧭',
        color: '#95E1D3'
    },
    {
        id: 'avatar-5',
        name: 'Artist',
        emoji: '🎨',
        color: '#F38181'
    },
    {
        id: 'avatar-6',
        name: 'Scientist',
        emoji: '🔬',
        color: '#AA96DA'
    },
    {
        id: 'avatar-7',
        name: 'Musician',
        emoji: '🎵',
        color: '#FCBAD3'
    },
    {
        id: 'avatar-8',
        name: 'Athlete',
        emoji: '⚽',
        color: '#A8D8EA'
    },
    {
        id: 'avatar-9',
        name: 'Chef',
        emoji: '👨‍🍳',
        color: '#FFD93D'
    },
    {
        id: 'avatar-10',
        name: 'Astronaut',
        emoji: '🚀',
        color: '#6BCB77'
    },
    {
        id: 'avatar-11',
        name: 'Princess',
        emoji: '👸',
        color: '#FFB6C1'
    },
    {
        id: 'avatar-12',
        name: 'Dragon',
        emoji: '🐉',
        color: '#9B59B6'
    }
];

export const getAvatarData = (avatarId: string) => {
    return GUEST_AVATARS.find(a => a.id === avatarId) || GUEST_AVATARS[0];
};
