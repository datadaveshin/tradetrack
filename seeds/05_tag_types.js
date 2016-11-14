var tag_types = [{
  id: 1,
  type_name: 'group',
  created_at: new Date('2016-11-13 12:26:16 UTC'),
  updated_at: new Date('2016-11-13 12:26:16 UTC')
}, {
  id: 2,
  type_name: 'pattern',
  created_at: new Date('2016-11-13 12:26:16 UTC'),
  updated_at: new Date('2016-11-13 12:26:16 UTC')
}, {
  id: 3,
  type_name: 'candle',
  created_at: new Date('2016-11-13 12:26:16 UTC'),
  updated_at: new Date('2016-11-13 12:26:16 UTC')
}, {
  id: 4,
  type_name: 'bounce',
  created_at: new Date('2016-11-13 12:26:16 UTC'),
  updated_at: new Date('2016-11-13 12:26:16 UTC')
}, {
  id: 5,
  type_name: 'scan',
  created_at: new Date('2016-11-13 12:26:16 UTC'),
  updated_at: new Date('2016-11-13 12:26:16 UTC')
}, {
  id: 6,
  type_name: 'guru',
  created_at: new Date('2016-11-13 12:26:16 UTC'),
  updated_at: new Date('2016-11-13 12:26:16 UTC')
}];

exports.seed = function(knex, Promise) {
	var seedPromises = [];

	for (var index in tag_types) {
    	seedPromises.push(knex('tag_types').insert(tag_types[index]));
  }
    // Delete all, then run the updates
    return knex('tag_types').del().then(function() {
        return Promise.all(seedPromises);
  	});
};
