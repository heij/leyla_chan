 module.exports = {
	horrible: { name: 'HorribleSubs', qualityFormat: true, currentlyReleasing: [], formatName:
	function(anime, episode) {
		return anime + ' - ' + episode;
	}},
	commie: { name: 'Commie', qualityFormat: false, currentlyReleasing: [], formatName:
	function(anime, episode) {
		return anime + ' - ' + episode;
	}},
	eternal: { name: 'EternalAnimes', qualityFormat: true, currentlyReleasing: [], formatName:
	function(anime, episode) {
		return anime + '_' + episode;
	}},
	davinci: { name: 'Squark', qualityFormat: true, currentlyReleasing: [], formatName:
	function(anime, episode) {
		return anime + ' - ' + episode;
	}}
};