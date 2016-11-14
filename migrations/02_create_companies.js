
exports.up = function(knex, Promise) {
  return knex.schema.createTable('companies', function (table) {
    table.increments();
    table.string('company_name').defaultTo('').notNullable();
    table.string('naics').defaultTo('');
    table.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('companies');
};
