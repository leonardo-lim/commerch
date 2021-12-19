const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');
const express = require('express');
const router = express.Router();

// Show All Orders
router.get('/', async (req, res) => {
  const orderList = await Order.find().populate('user', 'name').sort({ 'dateOrdered': -1 });

  if (!orderList) {
    res.status(500).json({ success: false });
  } else {
    res.send(orderList);
  }
});

// Show a Order
router.get('/:id', async(req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name').populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } });

  if (!order) {
    res.status(500).json({ message: 'The order with the given ID was not found' });
  } else {
    res.status(200).send(order);
  }
});

// Add Order
router.post('/', async (req, res) => {
  const orderItemsIds = await Promise.all(req.body.orderItems.map(async orderItem => {
    let newOrderItem = new OrderItem({
      quantity: orderItem.quantity,
      product: orderItem.product
    });

    newOrderItem = await newOrderItem.save();

    return newOrderItem._id;
  }));

  const totalPrices = await Promise.all(orderItemsIds.map(async orderItemId => {
    const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
    const totalPrice = orderItem.product.price * orderItem.quantity;
    return totalPrice;
  }));

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: orderItemsIds,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user
  });

  order = await order.save();

  if (!order) {
    res.status(404).send('Order can\'t be created');
  } else {
    res.send(order);
  }
});

// Edit Order
router.put('/:id', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });

  if (!order) {
    res.status(400).send('Order can\'t be updated');
  } else {
    res.send(order);
  }
});

// Delete Order
router.delete('/:id', (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async order => {
      if (order) {
        await order.orderItems.map(async orderItem => {
          await OrderItem.findByIdAndRemove(orderItem);
        });

        return res.status(200).json({ success: true, message: 'Order deleted' });
      } else {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
    })
    .catch(error => {
      return res.status(400).json({ success: false, error: error });
    });
});

// Count All Orders
router.get('/get/count', async (req, res) => {
  const orderCount = await Order.countDocuments();

  if (!orderCount) {
    res.status(500).json({ success: false });
  } else {
    res.send({
      orderCount: orderCount
    });
  }
});

// Show Total Sales
router.get('/get/totalsales', async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum : '$totalPrice' } } }
  ]);

  if (!totalSales) {
    res.status(400).send('Order sales can\'t be generated');
  } else {
    res.send({ totalSales: totalSales.pop().totalSales });
  }
});

// Show a User's Orders
router.get('/get/userorders/:id', async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.id }).populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } }).sort({ 'dateOrdered': -1 });

  if (!userOrderList) {
    res.status(500).json({ success: false });
  } else {
    res.send(userOrderList);
  }
});

module.exports = router;