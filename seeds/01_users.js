var users = [{
  id: 1,
  first_name: 'Rob',
  last_name: 'Conner',
  user_name: 'bigrobsf',
  email: 'rjconner@mac.com',
  hashed_password: '$2a$12$C9AYYmcLVGYlGoO4vSZTPud9ArJwbGRsJ6TUsNULzR48z8fOnTXbS',  // youreawizard
  created_at: new Date('2016-11-13 12:26:16 UTC'),
  updated_at: new Date('2016-11-13 12:26:16 UTC')
}, {
  id: 2,
  first_name: 'David',
  last_name: 'Shin',
  user_name: 'datadave',
  email: 'davidshin444@gmail.com',
  hashed_password: '$2a$12$C9AYYmcLVGYlGoO4vSZTPud9ArJwbGRsJ6TUsNULzR48z8fOnTXbS',  // youreawizard
  created_at: new Date('2016-11-13 12:26:16 UTC'),
  updated_at: new Date('2016-11-13 12:26:16 UTC')
}];

exports.seed = function(knex, Promise) {
	var seedPromises = [];

	for (var index in users) {
    	seedPromises.push(knex('users').insert(users[index]));
  }
    // Delete all, then run the updates
    return knex('users').del().then(function() {
        return Promise.all(seedPromises);
  	});
};
