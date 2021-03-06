const { Client } = require("pg");
const DB_NAME = "localhost:5432/grace-shopper-db";
const DB_URL = process.env.DATABASE_URL || `postgres://${DB_NAME}`;
const client = new Client(DB_URL);
const bcrypt = require("bcrypt");
const SALT_COUNT = 10;

async function createProduct({
  name,
  description,
  price,
  quantity,
  category,
  inventory,
}) {
  try {
    const {
      rows: [product],
    } = await client.query(
      `
        INSERT INTO products (name, description, price, quantity, category, inventory)
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `,
      [name, description, price, quantity, category, inventory]
    );

    return product;
  } catch (error) {
    throw error;
  }
}

async function getProductById(id) {
  try {
    const {
      rows: [product],
    } = await client.query(`
            SELECT *
            FROM products
            WHERE id=${id};
          `);

    return product;
  } catch (error) {
    throw error;
  }
}

async function getAllProducts() {
  try {
    const { rows: id } = await client.query(`
        SELECT id 
        FROM products;
      `);

    const products = await Promise.all(
      id.map((product) => getProductById(product.id))
    );
    return products;
  } catch (error) {
    throw error;
  }
}
async function updateProduct(productId, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  try {
    if (setString.length > 0) {
      await client.query(
        `
          UPDATE products
          SET ${setString}
          WHERE id=${productId}
          RETURNING *;
        `,
        Object.values(fields)
      );
    }

    return await getProductById(productId);
  } catch (error) {
    throw error;
  }
}

async function deleteProduct(id) {
  try {
    const productId = getProductById(id);
    if (!productId) {
      throw new Error({ message: "NoProductError" });
    }

    const {
      rows: [product],
    } = await client.query(
      `
          DELETE FROM products
          WHERE id=$1
          RETURNING *;
          `,
      [id]
    );
    return product;
  } catch (error) {
    throw error;
  }
}

async function productByCategory(category) {
  try {
    const { rows: products } = await client.query(
      `
        SELECT id
        FROM products
        WHERE products.category=$1;
      `,
      [category]
    );

    return await Promise.all(
      products.map((product) => getProductById(product.id))
    );
  } catch (error) {
    throw error;
  }
}

async function createOrder({ date_ordered, total_price }) {
  try {
    const {
      rows: [order],
    } = await client.query(
      `
      INSERT INTO orders(date_ordered, total_price) 
      VALUES($1, $2)
      RETURNING *;
    `,
      [date_ordered, total_price]
    );

    return order;
  } catch (error) {
    throw error;
  }
}

async function getAllOrders() {
  try {
    const { rows: orderId } = await client.query(`
        SELECT id
        FROM orders;
      `);

    const orders = await Promise.all(
      orderId.map((order) => getOrderById(order.id))
    );

    return orders;
  } catch (error) {
    throw error;
  }
}

async function getOrderByUser(userId) {
  try {
    const { rows: orderId } = await client.query(`
        SELECT id 
        FROM orders 
        WHERE "usersId"=${userId};
      `);

    const orders = await Promise.all(
      orderId.map((order) => getOrderById(order.id))
    );

    return orders;
  } catch (error) {
    throw error;
  }
}

async function getOrderById(id) {
  try {
    const {
      rows: [order],
    } = await client.query(
      `
      SELECT * FROM orders
      WHERE id=$1
      `,
      [id]
    );
    return order;
  } catch (error) {
    throw error;
  }
}

async function createCart(orderId, productId) {
  try {
    await client.query(
      `
      INSERT INTO cart("orderId", "productId")
      VALUES ($1, $2)
      RETURNING *
    `,
      [orderId, productId]
    );
  } catch (error) {
    throw error;
  }
}

async function addCartProductsToOrder({ orderId, productId }) {
  try {
    const {
      rows: [cart],
    } = await client.query(
      `
      INSERT INTO cart("orderId", "productId") 
      VALUES($1, $2) 
      RETURNING *;
    `,
      [orderId, productId]
    );

    return cart;
  } catch (error) {
    throw error;
  }
}

const deleteOrder = async (id) => {
  try {
    const {
      rows: [order],
    } = await client.query(
      `
      DELETE FROM orders
      WHERE id = $1
      RETURNING *;
      `,
      [id]
    );

    await client.query(
      `
      DELETE FROM cart
      WHERE "orderId" = $1
      `,
      [id]
    );

    return order;
  } catch (error) {
    throw error;
  }
};

async function createUser({
  email,
  username,
  password,
  address,
  city,
  state,
  zip,
  isAdmin = false,
  isUser = false,
}) {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
    password = hashedPassword;
    const {
      rows: [user],
    } = await client.query(
      `
      INSERT INTO users (email, username, password, address, city, state, zip, "isAdmin", "isUser")
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      ON CONFLICT (username) DO NOTHING
      RETURNING *;
        `,
      [email, username, password, address, city, state, zip, isAdmin, isUser]
    );

    delete user.password;
    console.log(user, "my user");
    return user;
  } catch (error) {
    throw error;
  }
}

async function getAllUsers() {
  try {
    const { rows } = await client.query(`
        SELECT id, username, email
        FROM users;
      `);

    return rows;
  } catch (error) {
    console.error("could not get all users", error);
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
      SELECT id, username, email
      FROM users
      WHERE id=${userId}
        `
    );

    return user;
  } catch (error) {
    console.error("could not get user by id", error);
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
        SELECT *
        FROM users
        WHERE email=$1
      `,
      [email]
    );

    return user;
  } catch (error) {
    console.error("could not get user email", error);
    throw error;
  }
}

async function updateUser(userId, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");
  try {
    if (setString.length > 0) {
      if ("password" in fields) {
        fields.password = await bcrypt.hash(fields.password, SALT_COUNT);
      }

      await client.query(
        `
        UPDATE users
        SET ${setString}
        WHERE id=${userId}
        RETURNING *;
      `,
        Object.values(fields)
      );
    }
    return await getUserById(userId);
  } catch (error) {
    console.error("could not update user", error);
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
      SELECT *
      FROM users
      WHERE username=$1
        `,
      [username]
    );
    return user;
  } catch (error) {
    console.error("could not get user by username", error);
    throw error;
  }
}

module.exports = {
  client,
  createProduct,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
  productByCategory,
  createOrder,
  getAllOrders,
  getOrderByUser,
  getOrderById,
  deleteOrder,
  addCartProductsToOrder,
  createCart,
  createUser,
  getUserByEmail,
  getAllUsers,
  getUserById,
  updateUser,
  getUserByUsername,
};
