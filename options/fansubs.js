module.exports = {
	horrible: { name: 'HorribleSubs', qualities: { '480': '[480p]', '720': '[720p]', '1080': '[1080p]' }, 
		formatName:	function(anime, episode, quality) {
			let resultQuery = '';

			if (anime) resultQuery += `"${anime}"`;
			if (episode) resultQuery += `" - ${episode}"`;
			if (quality) resultQuery += `"${this.qualities[quality]}"`;

			return resultQuery.split('undefined').join('');
		},
		splitName: function(fullName) {
			let anime = fullName.split('] ')[1].split(' - ');
			let episode = anime.pop().split(' [')[0];
			anime = anime.join(' - ');
			return { anime, episode };
		}
	},
	commie: { name: 'Commie', qualities: {  }, 
		formatName:	function(anime, episode) {
			let resultQuery = '';

			if (anime) resultQuery += `"${anime}"`;
			if (episode) resultQuery += `" - ${episode}"`;

			return resultQuery.split('undefined').join('');
		},
		splitName: function(fullName) {
			let anime = fullName.split('] ')[1].split(' - ');
			let episode = anime.pop().split(' [')[0];
			anime = anime.join(' - ');
			return { anime, episode };
		}
	},
	eternal: { name: 'EternalAnimes', qualities: { '720': '[1280x720]', '1080': '[1920x1080]' }, 
		formatName:	function(anime, episode, quality) {
			let resultQuery = '';

			if (anime) resultQuery += `"${anime.split(' ').join('_')}"`;
			if (episode) resultQuery += `"_${episode}_"`;
			if (quality) resultQuery += `"${this.qualities[quality]}"`;

			return resultQuery.split('undefined').join('');
		},
		splitName: function(fullName) {
			let animePlusEpisode = fullName.split(']')[1].split('_[')[0].split('_');
			let episode = animePlusEpisode.pop();
			let anime = animePlusEpisode.join('_');
			return { anime, episode };
		}
	}
};