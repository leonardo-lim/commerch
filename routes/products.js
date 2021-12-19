const { Product } = require('../models/product');
const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    const uploadError = isValid ? null : new Error('Invalid image type');
    cb(uploadError, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.split(' ').join('-');
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  }
});

const uploadOptions = multer({ storage: storage });

// Show All Products
router.get('/', async (req, res) => {
  let filter = {};

  if (req.query.categories) {
    filter = { category: req.query.categories.split(',') };
  }
  const productList = await Product.find(filter).populate('category');

  if (!productList) {
    res.status(500).json({ success: false });
  } else {
    res.send(productList);
  }
});

// Show a Product
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category');

  if (!product) {
    res.status(500).json({ message: 'The product with the given ID was not found' });
  } else {
    res.status(200).send(product);
  }
});

// Add Product
router.post('/', uploadOptions.single('image'), async (req, res) => {
  const category = await Category.findById(req.body.category);

  if (!category) {
    res.status(400).send('Invalid category');
  } else {
    const file = req.file;

    if (!file) {
      res.status(400).send('No image on request');
    } else {
      const basePath = `${req.protocol}://${req.get('host')}/public/uploads`;
      const fileName = req.file.filename;
      const imagePath = `${basePath}/${fileName}`;

      let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: imagePath,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
      });

      product = await product.save();

      if (!product) {
        res.status(500).send('Product can\'t be created');
      } else {
        res.send(product);
      }
    }
  }
});

// Edit Product
router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send('Invalid product ID');
  } else {
    const category = await Category.findById(req.body.category);

    if (!category) {
      res.status(400).send('Invalid category');
    } else {
      const product = await Product.findById(req.params.id);

      if (!product) {
        res.status(400).send('Invalid product');
      } else {
        const file = req.file;
        let imagePath;

        if (file) {
          const fileName = file.filename;
          const basePath = `${req.protocol}://${req.get('host')}/public/uploads`;
          imagePath = `${basePath}/${fileName}`;
        } else {
          imagePath = product.image;
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: imagePath,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
      }, {
        new: true
      });

      if (!updatedProduct) {
        res.status(400).send('Product can\'t be updated');
      } else {
        res.send(updatedProduct);
      }
    }
  }
});

// Delete Product
router.delete('/:id', (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then(product => {
      if (product) {
        return res.status(200).json({ success: true, message: 'Product deleted' });
      } else {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
    })
    .catch(error => {
      return res.status(400).json({ success: false, error: error });
    });
});

// Count All Products
router.get('/get/count', async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) {
    res.status(500).json({ success: false });
  } else {
    res.send({
      productCount: productCount
    });
  }
});

// Show Featured Products
router.get('/get/featured', async (req, res) => {
  const products = await Product.find({ isFeatured: true });

  if (!products) {
    res.status(500).json({ success: false });
  } else {
    res.send({
      products: products
    });
  }
});

// Show Some Featured Products
router.get('/get/featured/:count', async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({ isFeatured: true }).limit(parseInt(count));

  if (!products) {
    res.status(500).json({ success: false });
  } else {
    res.send({
      products: products
    });
  }
});

// Edit Product Gallery Images
router.put('/galleryimages/:id', uploadOptions.array('images', 10), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send('Invalid product ID');
  } else {
    const files = req.files;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads`;
    let imagePaths = [];

    if (files) {
      files.map(file => {
        imagePaths.push(`${basePath}/${file.filename}`);
      });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, {
      images: imagePaths
    }, {
      new: true
    });

    if (!product) {
      res.status(400).send('Product can\'t be updated');
    } else {
      res.send(product);
    }
  }
});

module.exports = router;