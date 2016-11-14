
exports.up = function(knex, Promise) {
  return knex.schema.createTable('tag_types', function (table) {
    table.increments();
    table.string('type_name').defaultTo('').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('tag_types');
};
