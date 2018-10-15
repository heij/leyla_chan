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
		formatName:	function(anime, episode, quality) {
			return `"${anime} - ${episode}"`
		},
		splitName: function(fullName) {
			let anime = fullName.split('] ')[1].split(' - ');
			let episode = anime.pop().split(' [')[0];
			anime = anime.join(' - ');
			return { anime, episode };
		}
	},
	eternal: { name: 'EternalAnimes', qualities: { '720': '1280x720' }, formatName:
	function(anime, episode, quality) {
		return `"${anime}_${episode}_${quality}"`
	}}/*,
	davinci: { name: 'Squark', qualities: { '720': '720p', '1080': '1080p' }, currentlyReleasing: [], formatName:
	function(anime, episode) {
		return anime + ' - ' + episode;
	}}*/
};