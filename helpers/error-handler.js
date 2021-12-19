function errorHandler(err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: 'User is not authorized' });
  } else {
    res.status(500).json(err);
  }
}

module.exports = errorHandler;