const StoredRepo = require('../models/StoredRepo');

const getUserRepos = async (req, res) => {
    try {
        const repos = await StoredRepo.find({ UserId: req.user.id })
            .sort({ UpdatedAt: -1 })
            .lean();

        const totalReadmes = repos.filter((repo) => {
            return typeof repo.Readme === 'string' && repo.Readme.trim() !== '';
        }).length;

        const totalRepos = repos.length;
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const thisWeekCount = repos.filter((repo) => {
            return new Date(repo.UpdatedAt) >= oneWeekAgo;
        }).length;

        res.status(200).json({
            repos,
            stats: {
                totalReadmes,
                totalRepos,
                thisWeekCount,
            },
        });
    } catch (error) {
        console.error('[getUserRepos] error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getUserRepos };
