/* eslint-disable camelcase */
// const properties = require('./json/properties.json');
// const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */


const getUserWithEmail = function(email) {

  const queryString = `
  SELECT * FROM users
  WHERE email = $1;
  `;
  const data = [email];

  return pool
    .query(queryString, data)
    .then((result) => result.rows[0])
    .catch((err) => console.log(err.message));

};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */


const getUserWithId = function(id) {

  const queryString =  `
  SELECT * FROM users
  WHERE id = $1;
  `;

  return pool
    .query(queryString, [id])
    .then((result) => result.rows[0])
    .catch((err) => console.log(err.message));

};

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */


const addUser = function(user) {

  const queryString = `
  INSERT INTO users (
    name, email, password) 
    VALUES (
    $1, $2, $3);
  `;

  const values = [user.name, user.email, user.password];

  return pool
    .query(queryString, values)
    .then((result) => result.rows)
    .catch((err) => console.log(err.message));

};

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */


const getAllReservations = function(guest_id, limit = 10) {

  const queryString = `
  SELECT * FROM reservations
  WHERE guest_id = $1
  LIMIT $2
  `;

  const values = [guest_id, limit];

  return pool
    .query(queryString, values)
    .then((result) => result.rows)
    .catch((err) => console.log(err.message));

};

exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = (options, limit = 10) => {

  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1 = 1
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` AND city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += ` AND properties.owner_id = $${queryParams.length}`;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += ` AND properties.cost_per_night >= $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += ` AND properties.cost_per_night <= $${queryParams.length}`;
  }

  queryString += ` 
  GROUP BY properties.id
  `;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return pool
    .query(
      queryString, queryParams)
    .then((result) => result.rows)
    .catch((err) => console.log(err.message));
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

const addProperty = function(property) {

  const queryString = `
  INSERT INTO properties (
    title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city, province, post_code, owner_id) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
  `;

  const keys = Object.keys(property);

  const queryParams = [];

  keys.forEach(x => {

    queryParams.push(property[x]);

  });

  console.log(queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then((result) => result.rows)
    .catch((err) => console.log(err.message));

};

exports.addProperty = addProperty;

const addReservation = function(reservation) {

  const queryString = `
  INSERT INTO reservations (
    start_date, end_date, guest_id, property_id) 
    VALUES (
    $1, $2, $3, $4)
  RETURNING *;
  `;

  const keys = Object.keys(reservation);

  const queryParams = [];

  keys.forEach(x => {

    queryParams.push(reservation[x]);

  });

  return pool
    .query(queryString, queryParams)
    .then((result) => result.rows)
    .catch((err) => console.log(err.message));

};

exports.addReservation = addReservation;