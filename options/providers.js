module.exports = {
	horrible: { name: 'HorribleSubs', qualities: { '480': '[480p]', '720': '[720p]', '1080': '[1080p]' }, currentlyReleasing: [], formatName:
	function(anime, episode, quality) {
		let resultQuery = '';

		if (anime) resultQuery += `"${anime}"`;
		if (episode) resultQuery += `" - ${episode}"`;
		if (quality) resultQuery += `"${this.qualities[quality]}"`;

		return resultQuery.split('undefined').join('');
	}},
	commie: { name: 'Commie', qualities: {  }, currentlyReleasing: [], formatName:
	function(anime, episode, quality) {
		return `"${anime} - ${episode}"`
	}},
	eternal: { name: 'EternalAnimes', qualities: { '720': '1280x720' }, currentlyReleasing: [], formatName:
	function(anime, episode, quality) {
		return `"${anime}_${episode}_${quality}"`
	}}/*,
	davinci: { name: 'Squark', qualities: { '720': '720p', '1080': '1080p' }, currentlyReleasing: [], formatName:
	function(anime, episode) {
		return anime + ' - ' + episode;
	}}*/
};