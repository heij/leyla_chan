const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

const adapter = new FileAsync('./resources/data.json', {
	defaultValue: {	data: { users: {}, fansubs: {} } }
});

module.exports = () => {
	return new Promise(async (resolve, reject) => {
		try {
			resolve(await low(adapter));
		} catch (err) {
			reject(err);
		}
	});
}