const db = require('./../../models')
const Cart = db.Cart
const CartItem = db.CartItem
const Product = db.Product

const cartController = {
  // 取得單一購物車的資料
  getCart: async (req, res) => {
    const cart = await Cart.findOne({
      where: { id: req.session.cartId },
      include: [{ model: Product, as: 'items' }]
    })

    const total_amount =
      cart.items.length > 0
        ? cart.items.map(d => d.sell_price * d.CartItem.quantity).reduce((a, b) => a + b)
        : 0

    return res.json({
      cart,
      total_amount,
      status: 'success',
      message: '成功取得購物車的資料'
    })
  },
  // 增加購物車內商品數量
  addItemToCart: async (req, res) => {
    try {
      const cartItem = await CartItem.findAll({
        where: { CartId: req.params.cartId, id: req.params.id }
      })

      cartItem[0].quantity += 1
      cartItem[0].save()

      await res.json({
        cartItem
      })
    } catch (error) {
      console.log(error)
    }
  },
  // 減少購物車內商品數量
  subItemFromCart: async (req, res) => {
    try {
      const cartItem = await CartItem.findAll({
        where: { CartId: req.params.cartId, id: req.params.id }
      })

      cartItem[0].quantity -= 1
      cartItem[0].save()

      await res.json({
        cartItem
      })
    } catch (error) {
      console.log(error)
    }
  },
  // 刪除購物車內的商品
  deleteItemFromCart: async (req, res) => {
    try {
      const cartItem = await CartItem.destroy({
        where: { CartId: req.params.cartId, id: req.params.id }
      })

      await res.json({
        status: 'success',
        message: '已刪除成功'
      })
    } catch (error) {
      console.log(error)
    }
  },

  postCart: async (req, res) => {
    if (!req.body.productId) {
      return res.json({
        status: 'error',
        message: 'req.body 缺少 productId'
      })
    }

    let [cart, isCartNew] = await Cart.findOrCreate({
      where: {
        id: req.session.cartId || 0
      }
    })

    let [cartItem, isCartItemNew] = await CartItem.findOrCreate({
      where: {
        CartId: cart.id,
        ProductId: req.body.productId
      }
    })

    isCartItemNew
      ? (cartItem.quantity = parseInt(req.body.quantity) || 1)
      : (cartItem.quantity = cartItem.quantity + (parseInt(req.body.quantity) || 1))

    await cartItem.save()
    req.session.cartId = cart.id
    req.session.save()
    res.json({
      status: 'success',
      cart,
      cartItem
    })
  },
  // 更新購物車資料
  putCart: async (req, res) => {
    console.log('前端傳來的配送方式', req.body.shipping_method)

    if (!req.body.shipping_method) {
      return res.json({
        status: 'error',
        message: '請填寫配送方式'
      })
    }

    await Cart.update(
      { shipping_method: req.body.shipping_method },
      { where: { id: req.session.cartId } }
    )

    const cart = await Cart.findOne({ where: { id: req.session.cartId } })

    return res.json({
      cart,
      status: 'success',
      message: '已更新購物車資料(配送方式)'
    })
  }
}

module.exports = cartController
