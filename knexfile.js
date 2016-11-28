module.exports = {

  development: {
    client: 'postgresql',
    connection: 'postgres://localhost/tradetrack-dev',
    pool: {
      min: 1,
      max: 5
    }
  },

  test: {
    client: 'postgresql',
    connection: 'postgres://localhost/tradetrack-test',
    pool: {
      min: 1,
      max: 5
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};
